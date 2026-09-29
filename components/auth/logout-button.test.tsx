import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "@/components/auth/logout-button";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("LogoutButton", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    refresh.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("logs out, clears all cached data, and refreshes the page", async () => {
    const cache = new Map();
    cache.set("/api/accounts", { data: [{ id: "acc_123" }] });
    cache.set("/api/accounts/acc_123/balance", { data: { balance: 123 } });
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    render(
      <SWRConfig value={{ provider: () => cache }}>
        <LogoutButton />
      </SWRConfig>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByRole("button", { name: "Logging out…" })).toBeDisabled();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(cache.size).toBe(0);
  });

  it("keeps cached data and reports an error when logout fails", async () => {
    const cache = new Map();
    cache.set("/api/accounts", { data: [{ id: "acc_123" }] });
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    render(
      <SWRConfig value={{ provider: () => cache }}>
        <LogoutButton />
      </SWRConfig>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(
      await screen.findByRole("alert", { name: "" }),
    ).toHaveTextContent("Could not log out. Please try again.");
    expect(cache.size).toBe(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Log out" })).toBeEnabled();
  });
});
