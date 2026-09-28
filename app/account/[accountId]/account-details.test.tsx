import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsList } from "../../accounts-list";
import { DataProvider } from "../../data-provider";
import { AccountDetails } from "./account-details";

const balance = {
  balance: 12_345,
  total_balance: 17_345,
  currency: "GBP",
  spend_today: 678,
};

const activePot = {
  id: "pot_active",
  name: "Holiday",
  style: "beach_ball",
  balance: 5_000,
  currency: "GBP",
  created: "2026-01-02T03:04:05Z",
  updated: "2026-02-03T04:05:06Z",
  deleted: false,
};

const deletedPot = {
  ...activePot,
  id: "pot_deleted",
  name: "Old pot",
  deleted: true,
};

function jsonResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => body,
  } as Response;
}

function accountDetails() {
  return (
    <DataProvider>
      <AccountDetails accountId="acc_123" />
    </DataProvider>
  );
}

describe("AccountDetails", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows balances and toggles deleted pots", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      return url.endsWith("/balance")
        ? jsonResponse(balance)
        : jsonResponse({ pots: [activePot, deletedPot] });
    });

    render(accountDetails());

    expect(await screen.findByText("£123.45")).toBeInTheDocument();
    expect(await screen.findByText("Holiday")).toBeInTheDocument();
    expect(screen.queryByText("Old pot")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Hide deleted pots" }));

    expect(screen.getByText("Old pot")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reuses the balance loaded by the account list", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "/api/accounts") {
        return jsonResponse({
          accounts: [
            {
              id: "acc_123",
              description: "Current Account",
              created: "2026-01-02T03:04:05Z",
              balance_details: balance,
            },
          ],
        });
      }

      return url.endsWith("/balance")
        ? jsonResponse(balance)
        : jsonResponse({ pots: [] });
    });

    const view = render(
      <DataProvider>
        <AccountsList />
      </DataProvider>,
    );

    expect(await screen.findByText("£173.45")).toBeInTheDocument();

    view.rerender(accountDetails());

    expect(await screen.findByText("£123.45")).toBeInTheDocument();
    expect(await screen.findByText("No pots found.")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/balance"),
      ),
    ).toHaveLength(0);

    view.rerender(
      <DataProvider>
        <AccountsList />
      </DataProvider>,
    );

    expect(await screen.findByText("Current Account")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input) === "/api/accounts"),
    ).toHaveLength(1);
  });

  it("retries a missing enriched balance on demand", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "/api/accounts") {
        return jsonResponse({
          accounts: [
            {
              id: "acc_123",
              description: "Current Account",
              created: "2026-01-02T03:04:05Z",
              balance_details: null,
            },
          ],
        });
      }

      return jsonResponse(balance);
    });

    render(
      <DataProvider>
        <AccountsList />
      </DataProvider>,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Retry total balance for Current Account",
      }),
    );

    expect(await screen.findByText("£173.45")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/balance"),
      ),
    ).toHaveLength(1);
  });

  it("handles an empty pots response", async () => {
    fetchMock.mockImplementation(async (input) =>
      String(input).endsWith("/balance")
        ? jsonResponse(balance)
        : jsonResponse({ pots: [] }),
    );

    render(accountDetails());

    expect(await screen.findByText("No pots found.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows errors without throwing when requests fail", async () => {
    fetchMock.mockRejectedValue(new Error("Backend unavailable"));

    render(accountDetails());

    expect(await screen.findByText("Could not load the balance.")).toBeInTheDocument();
    expect(await screen.findByText("Could not load pots.")).toBeInTheDocument();
  });
});
