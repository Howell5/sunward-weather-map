import { mergeHourlyHumidity, normalizeSummary } from "./normalize";
import type { City, CityWeatherSummary } from "./types";

const API_URL = "https://api.open-meteo.com/v1/forecast";
const BATCH_SIZE = 50;
const MAX_CONCURRENCY = 3;

const SUMMARY_CURRENT = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
].join(",");

const SUMMARY_DAILY = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_hours",
  "precipitation_probability_max",
  "wind_speed_10m_max",
].join(",");

export interface WeatherFetchResult {
  weatherByCity: Record<string, CityWeatherSummary>;
  failedCityIds: string[];
  failedBatchCount: number;
  fetchedAt: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

function summaryUrl(cities: City[]): string {
  const params = new URLSearchParams({
    latitude: cities.map((city) => city.latitude).join(","),
    longitude: cities.map((city) => city.longitude).join(","),
    current: SUMMARY_CURRENT,
    daily: SUMMARY_DAILY,
    timezone: "Asia/Shanghai",
    forecast_days: "7",
  });
  return `${API_URL}?${params}`;
}

async function fetchBatch(
  cities: City[],
  fetchedAt: string,
  signal?: AbortSignal,
): Promise<Record<string, CityWeatherSummary>> {
  const response = await fetch(summaryUrl(cities), { signal });
  if (!response.ok) throw new Error(`天气服务返回 ${response.status}`);
  const payload = await response.json();
  const responses = Array.isArray(payload) ? payload : [payload];
  if (responses.length !== cities.length) {
    throw new Error(`天气响应数量不匹配：${responses.length}/${cities.length}`);
  }
  return Object.fromEntries(
    cities.map((city, index) => [city.id, normalizeSummary(city.id, responses[index], fetchedAt)]),
  );
}

async function fetchBatchWithRetry(
  cities: City[],
  fetchedAt: string,
  signal?: AbortSignal,
): Promise<Record<string, CityWeatherSummary>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchBatch(cities, fetchedAt, signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 260));
      }
    }
  }
  throw lastError;
}

export async function fetchWeatherSummaries(
  cities: City[],
  options: {
    signal?: AbortSignal;
    onBatch?: (
      weather: Record<string, CityWeatherSummary>,
      completed: number,
      total: number,
    ) => void;
  } = {},
): Promise<WeatherFetchResult> {
  const batches = chunk(cities, BATCH_SIZE);
  const fetchedAt = new Date().toISOString();
  const weatherByCity: Record<string, CityWeatherSummary> = {};
  const failedCityIds: string[] = [];
  let failedBatchCount = 0;
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < batches.length) {
      const currentIndex = nextIndex++;
      const batch = batches[currentIndex];
      try {
        const weather = await fetchBatchWithRetry(batch, fetchedAt, options.signal);
        Object.assign(weatherByCity, weather);
        completed += 1;
        options.onBatch?.(weather, completed, batches.length);
      } catch (error) {
        if (options.signal?.aborted) throw error;
        failedBatchCount += 1;
        failedCityIds.push(...batch.map((city) => city.id));
        completed += 1;
        options.onBatch?.({}, completed, batches.length);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENCY, batches.length) }, () => worker()),
  );
  return { weatherByCity, failedCityIds, failedBatchCount, fetchedAt };
}

export async function fetchCityHumidity(
  city: City,
  summary: CityWeatherSummary,
  signal?: AbortSignal,
): Promise<CityWeatherSummary> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    hourly: "relative_humidity_2m",
    timezone: "Asia/Shanghai",
    forecast_days: "7",
  });
  const response = await fetch(`${API_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`城市详情返回 ${response.status}`);
  const payload = await response.json();
  return mergeHourlyHumidity(
    summary,
    payload.hourly?.time ?? [],
    payload.hourly?.relative_humidity_2m ?? [],
  );
}
