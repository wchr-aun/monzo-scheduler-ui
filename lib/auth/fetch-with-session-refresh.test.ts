import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("fetchWithSessionRefresh", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shares one refresh and retries waiting requests independently", async () => {
    const refresh = deferred<Response>();
    const retries: string[] = [];
    const attempts = new Map<string, number>();
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/auth/refresh") return refresh.promise;
      const key = String(url);
      const attempt = (attempts.get(key) ?? 0) + 1;
      attempts.set(key, attempt);
      if (attempt === 1) return new Response(null, { status: 401 });
      retries.push(key);
      return Response.json({ ok: true });
    });
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    const requests = [fetchWithSessionRefresh("/api/accounts"), fetchWithSessionRefresh("/api/pots")];
    await vi.waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1));
    expect(retries).toEqual([]);
    refresh.resolve(new Response(null, { status: 204 }));
    expect((await Promise.all(requests)).map((response) => response.status)).toEqual([200, 200]);
    expect(retries).toEqual(["/api/accounts", "/api/pots"]);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
  });

  it("reuses a completed refresh for a delayed 401", async () => {
    const delayed = deferred<Response>();
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockReturnValueOnce(delayed.promise)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    const first = fetchWithSessionRefresh("/api/accounts");
    const second = fetchWithSessionRefresh("/api/pots");
    expect((await first).ok).toBe(true);
    delayed.resolve(new Response(null, { status: 401 }));
    expect((await second).ok).toBe(true);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
  });

  it("returns the original response if refresh fails", async () => {
    const unauthorized = new Response(null, { status: 401 });
    fetchMock.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    expect(await fetchWithSessionRefresh("/api/accounts")).toBe(unauthorized);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a mutation only once with its original body", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    const options = { method: "POST", body: JSON.stringify({ amount: 100 }) };
    expect((await fetchWithSessionRefresh("/api/transfers", options)).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/transfers", options);
  });

  it("does not refresh approval-required responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    expect((await fetchWithSessionRefresh("/api/accounts")).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("redirects a private console page after refresh rejects the session", async () => {
    const replace = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/console/account/acc_123", replace } });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    await fetchWithSessionRefresh("/api/accounts");
    expect(replace).toHaveBeenCalledWith("/console");
  });

  it("does not redirect on a temporary refresh failure", async () => {
    const replace = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/console/account/acc_123", replace } });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 502 }));
    const { fetchWithSessionRefresh } = await import("./fetch-with-session-refresh");
    await fetchWithSessionRefresh("/api/accounts");
    expect(replace).not.toHaveBeenCalled();
  });
});
