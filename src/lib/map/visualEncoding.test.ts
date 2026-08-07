import { describe, expect, it } from "vitest";
import type { CityWeatherSummary } from "../weather/types";
import { cityLabel, cityVisual, cityWeatherEmoji, dryWindowMatches } from "./visualEncoding";

const weather: CityWeatherSummary = {
  cityId: "310000",
  status: "fresh",
  current: {
    time: "2026-08-07T12:00",
    temperature: 28,
    apparentTemperature: 31,
    humidity: 72,
    precipitation: 0,
    weatherCode: 1,
    windSpeed: 10,
  },
  daily: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-08-${String(index + 7).padStart(2, "0")}`,
    weatherCode: index === 6 ? 61 : 1,
    temperatureMax: 30,
    temperatureMin: 22,
    precipitationSum: index === 6 ? 4 : 0,
    precipitationHours: index === 6 ? 4 : 0,
    precipitationProbabilityMax: index === 6 ? 80 : 10,
    windSpeedMax: 15,
    isDry: index !== 6,
  })),
  dryDays: 6,
  availableDays: 7,
  fetchedAt: "2026-08-07T04:00:00Z",
};

describe("visual encoding", () => {
  it("uses mode-specific labels", () => {
    expect(cityLabel(weather, { type: "now" })).toBe("28°");
    expect(cityLabel(weather, { type: "day", dayIndex: 0 })).toBe("30°/22°");
    expect(cityLabel(weather, { type: "week" })).toBe("6/7");
  });

  it("adds an emoji that matches the selected weather mode", () => {
    expect(cityWeatherEmoji(weather, { type: "week" })).toBe("🌤️");
    expect(cityWeatherEmoji(weather, { type: "now" })).toBe("🌤️");
    expect(cityWeatherEmoji(weather, { type: "day", dayIndex: 6 })).toBe("🌧️");
  });

  it("dims a non-dry city while keeping a selected city visible", () => {
    expect(cityVisual(weather, { type: "week" }, true, false, 7).opacity).toBe(0.12);
    expect(cityVisual(weather, { type: "week" }, true, true, 7).opacity).toBe(1);
  });

  it("uses the chosen consecutive dry-window threshold for highlighting", () => {
    expect(dryWindowMatches(weather, { type: "week" }, 2)).toBe(true);
    expect(dryWindowMatches(weather, { type: "week" }, 7)).toBe(false);
    expect(cityVisual(weather, { type: "week" }, true, false, 2).opacity).toBe(1);
    expect(cityVisual(weather, { type: "week" }, true, false, 7).opacity).toBe(0.12);
  });
});
