import { isCurrentlyDry } from "../weather/dryness";
import type { City, CityWeatherSummary, ViewMode } from "../weather/types";

export interface RegionMetric {
  name: string;
  cityCount: number;
  knownUnits: number;
  totalUnits: number;
  dryUnits: number;
  coverage: number;
  dryRatio: number | null;
}

export interface RegionVisual {
  name: string;
  metric: RegionMetric;
  itemStyle: {
    areaColor: string;
    borderColor: string;
    borderWidth: number;
    opacity: number;
  };
}

const REGION_COLORS = [
  "#244650",
  "#3b5d62",
  "#536e6b",
  "#718175",
  "#9a976e",
  "#b9a064",
  "#d4b568",
  "#ecd07b",
];

const UNKNOWN_COLOR = "#203b35";

interface GeoFeatureCollection {
  features?: Array<{ properties?: { name?: string } }>;
}

function isCurrentDry(weather: CityWeatherSummary): boolean | null {
  const current = weather.current;
  return isCurrentlyDry(current?.precipitation ?? null, current?.weatherCode ?? null);
}

function metricForCity(
  weather: CityWeatherSummary | undefined,
  mode: ViewMode,
): { dryUnits: number; knownUnits: number; totalUnits: number } {
  if (!weather || weather.status === "error" || weather.status === "unknown") {
    return { dryUnits: 0, knownUnits: 0, totalUnits: mode.type === "week" ? 7 : 1 };
  }
  if (mode.type === "week") {
    const days = weather.daily.slice(0, 7);
    return {
      dryUnits: days.filter((day) => day.isDry === true).length,
      knownUnits: days.filter((day) => day.isDry != null).length,
      totalUnits: 7,
    };
  }
  const day = mode.type === "now" ? isCurrentDry(weather) : weather.daily[mode.dayIndex]?.isDry;
  return { dryUnits: day === true ? 1 : 0, knownUnits: day == null ? 0 : 1, totalUnits: 1 };
}

export function buildRegionMetrics(
  cities: City[],
  weatherByCity: Record<string, CityWeatherSummary>,
  geoJson: object,
  mode: ViewMode,
): RegionMetric[] {
  const buckets = new Map<string, RegionMetric>();
  for (const feature of (geoJson as GeoFeatureCollection).features ?? []) {
    const name = feature.properties?.name;
    if (name) {
      buckets.set(name, {
        name,
        cityCount: 0,
        knownUnits: 0,
        totalUnits: 0,
        dryUnits: 0,
        coverage: 0,
        dryRatio: null,
      });
    }
  }
  for (const city of cities) {
    const metric = buckets.get(city.province);
    if (!metric) continue;
    const cityMetric = metricForCity(weatherByCity[city.id], mode);
    metric.cityCount += 1;
    metric.knownUnits += cityMetric.knownUnits;
    metric.totalUnits += cityMetric.totalUnits;
    metric.dryUnits += cityMetric.dryUnits;
  }
  return [...buckets.values()].map((metric) => ({
    ...metric,
    coverage: metric.totalUnits ? metric.knownUnits / metric.totalUnits : 0,
    dryRatio: metric.knownUnits ? metric.dryUnits / metric.knownUnits : null,
  }));
}

export function buildRegionVisuals(
  cities: City[],
  weatherByCity: Record<string, CityWeatherSummary>,
  geoJson: object,
  mode: ViewMode,
  dryHighlight: boolean,
): RegionVisual[] {
  return buildRegionMetrics(cities, weatherByCity, geoJson, mode).map((metric) => {
    const hasEnoughData = metric.coverage >= 0.25 && metric.dryRatio != null;
    const colorIndex = hasEnoughData
      ? Math.min(
          REGION_COLORS.length - 1,
          Math.round((metric.dryRatio ?? 0) * (REGION_COLORS.length - 1)),
        )
      : 0;
    return {
      name: metric.name,
      metric,
      itemStyle: {
        areaColor: hasEnoughData ? REGION_COLORS[colorIndex] : UNKNOWN_COLOR,
        borderColor: dryHighlight ? "rgba(245, 229, 178, 0.35)" : "rgba(181, 211, 193, 0.22)",
        borderWidth: dryHighlight ? 0.9 : 0.7,
        opacity: hasEnoughData ? (dryHighlight ? 0.84 : 0.56) + metric.coverage * 0.08 : 0.42,
      },
    };
  });
}
