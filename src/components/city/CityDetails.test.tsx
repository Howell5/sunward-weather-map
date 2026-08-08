import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { City, CityWeatherSummary } from "../../lib/weather/types";
import { CityDetails } from "./CityDetails";

const city: City = {
  id: "310000",
  adcode: "310000",
  name: "上海市",
  shortName: "上海",
  province: "上海市",
  longitude: 121.47,
  latitude: 31.23,
  importance: 100,
  aliases: ["上海"],
};

const weather: CityWeatherSummary = {
  cityId: city.id,
  status: "fresh",
  current: {
    time: "2026-08-07T12:00",
    temperature: 30,
    apparentTemperature: 34,
    humidity: 72,
    precipitation: 0,
    weatherCode: 0,
    windSpeed: 18,
  },
  daily: [
    {
      date: "2026-08-07",
      weatherCode: 1,
      temperatureMax: 34,
      temperatureMin: 27,
      precipitationSum: 0,
      precipitationHours: 0,
      precipitationProbabilityMax: 10,
      windSpeedMax: 22,
      humidityMean: 68,
      isDry: true,
    },
  ],
  dryDays: 1,
  availableDays: 1,
  fetchedAt: "2026-08-07T04:00:00Z",
};

describe("CityDetails", () => {
  it("renders current and daily objective weather fields", () => {
    render(
      <CityDetails city={city} weather={weather} isLoadingDetail={false} detailError={null} />,
    );
    expect(screen.getByRole("heading", { name: "上海" })).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText(/风 22 km\/h/)).toBeInTheDocument();
    expect(screen.getByText("无雨")).toBeInTheDocument();
  });

  it("offers a domestic driving estimate from the user's location", async () => {
    const onEstimateDriving = vi.fn();
    const onLocate = vi.fn();
    const user = userEvent.setup();
    render(
      <CityDetails
        city={city}
        weather={weather}
        isLoadingDetail={false}
        detailError={null}
        drivingStatus="idle"
        hasDrivingOrigin
        onEstimateDriving={onEstimateDriving}
        onLocate={onLocate}
      />,
    );
    await user.click(screen.getByRole("button", { name: "估算驾车时间" }));
    expect(onEstimateDriving).toHaveBeenCalledOnce();
    expect(screen.getByText("从我的位置出发 · 仅中国境内")).toBeInTheDocument();
  });

  it("asks for location before estimating a route", async () => {
    const onLocate = vi.fn();
    const user = userEvent.setup();
    render(
      <CityDetails
        city={city}
        weather={weather}
        isLoadingDetail={false}
        detailError={null}
        hasDrivingOrigin={false}
        onEstimateDriving={vi.fn()}
        onLocate={onLocate}
      />,
    );
    await user.click(screen.getByRole("button", { name: "使用我的位置" }));
    expect(onLocate).toHaveBeenCalledOnce();
  });

  it("explains an active filter mismatch and retries detail data", async () => {
    const onRetryDetail = vi.fn();
    const user = userEvent.setup();
    render(
      <CityDetails
        city={city}
        weather={weather}
        isLoadingDetail={false}
        detailError="temporary"
        filterNotice="该城市不符合当前“突出无雨”条件，已保留显示。"
        onRetryDetail={onRetryDetail}
      />,
    );
    expect(screen.getByText(/不符合当前“突出无雨”条件/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetryDetail).toHaveBeenCalledOnce();
  });

  it("shows a recoverable state when the city summary failed", async () => {
    const onRetryWeather = vi.fn();
    const user = userEvent.setup();
    render(
      <CityDetails
        city={city}
        weather={{
          ...weather,
          status: "error",
          current: null,
          daily: [],
          dryDays: 0,
          availableDays: 0,
        }}
        isLoadingDetail={false}
        detailError={null}
        onRetryWeather={onRetryWeather}
      />,
    );
    expect(screen.getByText(/本次天气更新失败/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重试天气" }));
    expect(onRetryWeather).toHaveBeenCalledOnce();
  });
});
