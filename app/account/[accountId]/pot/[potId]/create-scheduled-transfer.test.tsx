import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../../../../data-provider";
import { CreateScheduledTransfer } from "./create-scheduled-transfer";

function response(ok = true) {
  return { ok, status: ok ? 204 : 422 } as Response;
}

function createScheduledTransfer() {
  return (
    <DataProvider>
      <CreateScheduledTransfer accountId="acc_123" potId="pot_456" />
    </DataProvider>
  );
}

describe("CreateScheduledTransfer", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("expands the form and creates a transfer using UK local time", async () => {
    fetchMock.mockResolvedValue(response());
    render(createScheduledTransfer());

    const toggle = screen.getByRole("button", {
      name: "Create a new scheduled transfer",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByLabelText("UK date and time")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("UK date and time"), {
      target: { value: "2026-10-01T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Interval"), {
      target: { value: "weekly" },
    });
    fireEvent.change(screen.getByLabelText("Transfer type"), {
      target: { value: "withdraw" },
    });
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
          datetime: "2026-10-01T09:30:00+01:00",
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

  it("keeps the form open and announces backend failures", async () => {
    fetchMock.mockResolvedValue(response(false));
    render(createScheduledTransfer());

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create a new scheduled transfer",
      }),
    );
    fireEvent.change(screen.getByLabelText("UK date and time"), {
      target: { value: "2026-01-01T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Amount (pence)"), {
      target: { value: "100" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create scheduled transfer" }),
    );

    expect(
      await screen.findByText("Could not create the scheduled transfer."),
    ).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("UK date and time")).toBeInTheDocument();
  });
});
