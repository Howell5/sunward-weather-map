import { describe, expect, it } from "vitest";
import type { City } from "../weather/types";
import { nearestCity } from "./nearestCity";

const cities: City[] = [
  {
    id: "sh",
    adcode: "310000",
    name: "上海市",
    shortName: "上海",
    province: "上海市",
    longitude: 121.47,
    latitude: 31.23,
    importance: 100,
    aliases: ["上海"],
  },
  {
    id: "bj",
    adcode: "110000",
    name: "北京市",
    shortName: "北京",
    province: "北京市",
    longitude: 116.4,
    latitude: 39.9,
    importance: 100,
    aliases: ["北京"],
  },
];

describe("nearestCity", () => {
  it("finds the closest supported city", () => {
    expect(nearestCity(cities, 31.2, 121.5).city?.id).toBe("sh");
  });
});
