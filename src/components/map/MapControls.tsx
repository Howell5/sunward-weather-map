import { LocateFixed, Minus, Plus } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onReset }: MapControlsProps) {
  return (
    <fieldset className="map-controls">
      <legend className="sr-only">地图缩放控制</legend>
      <button type="button" onClick={onZoomIn} aria-label="放大地图">
        <Plus aria-hidden="true" />
      </button>
      <button type="button" onClick={onZoomOut} aria-label="缩小地图">
        <Minus aria-hidden="true" />
      </button>
      <button type="button" onClick={onReset} aria-label="重置全国视图">
        <LocateFixed aria-hidden="true" />
      </button>
    </fieldset>
  );
}
