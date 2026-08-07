import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { City } from "../../lib/weather/types";
import { CitySearch } from "./CitySearch";

const cities: City[] = [
  {
    id: "310000",
    adcode: "310000",
    name: "上海市",
    shortName: "上海",
    province: "上海市",
    longitude: 121.47,
    latitude: 31.23,
    importance: 100,
    aliases: ["上海市", "上海"],
  },
  {
    id: "110000",
    adcode: "110000",
    name: "北京市",
    shortName: "北京",
    province: "北京市",
    longitude: 116.4,
    latitude: 39.9,
    importance: 100,
    aliases: ["北京市", "北京"],
  },
];

describe("CitySearch", () => {
  it("selects a matching city with the keyboard", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<CitySearch cities={cities} onSelect={onSelect} />);
    const input = screen.getByRole("combobox", { name: "搜索城市" });
    await user.type(input, "上海");
    expect(screen.getByRole("option", { name: /上海/ })).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(cities[0]);
  });

  it("shows a dedicated empty state for an unknown city", async () => {
    const user = userEvent.setup();
    render(<CitySearch cities={cities} onSelect={vi.fn()} />);
    await user.type(screen.getByRole("combobox", { name: "搜索城市" }), "不存在");
    expect(screen.getByText("没有找到这个城市")).toBeInTheDocument();
  });
});
