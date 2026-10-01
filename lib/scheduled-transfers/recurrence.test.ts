import { describe, expect, it } from "vitest";
import { getTransferRecurrence } from "./recurrence";

describe("getTransferRecurrence", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [28, "28th"],
    [29, "29th"],
    [30, "30th"],
    [31, "31st"],
  ])("describes monthly day %i with its ordinal", (day, frequency) => {
    expect(getTransferRecurrence(`2026-07-${String(day).padStart(2, "0")}T08:00:00Z`, "monthly")).toEqual({
      frequency,
      time: "09:00 UK",
      isMonthly: true,
    });
  });

  it("uses the UK weekday and time even across a UTC day boundary", () => {
    expect(getTransferRecurrence("2026-10-04T23:15:00Z", "weekly")).toEqual({
      frequency: "Every Monday",
      time: "00:15 UK",
      isMonthly: false,
    });
  });

  it("describes daily transfers using winter UK time", () => {
    expect(getTransferRecurrence("2026-12-01T18:05:00Z", "daily")).toEqual({
      frequency: "Everyday",
      time: "18:05 UK",
      isMonthly: false,
    });
  });

  it("handles invalid dates and unsupported intervals", () => {
    expect(getTransferRecurrence("invalid", "monthly")).toBeNull();
    expect(getTransferRecurrence("2026-10-01T08:00:00Z", "yearly")).toBeNull();
  });
});
