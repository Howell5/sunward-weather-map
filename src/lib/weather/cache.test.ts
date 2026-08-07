import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readWeatherCache, writeWeatherCache } from "./cache";
import type { CityWeatherSummary } from "./types";

const summary: CityWeatherSummary = {
  cityId: "310000",
  status: "fresh",
  current: null,
  daily: [],
  dryDays: 0,
  availableDays: 0,
  fetchedAt: "2026-08-07T02:00:00Z",
};

describe("weather cache", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("reads a recent cache as fresh", () => {
    const now = new Date("2026-08-07T02:00:00Z");
    writeWeatherCache("v1", { "310000": summary }, now);
    expect(readWeatherCache("v1", new Date("2026-08-07T02:20:00Z"))?.isFresh).toBe(true);
  });

  it("reads an older same-day cache as stale", () => {
    writeWeatherCache("v1", { "310000": summary }, new Date("2026-08-07T02:00:00Z"));
    const cached = readWeatherCache("v1", new Date("2026-08-07T02:40:00Z"));
    expect(cached?.isFresh).toBe(false);
    expect(cached?.weatherByCity["310000"].status).toBe("stale");
  });

  it("ignores malformed cache data", () => {
    localStorage.setItem("qingyu:weather:v1:v1:2026-08-07", "{broken");
    expect(readWeatherCache("v1", new Date("2026-08-07T02:00:00Z"))).toBeNull();
  });

  it("ignores structurally invalid cache data", () => {
    localStorage.setItem(
      "qingyu:weather:v1:v1:2026-08-07",
      JSON.stringify({
        version: "v1",
        dateKey: "2026-08-07",
        savedAt: "not-a-date",
        weatherByCity: { "310000": summary },
      }),
    );
    expect(readWeatherCache("v1", new Date("2026-08-07T02:00:00Z"))).toBeNull();
  });

  it("treats storage writes as best effort", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("quota");
    });
    expect(writeWeatherCache("v1", { "310000": summary })).toBe(false);
  });
});
