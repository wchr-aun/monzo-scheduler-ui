import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import type { ReactElement } from "react";
import { formatLocalDateTime } from "@/lib/scheduled-transfers/date-time";
import { act, fireEvent, render as testingRender, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "@/components/providers/data-provider";
import { MoneyVisibilityProvider } from "@/components/providers/money-visibility-provider";
import { CreateScheduledTransfer } from "./create-scheduled-transfer";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers/scheduled-transfers";
import { MoneyVisibilityToggle } from "@/components/ui/money-visibility-toggle/money-visibility-toggle";

function response(ok = true) {
  return { ok, status: ok ? 204 : 422 } as Response;
}

function createScheduledTransfer() {
  return (
    <DataProvider>
      <CreateScheduledTransfer
        accountId="acc_123"
        potId="pot_456"
        currency="GBP"
      />
    </DataProvider>
  );
}

const transfer = {
  setup_id: "setup_1",
  transfer_id: "transfer_1",
  status: "pending",
  created_at: "2026-09-01T08:15:00Z",
  executed_at: null,
  scheduled_for: "2099-01-01T09:30:00Z",
  interval: "monthly",
  type: "deposit",
  amount: 100,
};

function scheduledTransfersPage(scheduledTransfers: (typeof transfer)[]) {
  return {
    scheduledTransfers,
    total: scheduledTransfers.length,
    limit: 50,
    offset: 0,
  };
}

describe("CreateScheduledTransfer", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults the date and time to the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T08:30:00Z"));
    render(createScheduledTransfer());

    fireEvent.click(
      screen.getByRole("button", {
        name: "Schedule a transfer",
      }),
    );

    const dateTime = screen.getByLabelText("UK date and time");
    expect(dateTime).toHaveValue("2026-10-01T09:30");
    expect(dateTime).toHaveAttribute("min", "2026-10-01T09:30");
    expect(screen.getByText(/Local date and time:/)).toContainElement(
      document.querySelector(
        'time[datetime="2026-10-01T09:30:00+01:00"]',
      ),
    );
  });

  it("does not submit a scheduled transfer in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T08:30:00Z"));
    render(createScheduledTransfer());

    fireEvent.click(
      screen.getByRole("button", {
        name: "Schedule a transfer",
      }),
    );
    const dateTime = screen.getByLabelText("UK date and time");
    fireEvent.change(dateTime, {
      target: { value: "2026-09-30T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Amount (pence)"), {
      target: { value: "100" },
    });
    fireEvent.submit(dateTime.closest("form")!);

    expect(
      screen.getByText("Date and time must not be in the past."),
    ).toHaveAttribute("role", "alert");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("expands the form and creates a transfer using UK local time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-10-01T08:30:00Z"));
    fetchMock.mockResolvedValue(response());
    render(createScheduledTransfer());

    const toggle = screen.getByRole("button", {
      name: "Schedule a transfer",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByLabelText("UK date and time")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("UK date and time"), {
      target: { value: "2026-10-01T09:30" },
    });
    const selectedUkDateTime = "2026-10-01T09:30:00+01:00";
    const expectedLocalDateTime = formatLocalDateTime(selectedUkDateTime);
    const localTime = screen.getByText(expectedLocalDateTime);
    expect(localTime).toHaveAttribute("datetime", selectedUkDateTime);
    expect(localTime.parentElement).toHaveTextContent(
      `Local date and time: ${expectedLocalDateTime}`,
    );
    const interval = screen.getByLabelText("Interval");
    expect(interval).toHaveTextContent("Monthly");
    expect(interval).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(interval);
    expect(interval).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("option", { name: "Weekly" }));
    expect(interval).toHaveAttribute("aria-expanded", "false");
    expect(interval).toHaveTextContent("Weekly");

    const transferType = screen.getByLabelText("Transfer type");
    expect(transferType).toHaveTextContent("Deposit into pot");
    fireEvent.click(transferType);
    fireEvent.click(screen.getByRole("option", { name: "Withdraw from pot" }));
    fireEvent.change(screen.getByLabelText("Amount (pence)"), {
      target: { value: "2500" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create scheduled transfer" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datetime: selectedUkDateTime,
          interval: "weekly",
          type: "withdraw",
          amount: 2500,
          pot_id: "pot_456",
          account_id: "acc_123",
        }),
      },
    );
    expect(
      await screen.findByText("Scheduled transfer created."),
    ).toHaveAttribute("role", "status");
    expect(screen.queryByLabelText("UK date and time")).not.toBeInTheDocument();
  });

  it.each([true, false])("preserves the list while refreshing after creation (refresh succeeds: %s)", async (refreshSucceeds) => {
    let resolveRefresh!: (response: Response) => void;
    const refresh = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const newTransfer = { ...transfer, setup_id: "setup_2", transfer_id: "transfer_2" };
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => scheduledTransfersPage([transfer]),
      } as Response)
      .mockResolvedValueOnce(response())
      .mockReturnValueOnce(refresh);

    render(
      <DataProvider>
        <CreateScheduledTransfer
          accountId="acc_123"
          potId="pot_456"
          currency="GBP"
        />
        <ScheduledTransfers accountId="acc_123" potId="pot_456" />
      </DataProvider>,
    );

    const toggle = await screen.findByRole("button", {
      name: "Show details for transfer transfer_1",
    });
    fireEvent.click(toggle);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Schedule a transfer",
      }),
    );
    fireEvent.change(screen.getByLabelText("UK date and time"), {
      target: { value: "2099-01-01T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Amount (pence)"), {
      target: { value: "100" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create scheduled transfer" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("No scheduled transfers found.")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Loading scheduled transfers")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show details for transfer transfer_2" })).not.toBeInTheDocument();

    await act(async () => {
      resolveRefresh({
        ok: refreshSucceeds,
        status: refreshSucceeds ? 200 : 502,
        json: async () => scheduledTransfersPage([transfer, newTransfer]),
      } as Response);
    });

    if (refreshSucceeds) {
      expect(await screen.findByRole("button", { name: "Show details for transfer transfer_2" })).toBeInTheDocument();
    } else {
      expect(await screen.findByText("Could not load scheduled transfers.")).toHaveAttribute("role", "alert");
      expect(screen.queryByRole("button", { name: "Show details for transfer transfer_2" })).not.toBeInTheDocument();
    }
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/accounts/acc_123/pots/pot_456/scheduled-transfers?status=completed%2Cpending%2Cfailed",
      { cache: "no-store" },
    );
  });

  it("allows whole-pence amounts above the pot balance and shows their pound value", async () => {
    fetchMock.mockResolvedValue(response());
    render(createScheduledTransfer());

    fireEvent.click(
      screen.getByRole("button", {
        name: "Schedule a transfer",
      }),
    );
    const amount = screen.getByLabelText("Amount (pence)");
    expect(amount).toHaveAttribute("autocomplete", "off");

    fireEvent.change(amount, { target: { value: "25" } });
    expect(amount).toHaveValue("25");
    expect(
      screen.getByRole("status", { name: "Value in pounds" }),
    ).toHaveTextContent("£0.25");

    fireEvent.change(amount, { target: { value: "25.5" } });
    expect(amount).toHaveValue("25");

    fireEvent.change(amount, { target: { value: "5000" } });
    expect(amount).toHaveValue("5000");
    expect(
      screen.getByRole("status", { name: "Value in pounds" }),
    ).toHaveTextContent("£50.00");

    fireEvent.change(amount, { target: { value: "5001" } });
    expect(amount).toHaveValue("5001");
    expect(
      screen.getByRole("status", { name: "Value in pounds" }),
    ).toHaveTextContent("£50.01");

    fireEvent.change(screen.getByLabelText("UK date and time"), {
      target: { value: "2099-01-01T09:30" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create scheduled transfer" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      amount: 5001,
    });
  });

  it("keeps the entered amount preview visible when money is masked", () => {
    render(
      <MoneyVisibilityProvider>
        <MoneyVisibilityToggle />
        {createScheduledTransfer()}
      </MoneyVisibilityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide money values" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Schedule a transfer" }),
    );
    fireEvent.change(screen.getByLabelText("Amount (pence)"), {
      target: { value: "2500" },
    });

    expect(
      screen.getByRole("status", { name: "Value in pounds" }),
    ).toHaveTextContent("£25.00");
    expect(
      screen.queryByRole("button", { name: "Reveal value in pounds" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the form open and announces backend failures", async () => {
    fetchMock.mockResolvedValue(response(false));
    render(createScheduledTransfer());

    fireEvent.click(
      screen.getByRole("button", {
        name: "Schedule a transfer",
      }),
    );
    fireEvent.change(screen.getByLabelText("UK date and time"), {
      target: { value: "2099-01-01T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Amount (pence)"), {
      target: { value: "100" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create scheduled transfer" }),
    );

    expect(
      await screen.findByText("Backend error: Could not create the scheduled transfer. Please try again."),
    ).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("UK date and time")).toBeInTheDocument();
  });

  it.each(["success", "backend", "connection"])("handles %s after the progress toast is dismissed", async (outcome) => {
    let resolve!: (value: Response) => void;
    let reject!: (reason: unknown) => void;
    fetchMock.mockReturnValue(new Promise<Response>((res, rej) => { resolve = res; reject = rej; }));
    render(createScheduledTransfer());
    fireEvent.click(screen.getByRole("button", { name: "Schedule a transfer" }));
    fireEvent.change(screen.getByLabelText("UK date and time"), { target: { value: "2099-01-01T09:30" } });
    fireEvent.change(screen.getByLabelText("Amount (pence)"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Create scheduled transfer" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification: Creating scheduled transfer…" }));
    expect(screen.queryByText("Creating scheduled transfer…")).not.toBeInTheDocument();
    await act(async () => {
      if (outcome === "connection") reject(new TypeError("private connection detail"));
      else resolve(response(outcome === "success"));
    });
    if (outcome === "success") {
      expect(screen.queryByText("Scheduled transfer created.")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("UK date and time")).not.toBeInTheDocument();
    } else {
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(screen.getByRole("alert")).toHaveTextContent(outcome === "connection" ? "Connection error:" : "Backend error:");
      expect(screen.getByLabelText("UK date and time")).toBeInTheDocument();
    }
  });
});

function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ToastProvider });
}
