import { describe, expect, it } from "vitest";
import { mergeHourlyHumidity, normalizeSummary } from "./normalize";

const response = {
  current: {
    time: "2026-08-07T12:00",
    temperature_2m: 28,
    apparent_temperature: 31,
    relative_humidity_2m: 70,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 12,
  },
  daily: {
    time: ["2026-08-07", "2026-08-08"],
    weather_code: [2, 61],
    temperature_2m_max: [31, 27],
    temperature_2m_min: [24, 23],
    precipitation_sum: [0.1, null],
    precipitation_hours: [1, 3],
    precipitation_probability_max: [10, 80],
    wind_speed_10m_max: [18, 24],
  },
};

describe("normalizeSummary", () => {
  it("normalizes current and daily data while preserving unknown days", () => {
    const result = normalizeSummary("310000", response, "2026-08-07T04:00:00Z");
    expect(result.current?.temperature).toBe(28);
    expect(result.daily[0].isDry).toBe(true);
    expect(result.daily[1].isDry).toBeNull();
    expect(result.dryDays).toBe(1);
    expect(result.availableDays).toBe(1);
  });

  it("aggregates selected-city hourly humidity by day", () => {
    const summary = normalizeSummary("310000", response, "2026-08-07T04:00:00Z");
    const merged = mergeHourlyHumidity(
      summary,
      ["2026-08-07T09:00", "2026-08-07T12:00", "2026-08-08T09:00"],
      [60, 80, 75],
    );
    expect(merged.daily[0].humidityMean).toBe(70);
    expect(merged.daily[1].humidityMean).toBe(75);
  });
});
