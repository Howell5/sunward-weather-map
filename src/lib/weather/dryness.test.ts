import { describe, expect, it } from "vitest";
import { isCurrentlyDry, isDryDay, longestDryStreak } from "./dryness";

describe("isDryDay", () => {
  it("treats values below 0.2 mm and up to one hour as dry", () => {
    expect(isDryDay({ precipitationSum: 0.199, precipitationHours: 1 })).toBe(true);
  });

  it("treats the precipitation threshold itself as not dry", () => {
    expect(isDryDay({ precipitationSum: 0.2, precipitationHours: 1 })).toBe(false);
  });

  it("treats more than one precipitation hour as not dry", () => {
    expect(isDryDay({ precipitationSum: 0.1, precipitationHours: 1.01 })).toBe(false);
  });

  it("returns unknown when a required field is missing", () => {
    expect(isDryDay({ precipitationSum: null, precipitationHours: 0 })).toBeNull();
    expect(isDryDay({ precipitationSum: 0, precipitationHours: null })).toBeNull();
  });
});

describe("isCurrentlyDry", () => {
  it("requires both low precipitation and a non-precipitation code", () => {
    expect(isCurrentlyDry(0, 1)).toBe(true);
    expect(isCurrentlyDry(0, 61)).toBe(false);
    expect(isCurrentlyDry(null, 1)).toBeNull();
  });
});

describe("longestDryStreak", () => {
  it("counts the longest contiguous run and breaks on unknown days", () => {
    expect(
      longestDryStreak([{ isDry: true }, { isDry: true }, { isDry: false }, { isDry: true }]),
    ).toBe(2);
    expect(longestDryStreak([{ isDry: true }, { isDry: null }, { isDry: true }])).toBe(1);
  });
});
