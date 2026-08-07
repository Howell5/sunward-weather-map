import { ScatterChart } from "echarts/charts";
import { GeoComponent, TooltipComponent } from "echarts/components";
import { type EChartsType, init, registerMap, use } from "echarts/core";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { shouldShowCityLabel } from "../../lib/map/labelVisibility";
import { buildRegionVisuals } from "../../lib/map/regionEncoding";
import { cityLabel, cityVisual, cityWeatherEmoji } from "../../lib/map/visualEncoding";
import { longestDryStreak, weatherCodeLabel } from "../../lib/weather/dryness";
import type { City, CityWeatherSummary, ViewMode } from "../../lib/weather/types";

use([ScatterChart, GeoComponent, TooltipComponent, LabelLayout, CanvasRenderer]);

export interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  focusCity: (city: City) => void;
}

interface ChinaWeatherMapProps {
  geoJson: object;
  cities: City[];
  weatherByCity: Record<string, CityWeatherSummary>;
  viewMode: ViewMode;
  dryHighlight: boolean;
  dryWindowDays: number;
  selectedCityId: string | null;
  locatedCityId: string | null;
  onSelectCity: (cityId: string) => void;
}

interface MapPoint {
  name: string;
  value: [number, number];
  cityId: string;
  city: City;
  weather?: CityWeatherSummary;
  symbol: string;
  symbolSize: number;
  labelText: string;
  itemStyle: {
    color: string;
    borderColor: string;
    borderWidth: number;
    opacity: number;
    shadowBlur?: number;
    shadowColor?: string;
  };
  label?: {
    show: boolean;
  };
}

function formatTooltip(point: MapPoint, mode: ViewMode) {
  const weather = point.weather;
  if (!weather) {
    return `<div class="weather-tooltip"><strong>${point.city.name}</strong><span>天气数据暂缺</span></div>`;
  }
  if (mode.type === "now") {
    const current = weather.current;
    return `<div class="weather-tooltip">
      <strong>${point.city.name}</strong>
      <span>${weatherCodeLabel(current?.weatherCode ?? null)} · ${current?.temperature == null ? "—" : `${Math.round(current.temperature)}°`}</span>
      <small>当前降水 ${current?.precipitation == null ? "—" : `${current.precipitation} mm`}</small>
    </div>`;
  }
  if (mode.type === "day") {
    const day = weather.daily[mode.dayIndex];
    return `<div class="weather-tooltip">
      <strong>${point.city.name}</strong>
      <span>${day ? weatherCodeLabel(day.weatherCode) : "天气数据暂缺"} · ${cityLabel(weather, mode)}</span>
      <small>预计降水 ${day?.precipitationSum == null ? "—" : `${day.precipitationSum} mm`} · 概率 ${day?.precipitationProbabilityMax == null ? "—" : `${day.precipitationProbabilityMax}%`}</small>
    </div>`;
  }
  const temperatures = weather.daily.flatMap((day) =>
    [day.temperatureMin, day.temperatureMax].filter((value): value is number => value != null),
  );
  const range = temperatures.length
    ? `${Math.round(Math.min(...temperatures))}°–${Math.round(Math.max(...temperatures))}°`
    : "—";
  const streak = longestDryStreak(weather.daily);
  return `<div class="weather-tooltip">
    <strong>${point.city.name}</strong>
    <span>${weather.dryDays}/7 天无明显降水 · 连续最多 ${streak} 天</span>
    <small>七日温度 ${range}${weather.availableDays < 7 ? ` · ${7 - weather.availableDays} 天数据缺失` : ""}</small>
  </div>`;
}

export const ChinaWeatherMap = forwardRef<MapHandle, ChinaWeatherMapProps>(function ChinaWeatherMap(
  {
    geoJson,
    cities,
    weatherByCity,
    viewMode,
    dryHighlight,
    dryWindowDays,
    selectedCityId,
    locatedCityId,
    onSelectCity,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const [zoom, setZoom] = useState(1.15);

  useImperativeHandle(ref, () => ({
    zoomIn() {
      const nextZoom = Math.min(6, zoom * 1.3);
      chartRef.current?.setOption({ geo: { zoom: nextZoom } });
      setZoom(nextZoom);
    },
    zoomOut() {
      const nextZoom = Math.max(1, zoom / 1.3);
      chartRef.current?.setOption({ geo: { zoom: nextZoom } });
      setZoom(nextZoom);
    },
    reset() {
      chartRef.current?.setOption({ geo: { center: null, zoom: 1.15 } });
      setZoom(1.15);
    },
    focusCity(city) {
      chartRef.current?.setOption({
        geo: { center: [city.longitude, city.latitude], zoom: 3.4 },
      });
      setZoom(3.4);
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    registerMap("china-weather", geoJson as never);
    const chart = init(containerRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.setOption({
      animationDuration: 520,
      animationDurationUpdate: 280,
      backgroundColor: "transparent",
      geo: {
        map: "china-weather",
        roam: true,
        zoom: 1.15,
        scaleLimit: { min: 1, max: 7 },
        layoutCenter: ["49%", "50%"],
        layoutSize: "92%",
        itemStyle: {
          areaColor: "#173a32",
          borderColor: "rgba(181, 211, 193, 0.34)",
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: {
            areaColor: "#20483e",
            borderColor: "rgba(240, 204, 114, 0.8)",
            borderWidth: 1.2,
          },
          label: { show: false },
        },
        select: { disabled: true },
        label: { show: false },
      },
    });
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(containerRef.current);
    const handleRoam = () => {
      const option = chart.getOption() as { geo?: Array<{ zoom?: number }> };
      const nextZoom = option.geo?.[0]?.zoom;
      if (typeof nextZoom === "number") setZoom(nextZoom);
    };
    chart.on("georoam", handleRoam);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [geoJson]);

  const points = useMemo<MapPoint[]>(
    () =>
      cities.map((city) => {
        const selected = city.id === selectedCityId;
        const located = city.id === locatedCityId;
        const weather = weatherByCity[city.id];
        const visual = cityVisual(weather, viewMode, dryHighlight, selected, dryWindowDays);
        return {
          name: city.name,
          value: [city.longitude, city.latitude],
          cityId: city.id,
          city,
          weather,
          symbol: visual.symbol,
          symbolSize: selected ? 15 : located ? 12 : city.importance >= 90 ? 9 : 6,
          labelText: `${city.shortName}  ${cityWeatherEmoji(weather, viewMode)} ${cityLabel(weather, viewMode)}`,
          itemStyle: {
            color: visual.fill,
            borderColor: visual.border,
            borderWidth: selected ? 3 : located ? 2 : 1,
            opacity: visual.opacity,
            ...(selected ? { shadowBlur: 18, shadowColor: "rgba(240, 204, 114, 0.78)" } : {}),
          },
        };
      }),
    [cities, dryHighlight, dryWindowDays, locatedCityId, selectedCityId, viewMode, weatherByCity],
  );

  const regionVisuals = useMemo(
    () => buildRegionVisuals(cities, weatherByCity, geoJson, viewMode, dryHighlight),
    [cities, dryHighlight, geoJson, viewMode, weatherByCity],
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const labelPoints = points
      .filter((point) => shouldShowCityLabel(point.city, zoom, selectedCityId))
      .map((point) => ({
        ...point,
        itemStyle: {
          ...point.itemStyle,
          opacity: dryHighlight ? Math.max(point.itemStyle.opacity, 0.56) : point.itemStyle.opacity,
        },
        label: { show: true },
      }));
    chart.setOption({
      geo: {
        regions: regionVisuals,
      },
      tooltip: {
        trigger: "item",
        confine: true,
        borderWidth: 0,
        padding: 0,
        backgroundColor: "rgba(248, 247, 239, 0.97)",
        extraCssText:
          "border-radius:12px;box-shadow:0 16px 44px rgba(4,24,20,.28);backdrop-filter:blur(12px);",
        formatter: (params: { data?: MapPoint }) =>
          params.data ? formatTooltip(params.data, viewMode) : "",
      },
      series: [
        {
          id: "weather-points",
          type: "scatter",
          coordinateSystem: "geo",
          data: points,
          z: 4,
          emphasis: {
            scale: 1.7,
            itemStyle: { borderColor: "#fff7dc", borderWidth: 2 },
          },
          label: { show: false },
        },
        {
          id: "weather-labels",
          type: "scatter",
          coordinateSystem: "geo",
          data: labelPoints,
          silent: false,
          cursor: "pointer",
          z: 5,
          label: {
            show: true,
            position: "right",
            distance: 7,
            formatter: (params: { data?: MapPoint }) => params.data?.labelText ?? "",
            color: "#f7f2dc",
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: "rgba(8, 33, 28, 0.68)",
            borderColor: "rgba(239, 231, 198, 0.16)",
            borderWidth: 1,
            borderRadius: 8,
            padding: [6, 8],
          },
          labelLayout: { hideOverlap: true },
        },
      ],
    });
    const handleClick = (params: unknown) => {
      const event = params as { seriesId?: string; data?: MapPoint | null };
      if (
        (event.seriesId === "weather-points" || event.seriesId === "weather-labels") &&
        event.data?.cityId
      ) {
        onSelectCity(event.data.cityId);
      }
    };
    chart.off("click");
    chart.on("click", handleClick);
    return () => {
      chart.off("click", handleClick);
    };
  }, [dryHighlight, onSelectCity, points, regionVisuals, selectedCityId, viewMode, zoom]);

  return (
    <div
      ref={containerRef}
      className="china-weather-map"
      role="img"
      aria-label="中国全国城市天气地图，点击城市标签查看详情，也可使用搜索访问任一城市"
    />
  );
});
