import { describe, expect, it } from "vitest";
import type { City } from "../weather/types";
import { shouldShowCityLabel } from "./labelVisibility";

const city: City = {
  id: "1",
  adcode: "1",
  name: "示例市",
  shortName: "示例",
  province: "示例省",
  longitude: 120,
  latitude: 30,
  importance: 20,
  aliases: ["示例市", "示例"],
};

describe("shouldShowCityLabel", () => {
  it("always shows selected and major cities", () => {
    expect(shouldShowCityLabel(city, 1, "1")).toBe(true);
    expect(shouldShowCityLabel({ ...city, importance: 90 }, 1, null)).toBe(true);
  });

  it("reveals ordinary city labels after zooming in", () => {
    expect(shouldShowCityLabel(city, 1.5, null)).toBe(false);
    expect(shouldShowCityLabel(city, 2.2, null)).toBe(true);
  });
});
