import { describe, expect, it } from "vitest";
import chinaGeoJsonRaw from "../../../public/data/china.geojson?raw";
import cityDataset from "../../../public/data/cities.json";

const chinaGeoJson = JSON.parse(chinaGeoJsonRaw) as {
  type: string;
  features: unknown[];
};

describe("static China map data", () => {
  it("contains a unique, valid nationwide city set", () => {
    expect(cityDataset.cities.length).toBeGreaterThan(300);
    expect(new Set(cityDataset.cities.map((city) => city.id)).size).toBe(cityDataset.cities.length);
    expect(
      cityDataset.cities.every(
        (city) =>
          city.longitude >= 70 &&
          city.longitude <= 138 &&
          city.latitude >= 15 &&
          city.latitude <= 55,
      ),
    ).toBe(true);
    expect(cityDataset.cities.filter((city) => city.id === "310000")).toHaveLength(1);
  });

  it("contains province-level map features", () => {
    expect(chinaGeoJson.type).toBe("FeatureCollection");
    expect(chinaGeoJson.features.length).toBeGreaterThan(30);
  });
});
