import { describe, expect, it } from "vitest";
import { getPots } from "./validation";

const pot = {
  id: "pot_123", name: "Holiday", balance: 5000, currency: "GBP", deleted: false,
  cover_image_url: null, type: "regular",
};

describe("getPots", () => {
  it("accepts pots with and without cover images", () => {
    const pots = [pot, { ...pot, cover_image_url: "https://images.example/pot.jpg" }];
    expect(getPots({ pots })).toEqual(pots);
    expect(getPots({ pots: [] })).toEqual([]);
  });

  it.each([
    { cover_image_url: 123 },
    { type: null },
    { type: undefined },
  ])("rejects malformed pot metadata: %j", (fields) => {
    expect(getPots({ pots: [{ ...pot, ...fields }] })).toBeNull();
  });
});
