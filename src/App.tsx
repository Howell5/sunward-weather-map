import { AlertTriangle, CloudSun, Database, MapPinned } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CityDetailsPanel } from "./components/city/CityDetailsPanel";
import { CoverageModeTabs } from "./components/controls/CoverageModeTabs";
import { DateModeTabs } from "./components/controls/DateModeTabs";
import { WeatherToolbar } from "./components/controls/WeatherToolbar";
import { ChinaWeatherMap, type MapHandle } from "./components/map/ChinaWeatherMap";
import { MapControls } from "./components/map/MapControls";
import { MapLegend } from "./components/map/MapLegend";
import { useCityDetail } from "./hooks/useCityDetail";
import { useDrivingEstimate } from "./hooks/useDrivingEstimate";
import { useGeolocation } from "./hooks/useGeolocation";
import { useWeatherDataset } from "./hooks/useWeatherDataset";
import {
  type CoverageMode,
  cityRegion,
  coverageDescription,
  coverageMapConfig,
  filterCitiesByCoverage,
} from "./lib/map/coverage";
import { nearestCity } from "./lib/map/nearestCity";
import { DEFAULT_DRY_WINDOW_DAYS, dryWindowMatches } from "./lib/map/visualEncoding";
import type { City, CityDataset, ViewMode } from "./lib/weather/types";

interface StaticDataState {
  chinaDataset: CityDataset | null;
  globalDataset: CityDataset | null;
  chinaGeoJson: object | null;
  worldGeoJson: object | null;
  error: string | null;
}

function formatUpdateTime(value: string | null) {
  if (!value) return "尚未更新";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isDomesticCoordinate(latitude: number, longitude: number) {
  return latitude >= 15 && latitude <= 55 && longitude >= 70 && longitude <= 138;
}

function App() {
  const [staticData, setStaticData] = useState<StaticDataState>({
    chinaDataset: null,
    globalDataset: null,
    chinaGeoJson: null,
    worldGeoJson: null,
    error: null,
  });
  const [coverageMode, setCoverageMode] = useState<CoverageMode>("china");
  const [viewMode, setViewMode] = useState<ViewMode>({ type: "week" });
  const [dryHighlight, setDryHighlight] = useState(false);
  const [dryWindowDays, setDryWindowDays] = useState(DEFAULT_DRY_WINDOW_DAYS);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [locatedCityId, setLocatedCityId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [manualDrivingOrigin, setManualDrivingOrigin] = useState<City | null>(null);
  const mapRef = useRef<MapHandle>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/data/cities.json", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("城市数据加载失败");
        return response.json() as Promise<CityDataset>;
      }),
      fetch("/data/global-cities.json", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("周边城市数据加载失败");
        return response.json() as Promise<CityDataset>;
      }),
      fetch("/data/china.geojson", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("地图数据加载失败");
        return response.json() as Promise<object>;
      }),
      fetch("/data/world.geojson", { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("世界地图数据加载失败");
        return response.json() as Promise<object>;
      }),
    ])
      .then(([chinaDataset, globalDataset, chinaGeoJson, worldGeoJson]) =>
        setStaticData({ chinaDataset, globalDataset, chinaGeoJson, worldGeoJson, error: null }),
      )
      .catch((error) => {
        if (!controller.signal.aborted) {
          setStaticData({
            chinaDataset: null,
            globalDataset: null,
            chinaGeoJson: null,
            worldGeoJson: null,
            error: error instanceof Error ? error.message : "静态数据加载失败",
          });
        }
      });
    return () => controller.abort();
  }, []);

  const cities = useMemo(
    () => [
      ...(staticData.chinaDataset?.cities ?? []).map((city) => ({
        ...city,
        region: "china" as const,
      })),
      ...(staticData.globalDataset?.cities ?? []),
    ],
    [staticData.chinaDataset, staticData.globalDataset],
  );
  const activeCities = useMemo(
    () => filterCitiesByCoverage(cities, coverageMode),
    [cities, coverageMode],
  );
  const chinaCities = useMemo(
    () => cities.filter((city) => cityRegion(city) === "china"),
    [cities],
  );
  const mapConfig = useMemo(() => coverageMapConfig(coverageMode), [coverageMode]);
  const mapGeoJson = coverageMode === "china" ? staticData.chinaGeoJson : staticData.worldGeoJson;
  const weather = useWeatherDataset(
    activeCities,
    `${staticData.chinaDataset?.version ?? "pending"}:${staticData.globalDataset?.version ?? "pending"}:${coverageMode}`,
  );
  const selectedCity = activeCities.find((city) => city.id === selectedCityId) ?? null;
  const selectedSummary = (selectedCityId && weather.weatherByCity[selectedCityId]) || null;
  const cityDetail = useCityDetail(selectedCity, selectedSummary);
  const geolocation = useGeolocation();
  const automaticDrivingOrigin =
    geolocation.location &&
    isDomesticCoordinate(geolocation.location.latitude, geolocation.location.longitude)
      ? geolocation.location
      : null;
  const drivingOrigin = manualDrivingOrigin
    ? { latitude: manualDrivingOrigin.latitude, longitude: manualDrivingOrigin.longitude }
    : automaticDrivingOrigin;
  const isDomesticDestination = selectedCity ? cityRegion(selectedCity) === "china" : false;
  const driving = useDrivingEstimate(isDomesticDestination ? selectedCity : null, drivingOrigin);
  const drivingOriginMessage =
    !manualDrivingOrigin && geolocation.location && !automaticDrivingOrigin
      ? "当前定位不在中国境内，首版不提供自驾估算。"
      : null;
  const drivingOriginSource = manualDrivingOrigin ? "manual" : drivingOrigin ? "automatic" : null;
  const drivingOriginLabel = manualDrivingOrigin ? manualDrivingOrigin.shortName : "当前位置";

  useEffect(() => {
    if (selectedCityId && !activeCities.some((city) => city.id === selectedCityId)) {
      setSelectedCityId(null);
      setDetailOpen(false);
    }
  }, [activeCities, selectedCityId]);

  const useAutomaticDrivingOrigin = useCallback(() => {
    setManualDrivingOrigin(null);
    geolocation.locate();
  }, [geolocation.locate]);

  const selectDrivingOrigin = useCallback((city: City) => {
    setManualDrivingOrigin(city);
    setNotice(`自驾起点已设为 ${city.shortName}`);
  }, []);

  const selectCity = useCallback((city: City, focusMap = false) => {
    if (document.activeElement instanceof HTMLElement) {
      detailTriggerRef.current = document.activeElement;
    }
    setSelectedCityId(city.id);
    setDetailOpen(true);
    if (focusMap) mapRef.current?.focusCity(city);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailOpen(false);
    window.requestAnimationFrame(() => {
      const trigger = detailTriggerRef.current;
      if (trigger?.isConnected) {
        trigger.focus();
        return;
      }
      document.querySelector<HTMLElement>(".city-search input")?.focus();
    });
  }, []);

  const selectCityId = useCallback(
    (cityId: string) => {
      const city = activeCities.find((item) => item.id === cityId);
      if (city) selectCity(city);
    },
    [activeCities, selectCity],
  );

  useEffect(() => {
    if (!geolocation.location || geolocation.status !== "located" || !activeCities.length) return;
    const { latitude, longitude } = geolocation.location;
    const nearest = nearestCity(activeCities, latitude, longitude);
    if (!nearest.city || nearest.distance > 650) {
      setNotice("当前位置附近暂未收录城市，可直接搜索地图中的城市");
      return;
    }
    setLocatedCityId(nearest.city.id);
    setNotice(`已定位到 ${nearest.city.shortName} 附近`);
    selectCity(nearest.city, true);
  }, [activeCities, geolocation.location, geolocation.status, selectCity]);

  useEffect(() => {
    if (geolocation.message) setNotice(geolocation.message);
  }, [geolocation.message]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadedLabel = weather.isLoading
    ? "正在获取全国天气"
    : weather.isRefreshing && weather.loadedCount === 0
      ? `正在更新，已显示 ${Object.keys(weather.weatherByCity).length} 个缓存城市`
      : `${weather.loadedCount}/${weather.totalCount} 个城市已更新`;
  const dryWindowCount = useMemo(
    () =>
      activeCities.reduce(
        (count, city) =>
          count +
          (dryWindowMatches(weather.weatherByCity[city.id], viewMode, dryWindowDays) === true
            ? 1
            : 0),
        0,
      ),
    [activeCities, dryWindowDays, viewMode, weather.weatherByCity],
  );
  const selectedDryState = selectedSummary
    ? dryWindowMatches(selectedSummary, viewMode, dryWindowDays)
    : null;
  const filterDescription =
    viewMode.type === "week" ? `连续 ≥${dryWindowDays} 天无明显降水` : "当前日期无明显降水";
  const filterNotice =
    dryHighlight && selectedCity
      ? selectedDryState === false
        ? `该城市没有满足“${filterDescription}”的晴窗条件，仍保留显示。`
        : selectedDryState == null
          ? "该城市数据不足，暂时无法判断是否符合晴窗条件。"
          : null
      : null;
  const scopeDescription = coverageDescription(coverageMode);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <CloudSun aria-hidden="true" />
          </span>
          <div>
            <strong>Sunward</strong>
            <small>全国天气地图</small>
          </div>
        </div>
        <div className="topbar-summary">
          <span>
            <Database aria-hidden="true" />
            {loadedLabel}
          </span>
          <i />
          <span>更新于 {formatUpdateTime(weather.fetchedAt)}</span>
        </div>
      </header>

      <main className={detailOpen && selectedCity ? "workspace has-details" : "workspace"}>
        <section className="map-stage" aria-label="全国天气工作区">
          {mapGeoJson && activeCities.length ? (
            <ChinaWeatherMap
              ref={mapRef}
              geoJson={mapGeoJson}
              mapName={mapConfig.mapName}
              initialZoom={mapConfig.initialZoom}
              initialCenter={mapConfig.initialCenter}
              showRegions={coverageMode === "china"}
              ariaLabel={mapConfig.ariaLabel}
              cities={activeCities}
              weatherByCity={weather.weatherByCity}
              viewMode={viewMode}
              dryHighlight={dryHighlight}
              dryWindowDays={dryWindowDays}
              selectedCityId={selectedCityId}
              locatedCityId={locatedCityId}
              onSelectCity={selectCityId}
            />
          ) : (
            <div className="map-loading">
              {staticData.error ? (
                <>
                  <AlertTriangle aria-hidden="true" />
                  <h2>地图暂时没有加载</h2>
                  <p>{staticData.error}</p>
                  <button type="button" onClick={() => window.location.reload()}>
                    重新加载
                  </button>
                </>
              ) : (
                <>
                  <span className="loading-orbit" aria-hidden="true" />
                  <h2>正在展开天气地图</h2>
                  <p>准备城市与行政区数据</p>
                </>
              )}
            </div>
          )}

          <div className="toolbar-wrap">
            <WeatherToolbar
              cities={activeCities}
              dryHighlight={dryHighlight}
              dryWindowDays={dryWindowDays}
              onDryHighlightChange={setDryHighlight}
              onDryWindowDaysChange={setDryWindowDays}
              onSelectCity={(city) => selectCity(city, true)}
              locationStatus={geolocation.status}
              onLocate={useAutomaticDrivingOrigin}
              isRefreshing={weather.isRefreshing}
              onRefresh={weather.refresh}
            />
          </div>

          <div className="coverage-dock">
            <CoverageModeTabs value={coverageMode} onChange={setCoverageMode} />
          </div>

          <div className="map-meta">
            <span>
              <MapPinned aria-hidden="true" />
              {viewMode.type === "week"
                ? "未来 7 日无雨天数"
                : viewMode.type === "now"
                  ? "当前模型天气"
                  : "所选日期天气"}
            </span>
            <span className="coverage-status">
              {scopeDescription} · {activeCities.length} 个城市
            </span>
            {dryHighlight && (
              <span className="filter-status">
                晴窗筛选：{filterDescription} · {dryWindowCount} 个城市
              </span>
            )}
            <span className="map-hint">点击城市标签查看详情</span>
            {weather.failedBatchCount > 0 && (
              <span className="partial-warning">部分城市更新失败，已保留可用数据</span>
            )}
          </div>

          <MapControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onReset={() => mapRef.current?.reset()}
          />
          <MapLegend showRegions={coverageMode === "china"} />

          <div className="date-dock">
            <DateModeTabs
              value={viewMode}
              onChange={setViewMode}
              timeZone={selectedSummary?.timezone}
            />
          </div>

          {weather.globalError && (
            <div className="weather-error" role="alert">
              <AlertTriangle aria-hidden="true" />
              <span>{weather.globalError}</span>
              <button type="button" onClick={weather.refresh}>
                重试
              </button>
            </div>
          )}
        </section>

        {detailOpen && selectedCity && (
          <CityDetailsPanel
            city={selectedCity}
            weather={cityDetail.detail}
            isLoadingDetail={cityDetail.isLoading}
            detailError={cityDetail.error}
            filterNotice={filterNotice}
            onRetryDetail={cityDetail.retry}
            onRetryWeather={weather.refresh}
            drivingStatus={isDomesticDestination ? driving.status : undefined}
            drivingEstimate={isDomesticDestination ? driving.estimate : undefined}
            drivingError={isDomesticDestination ? driving.error : undefined}
            hasDrivingOrigin={isDomesticDestination ? Boolean(drivingOrigin) : false}
            drivingOriginMessage={isDomesticDestination ? drivingOriginMessage : null}
            drivingOriginLabel={isDomesticDestination ? drivingOriginLabel : null}
            drivingOriginSource={isDomesticDestination ? drivingOriginSource : null}
            drivingCities={isDomesticDestination ? chinaCities : undefined}
            locationStatus={geolocation.status}
            onEstimateDriving={isDomesticDestination ? driving.calculate : undefined}
            onLocate={isDomesticDestination ? useAutomaticDrivingOrigin : undefined}
            onUseAutomaticOrigin={isDomesticDestination ? useAutomaticDrivingOrigin : undefined}
            onSelectDrivingOrigin={isDomesticDestination ? selectDrivingOrigin : undefined}
            onClose={closeDetails}
          />
        )}
      </main>

      <footer className="data-footer">
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Weather data by Open-Meteo.com
        </a>
        <span>当前值与预报为模型数据</span>
        <span>原型地图边界待正式合规核验</span>
      </footer>

      <div className="sr-live" aria-live="polite">
        {loadedLabel}
        {notice ? `。${notice}` : ""}
      </div>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

export default App;
