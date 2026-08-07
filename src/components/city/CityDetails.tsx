import { Droplets, Gauge, LoaderCircle, Wind } from "lucide-react";
import { longestDryStreak, weatherCodeLabel } from "../../lib/weather/dryness";
import type { City, CityWeatherSummary } from "../../lib/weather/types";
import { WeatherGlyph } from "./WeatherGlyph";

interface CityDetailsProps {
  city: City;
  weather: CityWeatherSummary | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  filterNotice?: string | null;
  onRetryDetail?: () => void;
  onRetryWeather?: () => void;
}

function metric(value: number | null | undefined, suffix: string) {
  return value == null ? "—" : `${Math.round(value)}${suffix}`;
}

function dateLabel(date: string, index: number) {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00+08:00`));
}

export function CityDetails({
  city,
  weather,
  isLoadingDetail,
  detailError,
  filterNotice,
  onRetryDetail,
  onRetryWeather,
}: CityDetailsProps) {
  if (!weather || weather.status === "error" || weather.status === "unknown") {
    const message =
      weather?.status === "error"
        ? "这座城市本次天气更新失败，其他城市仍可继续查看。"
        : weather?.status === "unknown"
          ? "这座城市暂时没有足够的天气字段，无法判断是否无雨。"
          : "这个城市的天气数据暂未返回。";
    return (
      <div className="details-empty">
        <h2>{city.shortName}</h2>
        <p>{city.province}</p>
        <span>{message}</span>
        {onRetryWeather && (
          <button type="button" className="details-retry" onClick={onRetryWeather}>
            重试天气
          </button>
        )}
      </div>
    );
  }
  const current = weather.current;
  return (
    <div className="city-details">
      <div className="city-heading">
        <div>
          <p>{city.province}</p>
          <h2>{city.shortName}</h2>
        </div>
        <span className={`data-state data-state--${weather.status}`}>
          {weather.status === "stale" ? "缓存数据" : "模型预报"}
        </span>
      </div>

      {filterNotice && <p className="filter-notice">{filterNotice}</p>}

      <section className="current-weather" aria-label={`${city.shortName}当前天气`}>
        <WeatherGlyph code={current?.weatherCode ?? null} className="current-glyph" />
        <div className="current-temperature">
          <strong>{metric(current?.temperature, "°")}</strong>
          <span>{weatherCodeLabel(current?.weatherCode ?? null)}</span>
        </div>
        <div className="current-range">
          <small>体感</small>
          <b>{metric(current?.apparentTemperature, "°")}</b>
        </div>
      </section>

      <div className="weather-metrics">
        <span>
          <Droplets aria-hidden="true" />
          <small>湿度</small>
          <b>{metric(current?.humidity, "%")}</b>
        </span>
        <span>
          <Wind aria-hidden="true" />
          <small>风速</small>
          <b>{metric(current?.windSpeed, " km/h")}</b>
        </span>
        <span>
          <Gauge aria-hidden="true" />
          <small>当前降水</small>
          <b>{current?.precipitation == null ? "—" : `${current.precipitation} mm`}</b>
        </span>
      </div>

      <section className="forecast-section">
        <div className="section-heading">
          <h3>未来 7 天</h3>
          <span>
            {weather.dryDays}/7 天无明显降水 · 连续最多 {longestDryStreak(weather.daily)} 天
          </span>
        </div>
        <div className="forecast-list">
          {weather.daily.map((day, index) => (
            <article className="forecast-row" key={day.date}>
              <time dateTime={day.date}>{dateLabel(day.date, index)}</time>
              <WeatherGlyph code={day.weatherCode} />
              <div className="forecast-condition">
                <b>{weatherCodeLabel(day.weatherCode)}</b>
                <small>
                  {day.precipitationSum == null ? "降水未知" : `${day.precipitationSum} mm`}
                  {day.precipitationProbabilityMax == null
                    ? ""
                    : ` · ${day.precipitationProbabilityMax}%`}
                </small>
                <small className="forecast-atmosphere">
                  风 {metric(day.windSpeedMax, " km/h")} · 湿度{" "}
                  {day.humidityMean == null ? "—" : `${day.humidityMean}%`}
                </small>
              </div>
              <span className={day.isDry === true ? "dry-mark is-dry" : "dry-mark"}>
                {day.isDry == null ? "未知" : day.isDry ? "无雨" : "有雨"}
              </span>
              <strong>
                {metric(day.temperatureMax, "°")} / {metric(day.temperatureMin, "°")}
              </strong>
            </article>
          ))}
        </div>
        {isLoadingDetail && (
          <p className="detail-note">
            <LoaderCircle className="spin" aria-hidden="true" />
            正在补充逐日湿度
          </p>
        )}
        {detailError && (
          <p className="detail-note is-error">
            <span>逐日湿度暂未加载</span>
            {onRetryDetail && (
              <button type="button" onClick={onRetryDetail}>
                重试
              </button>
            )}
          </p>
        )}
      </section>

      <p className="forecast-disclaimer">
        “无雨”指预计日降水量低于 0.2 mm 且降水不超过 1 小时，并非天气承诺。
      </p>
    </div>
  );
}
