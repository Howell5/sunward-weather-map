import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateModeTabs } from "./DateModeTabs";

describe("DateModeTabs", () => {
  afterEach(() => vi.useRealTimers());

  it("emits the selected current mode", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateModeTabs value={{ type: "week" }} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "当前" }));
    expect(onChange).toHaveBeenCalledWith({ type: "now" });
  });

  it("marks the active mode", () => {
    render(<DateModeTabs value={{ type: "day", dayIndex: 0 }} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /今天/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("builds day labels from the China date near UTC midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-07T17:00:00Z"));
    render(<DateModeTabs value={{ type: "week" }} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /今天.*8\/8/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /明天.*8\/9/ })).toBeInTheDocument();
  });
});
