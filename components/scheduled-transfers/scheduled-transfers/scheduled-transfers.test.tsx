import { textContent } from "@/test-utils/text";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "@/components/providers/data-provider";
import { ScheduledTransfers } from "./scheduled-transfers";
import { formatMoney } from "@/lib/formatting/money";
import type { ScheduledTransfer } from "@/lib/scheduled-transfers/types";

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

const transfer: ScheduledTransfer = {
  setup_id: "setup_1",
  transfer_id: "transfer_1",
  status: "pending",
  created_at: "2026-09-01T08:15:00Z",
  executed_at: null,
  scheduled_for: "2026-10-01T09:30:00Z",
  interval: "monthly",
  type: "deposit",
  amount: 2500,
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
    vi.stubEnv("TZ", "Asia/Bangkok");
    fetchMock.mockResolvedValue(
      jsonResponse(scheduledTransfersPage([transfer])),
    );

    render(scheduledTransfers());

    const toggle = await screen.findByRole("button", {
      name: "Show details for transfer transfer_1",
    });
    const card = toggle.closest("li");
    expect(screen.queryByText(/^Transfer ID:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Setup ID:/)).not.toBeInTheDocument();
    expect(card).toHaveTextContent(`+${formatMoney(2500, "GBP")}`);
    expect(screen.getByText("pending")).toHaveAttribute("data-tone", "pending");
    expect(screen.getByText("Monthly deposit")).toBeInTheDocument();
    expect(screen.getByText("1st of month - 10:30 UK")).toBeInTheDocument();
    expect(screen.getByText(textContent(formatMoney(2500, "GBP")))).toBeInTheDocument();

    expect(card?.querySelector("time")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Scheduled for")).toBeInTheDocument();
    expect(screen.getByText(/^Transfer ID:/)).toHaveTextContent("transfer_1");
    expect(screen.getByText(/^Setup ID:/)).toHaveTextContent("setup_1");
    expect(screen.queryByText("Interval")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.getByText("Created at")).toBeInTheDocument();
    expect(screen.queryByText("Executed at")).not.toBeInTheDocument();
    expect(screen.getByText("1 September 2026 - 09:15 UK")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel transfer transfer_1" }),
    ).toBeInTheDocument();

    expect(screen.getByText("1 October 2026 - 16:30 Local")).toBeInTheDocument();
    expect(screen.getByText("1 October 2026 - 10:30 UK")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers?status=completed%2Cpending%2Cfailed",
      { cache: "no-store" },
    );
  });

  it("debounces selected status filters for one second", async () => {
    fetchMock.mockResolvedValue(jsonResponse(scheduledTransfersPage([transfer])));

    render(scheduledTransfers());

    await screen.findByRole("button", {
      name: "Show details for transfer transfer_1",
    });
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

    fireEvent.click(await screen.findByRole("button", {
      name: "Show details for transfer transfer_1",
    }));
    const ukDate = "1 October 2026 - 10:30 UK";

    expect(await screen.findByText(ukDate, { selector: "time" })).toHaveAttribute(
      "datetime",
      transfer.scheduled_for,
    );
    expect(screen.queryByText(/Local$/)).not.toBeInTheDocument();
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

  it("uses the refreshed status after cancelling a scheduled transfer", async () => {
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
        name: "Show details for transfer transfer_1",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel transfer transfer_1" }),
    );

    expect(
      await screen.findByText("Scheduled transfer cancelled."),
    ).toHaveAttribute("role", "status");
    const toggle = screen.getByRole("button", {
      name: "Hide details for transfer transfer_1",
    });
    expect(screen.getByText(/^Transfer ID:/)).toHaveTextContent("transfer_1");
    expect(screen.getByText("cancelled")).toHaveAttribute("data-tone", "cancelled");
    expect(toggle.closest("li")).toHaveAttribute("data-status", "cancelled");
    expect(toggle.closest("li")).toHaveTextContent("cancelled");
    expect(toggle.closest("li")).toHaveTextContent("Scheduled for");
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

  it.each([true, false])(
    "keeps the list unchanged until cancellation refresh completes (refresh succeeds: %s)",
    async (refreshSucceeds) => {
      let resolveRefresh!: (response: Response) => void;
      const refresh = new Promise<Response>((resolve) => {
        resolveRefresh = resolve;
      });
      fetchMock
        .mockResolvedValueOnce(jsonResponse(scheduledTransfersPage([transfer])))
        .mockResolvedValueOnce(jsonResponse(null, { status: 204 }))
        .mockReturnValueOnce(refresh);

      render(scheduledTransfers());
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Show details for transfer transfer_1",
        }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Cancel transfer transfer_1" }),
      );

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(screen.getByText("Cancelling…")).toBeDisabled();
      expect(screen.queryByText("cancelled")).not.toBeInTheDocument();
      expect(screen.queryByText("No scheduled transfers found.")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Loading scheduled transfers")).not.toBeInTheDocument();

      await act(async () => {
        resolveRefresh(
          jsonResponse(scheduledTransfersPage([]), {
            ok: refreshSucceeds,
            status: refreshSucceeds ? 200 : 502,
          }),
        );
      });

      expect(await screen.findByText("Scheduled transfer cancelled.")).toBeInTheDocument();
      if (refreshSucceeds) {
        expect(screen.getByText("No scheduled transfers found.")).toBeInTheDocument();
        expect(screen.queryByText("pending")).not.toBeInTheDocument();
      } else {
        expect(screen.getByText("pending")).toBeInTheDocument();
        expect(screen.getByText("Could not load scheduled transfers.")).toHaveAttribute("role", "alert");
      }
    },
  );

  it("keeps a scheduled transfer visible when cancellation fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(scheduledTransfersPage([transfer])))
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 502 }));

    render(scheduledTransfers());

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Show details for transfer transfer_1",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel transfer transfer_1" }),
    );

    expect(
      await screen.findByText("Could not cancel the scheduled transfer."),
    ).toHaveAttribute("role", "alert");
    expect(
      screen.getByRole("button", {
        name: "Hide details for transfer transfer_1",
      }),
    ).toBeInTheDocument();
  });

  it("styles terminal statuses and does not offer cancellation", async () => {
    const completedTransfer = {
      ...transfer,
      setup_id: "setup_2",
      transfer_id: "transfer_2",
      status: "completed",
      executed_at: "2020-01-01T09:31:00Z",
      scheduled_for: "2020-01-01T09:30:00Z",
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
      type: "withdraw",
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
    const completedCard = screen
      .getByRole("button", {
        name: "Show details for transfer transfer_2",
      })
      .closest("li");
    expect(completedCard?.querySelector('[data-timing]')).not.toBeInTheDocument();
    expect(
      completedCard?.querySelector(
        'time[datetime="2020-01-01T09:31:00Z"]',
      ),
    ).not.toBeInTheDocument();
    expect(
      completedCard?.querySelector(
        'time[datetime="2020-01-01T09:30:00Z"]',
      ),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Show details for transfer transfer_2",
      }),
    );
    expect(
      Array.from(completedCard?.querySelectorAll("dt") ?? [], (term) =>
        term.textContent,
      ),
    ).toEqual(["Created at", "Executed at"]);
    expect(screen.getByText("Executed at")).toBeInTheDocument();
    expect(screen.queryByText("Scheduled for")).not.toBeInTheDocument();
    expect(
      completedCard?.querySelector(
        'time[datetime="2020-01-01T09:31:00Z"]',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("cancelled")).toHaveAttribute("data-tone", "cancelled");
    const cancelledCard = screen
      .getByRole("button", {
        name: "Show details for transfer transfer_3",
      })
      .closest("li");
    expect(cancelledCard).toHaveAttribute("data-status", "cancelled");
    expect(cancelledCard).toHaveTextContent("cancelled");
    expect(cancelledCard).not.toHaveTextContent("Scheduled for");
    expect(cancelledCard?.querySelector("time")).not.toBeInTheDocument();
    expect(cancelledCard?.querySelector("[data-timing]")).not.toBeInTheDocument();
    expect(screen.getByText("failed")).toHaveAttribute("data-tone", "failed");
    const failedCard = screen.getByRole("button", {
      name: "Show details for transfer transfer_4",
    }).closest("li");
    expect(failedCard?.querySelector("time")).not.toBeInTheDocument();
    expect(failedCard?.querySelector("[data-timing]")).not.toBeInTheDocument();
    expect(screen.getByText("Monthly withdrawal")).toBeInTheDocument();
    expect(
      screen
        .getByRole("button", {
          name: "Show details for transfer transfer_4",
        })
        .closest("li"),
    ).toHaveTextContent(`−${formatMoney(2500, "GBP")}`);
    fireEvent.click(screen.getByRole("button", {
      name: "Show details for transfer transfer_4",
    }));
    expect(failedCard).toHaveTextContent("Scheduled for");
    expect(failedCard?.querySelector(`time[datetime="${transfer.scheduled_for}"]`)).toBeInTheDocument();
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
