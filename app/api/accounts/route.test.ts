import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getAccounts } from "./route";
import { GET as getBalance } from "@/app/api/accounts/[accountId]/balance/route";
import { GET as getPots } from "@/app/api/accounts/[accountId]/pots/route";

const cookieGet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

const context = { params: Promise.resolve({ accountId: "acc_123" }) };
const request = new Request("http://localhost");
const balance = { balance: 1000, total_balance: 3000, currency: "GBP" };
const account = { id: "acc_123", description: "Personal", balance_details: balance };
const pot = { id: "pot_123", name: "Rent", balance: 2000, currency: "GBP", deleted: false };

const routes = [
  {
    name: "accounts",
    get: () => getAccounts(),
    valid: { accounts: [{ ...account, private_field: "removed", balance_details: { ...balance, private_field: "removed" } }] },
    expected: { accounts: [account] },
    invalid: { accounts: [{ ...account, balance_details: { ...balance, balance: 1.5 } }] },
  },
  {
    name: "balance",
    get: () => getBalance(request, context),
    valid: { ...balance, private_field: "removed" },
    expected: balance,
    invalid: { ...balance, currency: "" },
  },
  {
    name: "pots",
    get: () => getPots(request, context),
    valid: { pots: [{ ...pot, private_field: "removed" }] },
    expected: { pots: [pot] },
    invalid: { pots: [{ ...pot, deleted: "false" }] },
  },
];

describe.each(routes)("$name response validation", ({ name, get, valid, expected, invalid }) => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("BASE_URL", "https://backend.example");
    vi.stubEnv("SESSION_COOKIE_NAME", "session");
    cookieGet.mockReset().mockReturnValue({ value: "secret-token" });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns validated fields without exposing extra backend data", async () => {
    fetchMock.mockResolvedValue(Response.json(valid));
    const response = await get();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expected);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      headers: { Accept: "application/json", Authorization: "Bearer secret-token" },
      cache: "no-store",
    }));
  });

  it("rejects invalid backend fields", async () => {
    fetchMock.mockResolvedValue(Response.json(invalid));
    const response = await get();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ source: "backend", error: `invalid_${name}_response` });
  });

  it("does not request backend data when signed out", async () => {
    cookieGet.mockReturnValue(undefined);
    const response = await get();
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves backend permission errors", async () => {
    fetchMock.mockResolvedValue(Response.json({ code: "forbidden.insufficient_permissions" }, { status: 403 }));
    const response = await get();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ source: "backend", code: "forbidden.insufficient_permissions" });
  });

  it("handles unavailable backends", async () => {
    fetchMock.mockRejectedValue(new Error("Unavailable"));
    const response = await get();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ source: "backend", error: `${name}_unavailable` });
  });
});

describe("backend response shapes", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "https://backend.example");
    cookieGet.mockReturnValue({ value: "secret-token" });
  });

  it("continues to accept a bare pot array from the backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([pot])));
    expect(await (await getPots(request, context)).json()).toEqual({ pots: [pot] });
  });

  it("accepts empty account and pot lists", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ accounts: [] }))
      .mockResolvedValueOnce(Response.json({ pots: [] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await (await getAccounts()).json()).toEqual({ accounts: [] });
    expect(await (await getPots(request, context)).json()).toEqual({ pots: [] });
  });

  it("accepts accounts whose balance is unavailable", async () => {
    const accounts = [{ ...account, balance_details: null }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ accounts })));
    expect(await (await getAccounts()).json()).toEqual({ accounts });
  });
});
