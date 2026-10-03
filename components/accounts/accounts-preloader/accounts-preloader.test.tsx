import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import type { ReactElement } from "react";
import { fireEvent, render as testingRender, screen, waitFor } from "@testing-library/react";
import { useSWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsList } from "@/components/accounts/accounts-list/accounts-list";
import { AccountsPreloader } from "./accounts-preloader";
import { DataProvider } from "@/components/providers/data-provider";

describe("AccountsPreloader", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accounts: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  it("loads accounts into the shared cache without a visible account list", async () => {
    render(
      <DataProvider>
        <AccountsPreloader />
      </DataProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/accounts", {
        cache: "no-store",
      });
    });
  });

  it("deduplicates the preload when the current page also renders accounts", async () => {
    render(
      <DataProvider>
        <AccountsPreloader />
        <AccountsList />
      </DataProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("announces approval once after approval-required becomes a validated response, including empty accounts", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ code: "monzo_approval_required" }, { status: 403 }));
    render(<DataProvider><AccountsPreloader /><AccountsList /><RefreshAccounts /></DataProvider>);
    await screen.findByText(/Please allow access in the Monzo app/);
    expect(screen.queryByText("Monzo access approved.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Refresh accounts"));
    expect(await screen.findByText("Monzo access approved.")).toHaveAttribute("role", "status");
    fireEvent.click(screen.getByText("Refresh accounts"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(screen.getAllByText("Monzo access approved.")).toHaveLength(1);
  });

  it("does not announce approval for an existing approved session", async () => {
    render(<DataProvider><AccountsPreloader /><AccountsList /></DataProvider>);
    await screen.findByText("No accounts found.");
    expect(screen.queryByText("Monzo access approved.")).not.toBeInTheDocument();
  });
});

function RefreshAccounts() {
  const { mutate } = useSWRConfig();
  return <button onClick={() => void mutate("/api/accounts")}>Refresh accounts</button>;
}

function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ToastProvider });
}
