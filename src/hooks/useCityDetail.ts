import { useEffect, useState } from "react";
import { fetchCityHumidity } from "../lib/weather/openMeteo";
import type { City, CityWeatherSummary } from "../lib/weather/types";

const detailCache = new Map<string, CityWeatherSummary>();
const DETAIL_CACHE_LIMIT = 40;

export function useCityDetail(city: City | null, summary: CityWeatherSummary | null) {
  const [detail, setDetail] = useState<CityWeatherSummary | null>(summary);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryToken is an intentional manual reload signal.
  useEffect(() => {
    setDetail(summary);
    setError(null);
    setIsLoading(false);
    if (!city || !summary) return;
    const cached = detailCache.get(city.id);
    if (cached?.fetchedAt === summary.fetchedAt) {
      setDetail(cached);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    fetchCityHumidity(city, summary, controller.signal)
      .then((result) => {
        detailCache.delete(city.id);
        detailCache.set(city.id, result);
        if (detailCache.size > DETAIL_CACHE_LIMIT) {
          detailCache.delete(detailCache.keys().next().value as string);
        }
        setDetail(result);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "详情加载失败");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [city, retryToken, summary]);

  return {
    detail,
    isLoading,
    error,
    retry: () => setRetryToken((value) => value + 1),
  };
}
