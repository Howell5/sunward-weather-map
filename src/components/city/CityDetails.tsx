import { CarFront, Droplets, Gauge, LoaderCircle, Locate, Wind } from "lucide-react";
import type { LocationStatus } from "../../hooks/useGeolocation";
import type { DrivingEstimate, DrivingOriginSource, DrivingStatus } from "../../lib/route/types";
import { longestDryStreak, weatherCodeLabel } from "../../lib/weather/dryness";
import type { City, CityWeatherSummary } from "../../lib/weather/types";
import { CitySearch } from "../controls/CitySearch";
import { WeatherGlyph } from "./WeatherGlyph";

interface CityDetailsProps {
  city: City;
  weather: CityWeatherSummary | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  filterNotice?: string | null;
  onRetryDetail?: () => void;
  onRetryWeather?: () => void;
  drivingStatus?: DrivingStatus;
  drivingEstimate?: DrivingEstimate | null;
  drivingError?: string | null;
  hasDrivingOrigin?: boolean;
  drivingOriginMessage?: string | null;
  drivingOriginLabel?: string | null;
  drivingOriginSource?: DrivingOriginSource | null;
  drivingCities?: City[];
  locationStatus?: LocationStatus;
  onEstimateDriving?: () => void;
  onLocate?: () => void;
  onUseAutomaticOrigin?: () => void;
  onSelectDrivingOrigin?: (city: City) => void;
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

function formatDrivingDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `约 ${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `约 ${hours} 小时` : `约 ${hours} 小时 ${remainder} 分钟`;
}

function formatDrivingDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

interface DrivingEstimateSectionProps {
  status: DrivingStatus;
  estimate: DrivingEstimate | null;
  error: string | null;
  hasOrigin: boolean;
  originMessage: string | null;
  originLabel: string | null;
  originSource: DrivingOriginSource | null;
  cities: City[];
  locationStatus: LocationStatus;
  onEstimate: () => void;
  onLocate: () => void;
  onUseAutomaticOrigin: () => void;
  onSelectOrigin: (city: City) => void;
}

function DrivingEstimateSection({
  status,
  estimate,
  error,
  hasOrigin,
  originMessage,
  originLabel,
  originSource,
  cities,
  locationStatus,
  onEstimate,
  onLocate,
  onUseAutomaticOrigin,
  onSelectOrigin,
}: DrivingEstimateSectionProps) {
  const canSetManualOrigin = cities.length > 0;

  return (
    <section className="driving-section" aria-label="中国境内自驾估算">
      <div className="driving-section-heading">
        <div>
          <h3>自驾估算</h3>
          <span>自动定位或输入中国城市 · 仅中国境内</span>
        </div>
        <CarFront aria-hidden="true" />
      </div>

      {!hasOrigin && (
        <div className="driving-prompt">
          <p>{originMessage ?? "先定位当前位置，或输入一个中国城市作为出发点。"}</p>
          <div className="driving-origin-actions">
            <button type="button" onClick={onLocate} disabled={locationStatus === "requesting"}>
              {locationStatus === "requesting" ? (
                <LoaderCircle className="spin" aria-hidden="true" />
              ) : (
                <Locate aria-hidden="true" />
              )}
              {locationStatus === "requesting" ? "正在定位" : "使用自动定位"}
            </button>
            {canSetManualOrigin && (
              <CitySearch
                cities={cities}
                onSelect={onSelectOrigin}
                className="driving-origin-search"
                placeholder="输入出发城市"
                ariaLabel="手动设置出发城市"
              />
            )}
          </div>
        </div>
      )}

      {hasOrigin && (
        <div className="driving-origin-set">
          <div className="driving-origin-summary">
            <span>出发点</span>
            <strong>{originLabel ?? "当前位置"}</strong>
            <small>{originSource === "manual" ? "手动选择 · 按城市中心估算" : "自动定位"}</small>
          </div>
          <div className="driving-origin-actions">
            <button type="button" className="driving-origin-auto" onClick={onUseAutomaticOrigin}>
              <Locate aria-hidden="true" />
              {originSource === "manual" ? "改用自动定位" : "重新定位"}
            </button>
            {canSetManualOrigin && (
              <CitySearch
                cities={cities}
                onSelect={onSelectOrigin}
                className="driving-origin-search"
                placeholder="更换出发城市"
                ariaLabel="更换出发城市"
              />
            )}
          </div>
        </div>
      )}

      {hasOrigin && status === "idle" && (
        <button type="button" className="driving-action" onClick={onEstimate}>
          <CarFront aria-hidden="true" />
          估算驾车时间
        </button>
      )}

      {hasOrigin && status === "loading" && (
        <p className="driving-status">
          <LoaderCircle className="spin" aria-hidden="true" />
          正在查询高德路线
        </p>
      )}

      {hasOrigin && status === "success" && estimate && (
        <div className="driving-result">
          <strong>{formatDrivingDuration(estimate.durationSeconds)}</strong>
          <span>{formatDrivingDistance(estimate.distanceMeters)}</span>
          <small>
            高德路线估算 ·{" "}
            {new Date(estimate.fetchedAt).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
          <button type="button" onClick={onEstimate}>
            重新估算
          </button>
        </div>
      )}

      {hasOrigin && status === "error" && error && (
        <div className="driving-error" role="alert">
          <span>{error}</span>
          {hasOrigin && (
            <button type="button" onClick={onEstimate}>
              重试
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function CityDetails({
  city,
  weather,
  isLoadingDetail,
  detailError,
  filterNotice,
  onRetryDetail,
  onRetryWeather,
  drivingStatus = "idle",
  drivingEstimate = null,
  drivingError = null,
  hasDrivingOrigin = false,
  drivingOriginMessage = null,
  drivingOriginLabel = null,
  drivingOriginSource = null,
  drivingCities = [],
  locationStatus = "idle",
  onEstimateDriving,
  onLocate,
  onUseAutomaticOrigin,
  onSelectDrivingOrigin,
}: CityDetailsProps) {
  const handleUseAutomaticOrigin = onUseAutomaticOrigin ?? onLocate ?? (() => undefined);
  const handleSelectDrivingOrigin = onSelectDrivingOrigin ?? (() => undefined);
  const drivingSection =
    onEstimateDriving && onLocate ? (
      <DrivingEstimateSection
        status={drivingStatus}
        estimate={drivingEstimate}
        error={drivingError}
        hasOrigin={hasDrivingOrigin}
        originMessage={drivingOriginMessage}
        originLabel={drivingOriginLabel}
        originSource={drivingOriginSource}
        cities={drivingCities}
        locationStatus={locationStatus}
        onEstimate={onEstimateDriving}
        onLocate={onLocate}
        onUseAutomaticOrigin={handleUseAutomaticOrigin}
        onSelectOrigin={handleSelectDrivingOrigin}
      />
    ) : null;

  if (!weather || weather.status === "error" || weather.status === "unknown") {
    const message =
      weather?.status === "error"
        ? "这座城市本次天气更新失败，其他城市仍可继续查看。"
        : weather?.status === "unknown"
          ? "这座城市暂时没有足够的天气字段，无法判断是否无雨。"
          : "这个城市的天气数据暂未返回。";
    return (
      <div className="city-details details-empty">
        <h2>{city.shortName}</h2>
        <p>{city.province}</p>
        <span>{message}</span>
        {onRetryWeather && (
          <button type="button" className="details-retry" onClick={onRetryWeather}>
            重试天气
          </button>
        )}
        {drivingSection}
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

      {drivingSection}

      <p className="forecast-disclaimer">
        “无雨”指预计日降水量低于 0.2 mm 且降水不超过 1 小时，并非天气承诺。
      </p>
    </div>
  );
}
