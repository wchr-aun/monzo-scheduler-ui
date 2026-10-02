import { render, waitFor } from "@testing-library/react";
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
});
