import { useCallback, useEffect, useRef, useState } from "react";
import { readWeatherCache, writeWeatherCache } from "../lib/weather/cache";
import { fetchWeatherSummaries } from "../lib/weather/openMeteo";
import type { City, CityWeatherSummary, WeatherDatasetState } from "../lib/weather/types";

const INITIAL_STATE: WeatherDatasetState = {
  weatherByCity: {},
  loadedCount: 0,
  totalCount: 0,
  failedBatchCount: 0,
  fetchedAt: null,
  isLoading: true,
  isRefreshing: false,
  globalError: null,
};

function errorSummary(cityId: string, fetchedAt: string): CityWeatherSummary {
  return {
    cityId,
    status: "error",
    current: null,
    daily: [],
    dryDays: 0,
    availableDays: 0,
    fetchedAt,
  };
}

function freshCount(weatherByCity: Record<string, CityWeatherSummary>) {
  return Object.values(weatherByCity).filter((summary) => summary.status === "fresh").length;
}

function millisecondsUntilNextChinaDay(now = new Date()) {
  const chinaOffset = 8 * 60 * 60 * 1000;
  const chinaNow = new Date(now.getTime() + chinaOffset);
  const nextChinaMidnightUtc =
    Date.UTC(chinaNow.getUTCFullYear(), chinaNow.getUTCMonth(), chinaNow.getUTCDate() + 1) -
    chinaOffset;
  return Math.max(1000, nextChinaMidnightUtc - now.getTime() + 1500);
}

export function useWeatherDataset(cities: City[], version: string) {
  const [state, setState] = useState<WeatherDatasetState>(INITIAL_STATE);
  const requestRef = useRef(0);
  const failedCityIdsRef = useRef<string[]>([]);

  const refresh = useCallback(
    async (options: { force?: boolean; signal?: AbortSignal; cityIds?: string[] } = {}) => {
      if (!cities.length) return;
      const requestedCities = options.cityIds?.length
        ? cities.filter((city) => options.cityIds?.includes(city.id))
        : cities;
      if (!requestedCities.length) return;
      const requestId = ++requestRef.current;
      const cached = readWeatherCache(version);
      if (cached && !options.force) {
        setState({
          weatherByCity: cached.weatherByCity,
          loadedCount: freshCount(cached.weatherByCity),
          totalCount: cities.length,
          failedBatchCount: 0,
          fetchedAt: cached.savedAt,
          isLoading: false,
          isRefreshing: !cached.isFresh,
          globalError: null,
        });
        if (cached.isFresh) return;
      } else {
        setState((current) => ({
          ...current,
          totalCount: cities.length,
          isLoading: Object.keys(current.weatherByCity).length === 0,
          isRefreshing: Object.keys(current.weatherByCity).length > 0,
          globalError: null,
        }));
      }

      const progressive: Record<string, CityWeatherSummary> = {};
      const result = await fetchWeatherSummaries(requestedCities, {
        signal: options.signal,
        onBatch: (batchWeather) => {
          Object.assign(progressive, batchWeather);
          if (requestRef.current !== requestId) return;
          setState((current) => ({
            ...current,
            weatherByCity: { ...current.weatherByCity, ...batchWeather },
            loadedCount: freshCount({ ...current.weatherByCity, ...batchWeather }),
          }));
        },
      });
      if (requestRef.current !== requestId) return;
      failedCityIdsRef.current = result.failedCityIds;
      const cachedAfterRequest = readWeatherCache(version);
      const previous = cachedAfterRequest?.weatherByCity ?? {};
      const cacheable = { ...previous, ...progressive, ...result.weatherByCity };
      if (Object.keys(result.weatherByCity).length > 0) {
        writeWeatherCache(version, cacheable);
      }
      const failureStates = Object.fromEntries(
        result.failedCityIds.map((cityId) => [
          cityId,
          previous[cityId]
            ? { ...previous[cityId], status: "stale" as const }
            : errorSummary(cityId, result.fetchedAt),
        ]),
      );
      const merged = { ...cacheable, ...failureStates };
      const successfulCount = Object.keys(result.weatherByCity).length;
      const loadedCount = freshCount(merged);
      setState({
        weatherByCity: merged,
        loadedCount,
        totalCount: cities.length,
        failedBatchCount: result.failedBatchCount,
        fetchedAt: successfulCount > 0 ? result.fetchedAt : (cachedAfterRequest?.savedAt ?? null),
        isLoading: false,
        isRefreshing: false,
        globalError:
          successfulCount === 0
            ? Object.keys(previous).length > 0
              ? "本次更新失败，正在显示缓存天气"
              : "暂时无法获取全国天气，请稍后重试"
            : null,
      });
    },
    [cities, version],
  );

  useEffect(() => {
    const controller = new AbortController();
    refresh({ signal: controller.signal }).catch((error) => {
      if (controller.signal.aborted) return;
      setState((current) => ({
        ...current,
        isLoading: false,
        isRefreshing: false,
        globalError: error instanceof Error ? error.message : "天气加载失败",
      }));
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!cities.length) return;
    let active = true;
    let timer = 0;
    const scheduleMidnightRefresh = () => {
      timer = window.setTimeout(async () => {
        await refresh({ force: true }).catch(() => {});
        if (active) scheduleMidnightRefresh();
      }, millisecondsUntilNextChinaDay());
    };
    scheduleMidnightRefresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !readWeatherCache(version)?.isFresh) {
        refresh({ force: true }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [cities.length, refresh, version]);

  return {
    ...state,
    refresh: () =>
      refresh({
        force: true,
        cityIds: failedCityIdsRef.current.length ? failedCityIdsRef.current : undefined,
      }),
  };
}
