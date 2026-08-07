import { describe, expect, it } from "vitest";
import type { City, CityWeatherSummary } from "../weather/types";
import { buildRegionMetrics, buildRegionVisuals } from "./regionEncoding";

const geoJson = {
  type: "FeatureCollection",
  features: [{ properties: { name: "测试省" } }, { properties: { name: "无数据省" } }],
};

const cities: City[] = [
  {
    id: "1",
    adcode: "1",
    name: "晴城",
    shortName: "晴城",
    province: "测试省",
    longitude: 110,
    latitude: 30,
    importance: 20,
    aliases: [],
  },
  {
    id: "2",
    adcode: "2",
    name: "雨城",
    shortName: "雨城",
    province: "测试省",
    longitude: 111,
    latitude: 30,
    importance: 20,
    aliases: [],
  },
];

function summary(id: string, isDry: boolean): CityWeatherSummary {
  return {
    cityId: id,
    status: "fresh",
    current: {
      time: "2026-08-07T12:00",
      temperature: 30,
      apparentTemperature: 30,
      humidity: 60,
      precipitation: 0,
      weatherCode: 1,
      windSpeed: 8,
    },
    daily: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-08-${String(7 + index).padStart(2, "0")}`,
      weatherCode: isDry ? 1 : 61,
      temperatureMax: 30,
      temperatureMin: 22,
      precipitationSum: isDry ? 0 : 2,
      precipitationHours: isDry ? 0 : 2,
      precipitationProbabilityMax: isDry ? 10 : 80,
      windSpeedMax: 10,
      isDry,
    })),
    dryDays: isDry ? 7 : 0,
    availableDays: 7,
    fetchedAt: "2026-08-07T04:00:00Z",
  };
}

describe("regionEncoding", () => {
  it("aggregates city-day weather without treating missing regions as dry", () => {
    const metrics = buildRegionMetrics(
      cities,
      { "1": summary("1", true), "2": summary("2", false) },
      geoJson,
      { type: "week" },
    );
    expect(metrics.find((metric) => metric.name === "测试省")?.dryRatio).toBe(0.5);
    expect(metrics.find((metric) => metric.name === "无数据省")?.dryRatio).toBeNull();
  });

  it("makes dry regions brighter in the highlighted view", () => {
    const visuals = buildRegionVisuals(
      cities,
      { "1": summary("1", true), "2": summary("2", false) },
      geoJson,
      { type: "week" },
      true,
    );
    const tested = visuals.find((visual) => visual.name === "测试省");
    const unknown = visuals.find((visual) => visual.name === "无数据省");
    expect(tested?.itemStyle.areaColor).toBe("#9a976e");
    expect(tested?.itemStyle.opacity).toBeGreaterThan(unknown?.itemStyle.opacity ?? 0);
  });
});
