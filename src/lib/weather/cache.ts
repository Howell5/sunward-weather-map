import type { CityWeatherSummary, DataStatus } from "./types";

const CACHE_PREFIX = "qingyu:weather:v1";
export const WEATHER_CACHE_FRESH_MS = 30 * 60 * 1000;

interface CachePayload {
  version: string;
  dateKey: string;
  savedAt: string;
  weatherByCity: Record<string, CityWeatherSummary>;
}

function isWeatherRecord(value: unknown): value is Record<string, CityWeatherSummary> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([cityId, summary]) =>
      Boolean(summary) &&
      typeof summary === "object" &&
      (summary as CityWeatherSummary).cityId === cityId &&
      typeof (summary as CityWeatherSummary).status === "string" &&
      Array.isArray((summary as CityWeatherSummary).daily) &&
      typeof (summary as CityWeatherSummary).dryDays === "number" &&
      typeof (summary as CityWeatherSummary).availableDays === "number" &&
      typeof (summary as CityWeatherSummary).fetchedAt === "string",
  );
}

export function chinaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function cacheKey(version: string, dateKey: string): string {
  return `${CACHE_PREFIX}:${version}:${dateKey}`;
}

export function writeWeatherCache(
  version: string,
  weatherByCity: Record<string, CityWeatherSummary>,
  now = new Date(),
): boolean {
  try {
    const dateKey = chinaDateKey(now);
    const payload: CachePayload = {
      version,
      dateKey,
      savedAt: now.toISOString(),
      weatherByCity,
    };
    localStorage.setItem(cacheKey(version, dateKey), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function readWeatherCache(
  version: string,
  now = new Date(),
): { weatherByCity: Record<string, CityWeatherSummary>; isFresh: boolean; savedAt: string } | null {
  try {
    const dateKey = chinaDateKey(now);
    const raw = localStorage.getItem(cacheKey(version, dateKey));
    if (!raw) return null;
    const payload = JSON.parse(raw) as CachePayload;
    const savedAt = new Date(payload.savedAt);
    if (
      payload.version !== version ||
      payload.dateKey !== dateKey ||
      !Number.isFinite(savedAt.getTime()) ||
      !isWeatherRecord(payload.weatherByCity)
    ) {
      return null;
    }
    const age = now.getTime() - savedAt.getTime();
    const status: DataStatus = age <= WEATHER_CACHE_FRESH_MS ? "fresh" : "stale";
    const weatherByCity: Record<string, CityWeatherSummary> = Object.fromEntries(
      Object.entries(payload.weatherByCity).map(([id, weather]) => [
        id,
        {
          ...weather,
          status: (weather.status === "unknown" ? "unknown" : status) as DataStatus,
        },
      ]),
    );
    return { weatherByCity, isFresh: status === "fresh", savedAt: payload.savedAt };
  } catch {
    return null;
  }
}
