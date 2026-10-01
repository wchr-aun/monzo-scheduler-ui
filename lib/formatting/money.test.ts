import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyParts } from "./money";

describe("money formatting", () => {
  it("preserves the sign and grouped integer while identifying decimals", () => {
    const parts = formatMoneyParts(-123_456, "GBP");
    expect(parts.map((part) => part.value).join("")).toBe(formatMoney(-123_456, "GBP"));
    expect(parts.find((part) => part.type === "minusSign")?.value).toBe("-");
    expect(parts.find((part) => part.type === "group")).toBeDefined();
    expect(parts.find((part) => part.type === "fraction")?.value).toBe("56");
  });

  it("supports currencies without decimals", () => {
    expect(formatMoneyParts(12_300, "JPY").some((part) => part.type === "fraction")).toBe(false);
  });

  it("keeps the fallback for invalid currencies", () => {
    expect(formatMoney(123, "invalid")).toBe("123 invalid");
  });
});
