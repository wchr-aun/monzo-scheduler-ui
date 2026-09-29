import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../../../../data-provider";
import { ScheduledTransfers } from "./scheduled-transfers";

function jsonResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => body,
  } as Response;
}

function scheduledTransfers() {
  return (
    <DataProvider>
      <ScheduledTransfers accountId="acc_123" potId="pot_456" />
    </DataProvider>
  );
}

const transfer = {
  setup_id: "setup_1",
  transfer_id: "transfer_1",
  scheduled_for: "2026-10-01T09:30:00Z",
  interval: "monthly",
  type: "deposit",
  amount: 2500,
  pot_id: "pot_456",
  account_id: "acc_123",
};

describe("ScheduledTransfers", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("loads and displays scheduled transfers for the pot", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        scheduledTransfers: [
          transfer,
        ],
      }),
    );

    render(scheduledTransfers());

    expect(await screen.findByText("transfer_1")).toBeInTheDocument();
    expect(screen.getByText("monthly")).toBeInTheDocument();
    expect(screen.getByText("deposit")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers",
      { cache: "no-store" },
    );
  });

  it("handles an empty response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ scheduledTransfers: [] }));

    render(scheduledTransfers());

    expect(
      await screen.findByText("No scheduled transfers found."),
    ).toBeInTheDocument();
  });

  it("shows an accessible error when the response is invalid", async () => {
    fetchMock.mockResolvedValue(jsonResponse([], { ok: false, status: 502 }));

    render(scheduledTransfers());

    expect(
      await screen.findByText("Could not load scheduled transfers."),
    ).toHaveAttribute("role", "alert");
  });

  it("cancels a scheduled transfer and removes it from the list", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ scheduledTransfers: [transfer] }))
      .mockResolvedValueOnce(jsonResponse(null, { status: 204 }));

    render(scheduledTransfers());

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Cancel transfer transfer_1",
      }),
    );

    expect(
      await screen.findByText("Scheduled transfer cancelled."),
    ).toHaveAttribute("role", "status");
    expect(screen.queryByText("transfer_1")).not.toBeInTheDocument();
    expect(screen.getByText("No scheduled transfers found.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers/setup_1",
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );
  });

  it("keeps a scheduled transfer visible when cancellation fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ scheduledTransfers: [transfer] }))
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 502 }));

    render(scheduledTransfers());

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Cancel transfer transfer_1",
      }),
    );

    expect(
      await screen.findByText("Could not cancel the scheduled transfer."),
    ).toHaveAttribute("role", "alert");
    expect(screen.getByText("transfer_1")).toBeInTheDocument();
  });
});
