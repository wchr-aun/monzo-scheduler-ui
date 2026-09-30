import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "@/components/providers/data-provider";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers";
import { formatMoney } from "@/lib/formatting/money";

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
  status: "pending",
  scheduled_for: "2026-10-01T09:30:00Z",
  interval: "monthly",
  type: "deposit",
  amount: 2500,
  pot_id: "pot_456",
  account_id: "acc_123",
};

function scheduledTransfersPage(
  scheduledTransfers: (typeof transfer)[],
  pagination: { total?: number; limit?: number; offset?: number } = {},
) {
  return {
    scheduledTransfers,
    total: pagination.total ?? scheduledTransfers.length,
    limit: pagination.limit ?? 50,
    offset: pagination.offset ?? 0,
  };
}

describe("ScheduledTransfers", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("loads and displays scheduled transfers for the pot", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(scheduledTransfersPage([transfer])),
    );

    render(scheduledTransfers());

    expect(await screen.findByText("transfer_1")).toBeInTheDocument();
    expect(screen.getByText("pending")).toHaveAttribute("data-tone", "pending");
    expect(screen.getByText("monthly")).toBeInTheDocument();
    expect(screen.getByText("deposit")).toBeInTheDocument();
    expect(screen.getByText(formatMoney(2500, "GBP"))).toBeInTheDocument();

    const scheduledDate = new Date(transfer.scheduled_for);
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    };
    const localDate = new Intl.DateTimeFormat("en-US", dateOptions).format(
      scheduledDate,
    );
    const ukDate = new Intl.DateTimeFormat("en-US", {
      ...dateOptions,
      timeZone: "Europe/London",
      timeZoneName: undefined,
    }).format(scheduledDate);
    expect(screen.getByLabelText(`Local: ${localDate}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`UK: ${ukDate}`)).toBeInTheDocument();
    expect(screen.getByText("Setup ID: setup_1")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers?status=completed%2Cpending%2Cfailed",
      { cache: "no-store" },
    );
  });

  it("debounces selected status filters for one second", async () => {
    fetchMock.mockResolvedValue(jsonResponse(scheduledTransfersPage([transfer])));

    render(scheduledTransfers());

    await screen.findByText("transfer_1");
    const dropdown = screen.getByRole("button", {
      name: /status.*3 selected/i,
    });
    expect(dropdown).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(dropdown);
    expect(dropdown).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("checkbox", { name: "completed" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "pending" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "failed" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "cancelled" })).not.toBeChecked();

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("checkbox", { name: "completed" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "cancelled" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers?status=pending%2Cfailed%2Ccancelled",
      { cache: "no-store" },
    );
  });

  it("shows only the UK time when the local and UK times match", async () => {
    vi.stubEnv("TZ", "Europe/London");
    fetchMock.mockResolvedValue(
      jsonResponse(scheduledTransfersPage([transfer])),
    );

    render(scheduledTransfers());

    const scheduledDate = new Date(transfer.scheduled_for);
    const ukDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(scheduledDate);

    expect(await screen.findByText(ukDate, { selector: "time" })).toHaveAttribute(
      "datetime",
      transfer.scheduled_for,
    );
    expect(screen.queryByText(/^Local:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^UK:/)).not.toBeInTheDocument();
  });

  it("handles an empty response", async () => {
    fetchMock.mockResolvedValue(jsonResponse(scheduledTransfersPage([])));

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

  it("cancels a scheduled transfer and keeps it in the list", async () => {
    const cancelledTransfer = { ...transfer, status: "cancelled" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(scheduledTransfersPage([transfer])))
      .mockResolvedValueOnce(jsonResponse(null, { status: 204 }))
      .mockResolvedValueOnce(
        jsonResponse(scheduledTransfersPage([cancelledTransfer])),
      );

    render(scheduledTransfers());

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Cancel transfer transfer_1",
      }),
    );

    expect(
      await screen.findByText("Scheduled transfer cancelled."),
    ).toHaveAttribute("role", "status");
    expect(screen.getByText("transfer_1")).toBeInTheDocument();
    expect(screen.getByText("cancelled")).toHaveAttribute("data-tone", "cancelled");
    expect(screen.getByText("transfer_1").closest("li")).toHaveAttribute(
      "data-status",
      "cancelled",
    );
    expect(
      screen.queryByRole("button", { name: "Cancel transfer transfer_1" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No scheduled transfers found."),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers/setup_1",
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers?status=completed%2Cpending%2Cfailed",
      { cache: "no-store" },
    );
  });

  it("keeps a scheduled transfer visible when cancellation fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(scheduledTransfersPage([transfer])))
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

  it("styles terminal statuses and does not offer cancellation", async () => {
    const completedTransfer = {
      ...transfer,
      setup_id: "setup_2",
      transfer_id: "transfer_2",
      status: "completed",
    };
    const cancelledTransfer = {
      ...transfer,
      setup_id: "setup_3",
      transfer_id: "transfer_3",
      status: "cancelled",
    };
    const failedTransfer = {
      ...transfer,
      setup_id: "setup_4",
      transfer_id: "transfer_4",
      status: "failed",
    };
    fetchMock.mockResolvedValue(
      jsonResponse(
        scheduledTransfersPage([
          completedTransfer,
          cancelledTransfer,
          failedTransfer,
        ]),
      ),
    );

    render(scheduledTransfers());

    expect(await screen.findByText("completed")).toHaveAttribute(
      "data-tone",
      "completed",
    );
    expect(screen.getByText("cancelled")).toHaveAttribute("data-tone", "cancelled");
    expect(screen.getByText("transfer_3").closest("li")).toHaveAttribute(
      "data-status",
      "cancelled",
    );
    expect(screen.getByText("failed")).toHaveAttribute("data-tone", "failed");
    expect(screen.queryByRole("button", { name: /Cancel transfer/ })).toBeNull();
  });

  it("loads the next page of scheduled transfers", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          scheduledTransfersPage([transfer], { total: 51, limit: 50 }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          scheduledTransfersPage([], { total: 51, limit: 50, offset: 50 }),
        ),
      );

    render(scheduledTransfers());

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    expect(
      await screen.findByText("No scheduled transfers found."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers?status=completed%2Cpending%2Cfailed&limit=50&offset=50",
      { cache: "no-store" },
    );
    expect(screen.getByText("51–51 of 51")).toBeInTheDocument();
  });
});
