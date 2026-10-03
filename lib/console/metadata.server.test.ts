import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConsoleAccountName, getConsolePotName, requireConsoleSession } from "./metadata.server";
import AccountPage from "@/app/console/account/[accountId]/page";
import PotPage from "@/app/console/account/[accountId]/pot/[potId]/page";

const cookieGet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

const fetchMock = vi.fn<typeof fetch>();
const accountParams = { params: Promise.resolve({ accountId: "acc_123" }) };
const potParams = { params: Promise.resolve({ accountId: "acc_123", potId: "pot_123" }) };

beforeEach(() => {
  vi.stubEnv("BASE_URL", "https://backend.example");
  vi.stubEnv("SESSION_COOKIE_NAME", "custom-session");
  cookieGet.mockReset().mockReturnValue({ value: "secret-token" });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("console sessions and metadata", () => {
  it("uses the configured session cookie", async () => {
    expect(await requireConsoleSession()).toBe("secret-token");
    expect(cookieGet).toHaveBeenCalledWith("custom-session");
  });

  it("redirects signed-out pages and metadata without fetching private data", async () => {
    cookieGet.mockReturnValue(undefined);
    for (const request of [
      () => AccountPage(accountParams),
      () => PotPage(potParams),
      () => getConsoleAccountName("acc_123"),
      () => getConsolePotName("acc_123", "pot_123"),
    ]) {
      await expect(request()).rejects.toThrow("redirect:/console");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("formats the account name and keeps credentials server-side", async () => {
    fetchMock.mockResolvedValue(Response.json({ accounts: [
      { id: "acc_123", description: "joint account", balance_details: null },
    ] }));
    expect(await getConsoleAccountName("acc_123")).toBe("Joint Account");
    expect(fetchMock).toHaveBeenCalledWith(new URL("https://backend.example/accounts-with-balances"), expect.objectContaining({
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: "Bearer secret-token" },
    }));
  });

  it("loads the matching pot name from the account's pots", async () => {
    fetchMock.mockResolvedValue(Response.json([
      { id: "pot_123", name: "Holiday", balance: 0, currency: "GBP", deleted: false, cover_image_url: null, type: "regular" },
    ]));
    expect(await getConsolePotName("acc_123", "pot_123")).toBe("Holiday");
    expect(fetchMock.mock.calls[0][0]).toEqual(new URL("https://backend.example/pots?current_account_id=acc_123"));
  });

  it("uses safe fallback names for empty or malformed responses", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ accounts: [] }))
      .mockResolvedValueOnce(Response.json({ pots: [{ name: "Invalid" }] }));
    expect(await getConsoleAccountName("acc_123")).toBe("Account");
    expect(await getConsolePotName("acc_123", "pot_123")).toBe("Pot");
  });

  it("keeps pages usable when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("Unavailable"));
    expect(await getConsoleAccountName("acc_123")).toBe("Account");
    expect(await getConsolePotName("acc_123", "pot_123")).toBe("Pot");
  });
});
