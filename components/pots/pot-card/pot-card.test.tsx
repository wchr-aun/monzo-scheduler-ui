import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Pot } from "@/lib/pots/types";
import { PotCard } from "./pot-card";

const pot: Pot = {
  id: "pot_123", name: "Holiday", balance: 5000, currency: "GBP", deleted: false,
  cover_image_url: "https://images.example/pot.jpg", type: "regular",
};

describe("PotCard", () => {
  it.each([
    ["instant_access_savings", "Holiday - Instant access savings"],
    ["", "Holiday"],
  ])("formats the displayed type: %s", (type, title) => {
    render(<PotCard accountId="acc_123" pot={{ ...pot, type }} />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("shows the pot type and cover while keeping the pot link", () => {
    render(<PotCard accountId="acc_123" pot={pot} />);
    expect(screen.getByRole("heading", { name: "Holiday - Regular" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Holiday" })).toHaveAttribute("href", "/console/account/acc_123/pot/pot_123");
    expect(screen.getByRole("presentation")).toHaveAttribute("src", pot.cover_image_url);
  });

  it.each([null, "", "invalid", "javascript:alert(1)"])("omits unavailable or invalid covers: %s", (cover_image_url) => {
    render(<PotCard accountId="acc_123" pot={{ ...pot, cover_image_url }} />);
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Holiday - Regular" })).toBeInTheDocument();
  });

  it("removes a failed cover without losing the pot link", () => {
    render(<PotCard accountId="acc_123" pot={pot} />);
    fireEvent.error(screen.getByRole("presentation"));
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Holiday" })).toBeInTheDocument();
  });

  it("keeps deleted pots disabled and uses a fallback for unnamed pots", () => {
    render(<PotCard accountId="acc_123" pot={{ ...pot, name: "", deleted: true }} />);
    expect(screen.getByRole("heading", { name: "Unnamed pot - Regular" })).toBeInTheDocument();
    expect(screen.getByText("Deleted")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
