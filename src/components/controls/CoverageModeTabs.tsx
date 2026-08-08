import type { CoverageMode } from "../../lib/map/coverage";
import { COVERAGE_OPTIONS } from "../../lib/map/coverage";

interface CoverageModeTabsProps {
  value: CoverageMode;
  onChange: (mode: CoverageMode) => void;
}

export function CoverageModeTabs({ value, onChange }: CoverageModeTabsProps) {
  return (
    <fieldset className="coverage-tabs">
      <legend className="sr-only">天气覆盖范围</legend>
      <span className="coverage-tabs-label">范围</span>
      {COVERAGE_OPTIONS.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={value === option.value}
          className={value === option.value ? "is-active" : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
