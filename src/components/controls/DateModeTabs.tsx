import { useEffect, useRef } from "react";
import type { ViewMode } from "../../lib/weather/types";

interface DateModeTabsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  timeZone?: string;
}

function localDate(index: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + index, 4),
  );
}

function dayLabel(index: number, timeZone: string) {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    weekday: "short",
  }).format(localDate(index, timeZone));
}

function selected(value: ViewMode, candidate: ViewMode) {
  return (
    value.type === candidate.type &&
    (value.type !== "day" || (candidate.type === "day" && value.dayIndex === candidate.dayIndex))
  );
}

export function DateModeTabs({ value, onChange, timeZone = "Asia/Shanghai" }: DateModeTabsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const activeKey = value.type === "day" ? `day-${value.dayIndex}` : value.type;
  useEffect(() => {
    const activeButton = activeRef.current;
    if (activeButton?.dataset.mode === activeKey) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeKey]);

  const modes: Array<{ mode: ViewMode; label: string; sublabel?: string }> = [
    { mode: { type: "now" }, label: "当前" },
    ...Array.from({ length: 7 }, (_, index) => ({
      mode: { type: "day", dayIndex: index } as ViewMode,
      label: dayLabel(index, timeZone),
      sublabel: new Intl.DateTimeFormat("zh-CN", {
        timeZone,
        month: "numeric",
        day: "numeric",
      }).format(localDate(index, timeZone)),
    })),
    { mode: { type: "week" }, label: "7 日", sublabel: "总览" },
  ];

  return (
    <div className="date-tabs" role="toolbar" aria-label="天气时间范围">
      {modes.map(({ mode, label, sublabel }) => {
        const active = selected(value, mode);
        const modeKey = mode.type === "day" ? `day-${mode.dayIndex}` : mode.type;
        return (
          <button
            type="button"
            ref={active ? activeRef : undefined}
            key={modeKey}
            data-mode={modeKey}
            className={active ? "date-tab is-active" : "date-tab"}
            aria-pressed={active}
            onClick={() => onChange(mode)}
          >
            <span>{label}</span>
            {sublabel && <small>{sublabel}</small>}
          </button>
        );
      })}
    </div>
  );
}
