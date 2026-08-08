import { describe, expect, it } from "vitest";
import type { City } from "../weather/types";
import {
  type CoverageMode,
  cityRegion,
  coverageDescription,
  filterCitiesByCoverage,
} from "./coverage";

const cities: City[] = [
  {
    id: "cn",
    adcode: "cn",
    name: "上海市",
    shortName: "上海",
    province: "上海市",
    longitude: 121.47,
    latitude: 31.23,
    importance: 100,
    aliases: ["上海"],
  },
  {
    id: "nearby",
    adcode: "nearby",
    name: "东京",
    shortName: "东京",
    province: "日本",
    longitude: 139.69,
    latitude: 35.68,
    importance: 90,
    aliases: ["东京"],
    region: "nearby",
  },
  {
    id: "overseas",
    adcode: "overseas",
    name: "巴黎",
    shortName: "巴黎",
    province: "法国",
    longitude: 2.35,
    latitude: 48.86,
    importance: 90,
    aliases: ["巴黎"],
    region: "overseas",
  },
];

describe("coverage modes", () => {
  it.each([
    ["china", ["cn"]],
    ["nearby", ["cn", "nearby"]],
    ["overseas", ["nearby", "overseas"]],
  ] as Array<[CoverageMode, string[]]>)("filters %s to the intended cities", (mode, expected) => {
    expect(filterCitiesByCoverage(cities, mode).map((city) => city.id)).toEqual(expected);
  });

  it("defaults legacy cities to China", () => {
    expect(cityRegion(cities[0])).toBe("china");
  });

  it("describes the active scope for the map metadata", () => {
    expect(coverageDescription("overseas")).toBe("海外城市天气");
  });
});
