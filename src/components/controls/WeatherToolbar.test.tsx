import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WeatherToolbar } from "./WeatherToolbar";

describe("WeatherToolbar", () => {
  it("explains and changes the consecutive dry-window filter", async () => {
    const user = userEvent.setup();
    const onDryWindowDaysChange = vi.fn();
    render(
      <WeatherToolbar
        cities={[]}
        dryHighlight
        dryWindowDays={2}
        onDryHighlightChange={vi.fn()}
        onDryWindowDaysChange={onDryWindowDaysChange}
        onSelectCity={vi.fn()}
        locationStatus="idle"
        onLocate={vi.fn()}
        isRefreshing={false}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText("有晴窗")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "晴窗连续无雨天数" });
    await user.selectOptions(select, "4");
    expect(onDryWindowDaysChange).toHaveBeenCalledWith(4);
  });
});
