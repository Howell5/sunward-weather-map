import { Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { LocationStatus } from "../../hooks/useGeolocation";
import type { DrivingEstimate, DrivingStatus } from "../../lib/route/types";
import type { City, CityWeatherSummary } from "../../lib/weather/types";
import { CityDetails } from "./CityDetails";

interface CityDetailsPanelProps {
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
  locationStatus?: LocationStatus;
  onEstimateDriving?: () => void;
  onLocate?: () => void;
  onClose: () => void;
}

export function CityDetailsPanel(props: CityDetailsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [props.onClose]);

  return (
    <aside
      className={expanded ? "details-panel is-expanded" : "details-panel"}
      aria-label={`${props.city.shortName}天气详情`}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="panel-actions">
        <button
          type="button"
          className="panel-expand"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "收起天气详情" : "展开天气详情"}
        >
          {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="panel-close"
          onClick={props.onClose}
          aria-label="关闭天气详情"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <CityDetails {...props} />
    </aside>
  );
}
