import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import type { ReactElement } from "react";
import { render as testingRender, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MONEY_VISIBILITY_STORAGE_KEY } from "@/lib/money/constants";
import { textContent } from "@/test-utils/text";
import { createPreviewTransfersPage } from "@/lib/scheduled-transfers/preview";
import { PotPreview } from "./pot-preview";

describe("PotPreview", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("renders Navbar, PotDetails, and ScheduledTransfers with sample data without fetching account data", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PotPreview transfersPage={createPreviewTransfersPage(new Date("2026-11-14T16:48:00Z"))} />);

    expect(screen.getByRole("navigation", { name: "Site controls", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Schedzo home", hidden: true })).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "Rainy day", level: 1, hidden: true })).toBeInTheDocument();
    expect(screen.getByText(textContent("£5,549.54"))).toBeInTheDocument();
    expect(screen.getByText("Weekly deposit")).toBeInTheDocument();
    expect(screen.getByText("Every Monday - 12:00 UK")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Scheduled transfers", hidden: true })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem", { hidden: true })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Schedule a transfer" })).toBeDisabled();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("makes the preview inert without changing saved preferences", () => {
    localStorage.setItem(MONEY_VISIBILITY_STORAGE_KEY, "false");
    document.documentElement.dataset.theme = "light";
    render(<PotPreview transfersPage={createPreviewTransfersPage(new Date("2026-11-14T16:48:00Z"))} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByRole("group", { name: "Pot page preview" })).toHaveAttribute("inert");
    expect(localStorage.getItem(MONEY_VISIBILITY_STORAGE_KEY)).toBe("false");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.queryByText("Scheduled for")).not.toBeInTheDocument();
  });
});

function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ToastProvider });
}
