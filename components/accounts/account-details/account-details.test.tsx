import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import type { ReactElement } from "react";
import { textContent } from "@/test-utils/text";
import { act, fireEvent, render as testingRender, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDetails } from "./account-details";
import { AccountsList } from "@/components/accounts/accounts-list/accounts-list";
import { DataProvider } from "@/components/providers/data-provider";

const balance = {
  balance: 12_345,
  total_balance: 17_345,
  currency: "GBP",
};

const activePot = {
  id: "pot_active",
  name: "Holiday",
  balance: 5_000,
  currency: "GBP",
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

function accountDetails(userId?: string) {
  return (
    <DataProvider>
      <AccountDetails accountId="acc_123" userId={userId} />
    </DataProvider>
  );
}

describe("AccountDetails", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("keeps the balance cards visible while their values load", () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));

    render(accountDetails());

    const loadingBalance = screen.getByRole("status", {
      name: "Loading balance",
    });

    expect(within(loadingBalance).getByText("Balance")).toBeInTheDocument();
    expect(within(loadingBalance).getByText("Total balance")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading pots" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading balance…")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading pots…")).not.toBeInTheDocument();
    expect(screen.queryByText(textContent("£123.45"))).not.toBeInTheDocument();
  });

  it("uses indicators while accounts load and a balance retries", async () => {
    let resolveAccounts!: (response: Response) => void;
    const accountsResponse = new Promise<Response>((resolve) => {
      resolveAccounts = resolve;
    });

    fetchMock.mockImplementation((input) =>
      String(input) === "/api/accounts"
        ? accountsResponse
        : new Promise<Response>(() => undefined),
    );

    render(
      <DataProvider>
        <AccountsList />
      </DataProvider>,
    );

    expect(
      screen.getByRole("status", { name: "Loading accounts" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading accounts…")).not.toBeInTheDocument();

    await act(async () => {
      resolveAccounts(
        jsonResponse({
          accounts: [
            {
              id: "acc_123",
              description: "Current Account",
              balance_details: null,
            },
          ],
        }),
      );
    });

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Retry balance for Current Account",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Retrying balance for Current Account",
      }),
    ).toBeDisabled();
    expect(screen.queryByText("Retrying…")).not.toBeInTheDocument();
  });

  it("labels an account whose description matches the user ID as the main account", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        accounts: [
          {
            id: "acc_123",
            description: "user_123",
            balance_details: balance,
          },
        ],
      }),
    );

    const view = render(
      <DataProvider>
        <AccountsList userId="user_123" />
      </DataProvider>,
    );

    expect(await screen.findByText("Main Account")).toBeInTheDocument();
    expect(screen.queryByText("user_123")).not.toBeInTheDocument();
    expect(screen.queryByText("acc_123")).not.toBeInTheDocument();
    view.rerender(accountDetails("user_123"));
    expect(await screen.findByRole("heading", { level: 1, name: "Main Account" })).toBeInTheDocument();
  });

  it("shows balances and toggles deleted pots", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/accounts") {
        return jsonResponse({ accounts: [{ id: "acc_123", description: "Current Account", balance_details: null }] });
      }
      return url.endsWith("/balance")
        ? jsonResponse(balance)
        : jsonResponse({ pots: [activePot, deletedPot] });
    });

    render(accountDetails());

    expect(await screen.findByText(textContent("£123.45"))).toBeInTheDocument();
    expect(await screen.findByText("Holiday")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Holiday/ })).toHaveAttribute(
      "href",
      "/console/account/acc_123/pot/pot_active",
    );
    expect(screen.queryByText("Old pot")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Hide deleted pots" }));

    expect(screen.getByText("Old pot")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Old pot/ })).not.toBeInTheDocument();
    expect(screen.getByText("Old pot").closest("[aria-disabled='true']")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Current Account" })).toBeInTheDocument();
    expect(screen.getByText("Your account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to accounts/ })).toHaveAttribute(
      "href",
      "/console",
    );
    expect(screen.queryByText("acc_123")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Balance" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

    expect(await screen.findByText("Available balance")).toBeInTheDocument();
    expect(await screen.findByText(textContent("£123.45"))).toBeInTheDocument();
    expect(screen.getByText(textContent("£173.45")).closest("small")).toHaveTextContent(
      "Total balance: £173.45",
    );

    view.rerender(accountDetails());

    expect(await screen.findByText(textContent("£123.45"))).toBeInTheDocument();
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
        name: "Retry balance for Current Account",
      }),
    );

    expect(await screen.findByText(textContent("£123.45"))).toBeInTheDocument();
    expect((await screen.findByText(textContent("£173.45"))).closest("small")).toHaveTextContent(
      "Total balance: £173.45",
    );
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/balance"),
      ),
    ).toHaveLength(1);
  });

  it("handles an empty pots response", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input) === "/api/accounts") {
        return jsonResponse({ accounts: [] });
      }
      return String(input).endsWith("/balance")
        ? jsonResponse(balance)
        : jsonResponse({ pots: [] });
    });

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

function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ToastProvider });
}
