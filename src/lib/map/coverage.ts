import type { City, CityRegion } from "../weather/types";

export type CoverageMode = "china" | "nearby" | "overseas";

export const COVERAGE_OPTIONS: Array<{ value: CoverageMode; label: string }> = [
  { value: "china", label: "中国" },
  { value: "nearby", label: "中国 + 周边" },
  { value: "overseas", label: "海外" },
];

export function cityRegion(city: City): CityRegion {
  return city.region ?? "china";
}

export function filterCitiesByCoverage(cities: City[], mode: CoverageMode): City[] {
  return cities.filter((city) => {
    const region = cityRegion(city);
    if (mode === "china") return region === "china";
    if (mode === "nearby") return region === "china" || region === "nearby";
    return region !== "china";
  });
}

export function coverageDescription(mode: CoverageMode): string {
  if (mode === "china") return "中国城市天气";
  if (mode === "nearby") return "中国与周边天气";
  return "海外城市天气";
}

export function coverageMapConfig(mode: CoverageMode): {
  mapName: string;
  initialZoom: number;
  initialCenter: [number, number] | null;
  ariaLabel: string;
} {
  if (mode === "china") {
    return {
      mapName: "china-weather",
      initialZoom: 1.15,
      initialCenter: null,
      ariaLabel: "中国城市天气地图，点击城市标签查看详情",
    };
  }
  if (mode === "nearby") {
    return {
      mapName: "world-weather-nearby",
      initialZoom: 1.85,
      initialCenter: [108, 28],
      ariaLabel: "中国与周边城市天气地图，点击城市标签查看详情",
    };
  }
  return {
    mapName: "world-weather-overseas",
    initialZoom: 1.05,
    initialCenter: [20, 18],
    ariaLabel: "海外城市天气地图，点击城市标签查看详情",
  };
}
