import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWeatherSummaries } from "./openMeteo";
import type { City } from "./types";

function city(index: number): City {
  return {
    id: String(index),
    adcode: String(index),
    name: `城市${index}`,
    shortName: `城${index}`,
    province: "测试省",
    longitude: 100 + index / 100,
    latitude: 30 + index / 100,
    importance: 1,
    aliases: [],
  };
}

function payload() {
  return {
    timezone: "Asia/Tokyo",
    current: {
      time: "2026-08-07T12:00",
      temperature_2m: 28,
      apparent_temperature: 30,
      relative_humidity_2m: 70,
      precipitation: 0,
      weather_code: 1,
      wind_speed_10m: 8,
    },
    daily: {
      time: Array.from(
        { length: 7 },
        (_, index) => `2026-08-${String(7 + index).padStart(2, "0")}`,
      ),
      weather_code: Array(7).fill(1),
      temperature_2m_max: Array(7).fill(30),
      temperature_2m_min: Array(7).fill(22),
      precipitation_sum: Array(7).fill(0),
      precipitation_hours: Array(7).fill(0),
      precipitation_probability_max: Array(7).fill(5),
      wind_speed_10m_max: Array(7).fill(12),
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchWeatherSummaries", () => {
  it("keeps successful batches and retries only a failed batch", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input));
      const count = url.searchParams.get("latitude")?.split(",").length ?? 0;
      if (count === 1) throw new Error("temporary failure");
      return {
        ok: true,
        json: async () => Array.from({ length: count }, payload),
      } as Response;
    });

    const result = await fetchWeatherSummaries(
      Array.from({ length: 51 }, (_, index) => city(index)),
    );

    expect(Object.keys(result.weatherByCity)).toHaveLength(50);
    expect(result.failedCityIds).toEqual(["50"]);
    expect(result.failedBatchCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain("timezone=auto");
    expect(result.weatherByCity["0"].timezone).toBe("Asia/Tokyo");
  });
});
