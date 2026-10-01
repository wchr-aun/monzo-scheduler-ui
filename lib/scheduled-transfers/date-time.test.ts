import { describe, expect, it } from "vitest";
import { getTimeUntil } from "./date-time";

describe("getTimeUntil", () => {
  const now = new Date("2026-10-01T09:30:00Z").getTime();

  it("shows only days when execution is at least two days away", () => {
    expect(getTimeUntil("2026-10-03T12:45:00Z", now)).toBe("2d left");
  });

  it("shows days and hours between one and two days", () => {
    expect(getTimeUntil("2026-10-02T14:45:00Z", now)).toBe("1d 5h left");
  });

  it("shows hours and minutes between one hour and one day", () => {
    expect(getTimeUntil("2026-10-01T12:45:00Z", now)).toBe("3h 15m left");
  });

  it("shows only minutes between one minute and one hour", () => {
    expect(getTimeUntil("2026-10-01T10:15:00Z", now)).toBe("45m left");
  });

  it("describes scheduled times that have passed", () => {
    expect(getTimeUntil("2026-10-01T08:15:00Z", now)).toBe("1h 15m ago");
  });

  it("shows executing soon for pending transfers that are imminent", () => {
    expect(getTimeUntil("2026-10-01T09:30:30Z", now, "pending")).toBe(
      "Executing soon",
    );
  });

  it("shows executing soon for pending transfers that are overdue", () => {
    expect(getTimeUntil("2026-10-01T06:30:00Z", now, "pending")).toBe(
      "Executing soon",
    );
  });

  it("still shows elapsed time for completed transfers", () => {
    expect(getTimeUntil("2026-10-01T06:30:00Z", now, "completed")).toBe(
      "3h 0m ago",
    );
    expect(getTimeUntil("2026-10-01T09:29:30Z", now, "completed")).toBe(
      "Just completed",
    );
  });

  it("handles invalid dates", () => {
    expect(getTimeUntil("not-a-date", now)).toBe("Schedule unavailable");
  });
});
