import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { request, readJson } from "./request";
import { AppError, normaliseError } from "./app-error";
import { fetchAccounts } from "@/lib/accounts/client";

describe("error classification", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
  afterEach(() => vi.unstubAllGlobals());

  it("classifies backend failures without exposing untrusted response messages", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "accounts_failed", message: "secret backend detail" }, { status: 502 }));
    await expect(request("/api/accounts", {}, "load accounts")).rejects.toMatchObject({
      source: "backend", code: "accounts_failed", status: 502,
      message: "Backend error: Could not load accounts. Please try again.",
    });
  });

  it("keeps HTTP errors distinct from malformed successful payloads", async () => {
    fetchMock.mockResolvedValue(new Response("not JSON", { status: 500 }));
    await expect(request("/api/accounts", {}, "load accounts")).rejects.toMatchObject({ source: "backend", status: 500, code: "request_failed" });
    await expect(readJson(new Response("not JSON"), "load accounts")).rejects.toMatchObject({ source: "backend", code: "invalid_json_response" });
    fetchMock.mockResolvedValue(Response.json({ unexpected: [] }));
    await expect(fetchAccounts("/api/accounts")).rejects.toMatchObject({ source: "backend", code: "invalid_accounts_response" });
  });

  it("identifies transport failures but preserves aborted requests", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request("/api/accounts", {}, "load accounts")).rejects.toMatchObject({ source: "connection" });
    const aborted = new DOMException("Stopped", "AbortError");
    fetchMock.mockRejectedValue(aborted);
    await expect(request("/api/accounts", {}, "load accounts")).rejects.toBe(aborted);
  });

  it("does not treat unexpected application exceptions as network failures", async () => {
    const frontend = new Error("private exception text");
    fetchMock.mockRejectedValue(frontend);
    await expect(request("/api/accounts", {}, "load accounts")).rejects.toBe(frontend);
    expect(normaliseError(frontend, "load accounts").message).toBe("Frontend error: Could not load accounts. Try reloading the page.");
    expect(normaliseError(Object.assign(new Error("hidden server detail"), { digest: "123" })).source).toBe("backend");
  });

  it("reports session expiry only after the shared refresh attempt fails", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "not_authenticated" }, { status: 401 }));
    await expect(request("/api/accounts", {}, "load accounts")).rejects.toMatchObject({ message: "Backend error: Your session has expired. Please log in again." });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/refresh", expect.objectContaining({ method: "POST" }));
  });

  it("does not report a recovered session as an error", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ accounts: [] }));
    expect(await fetchAccounts("/api/accounts")).toEqual([]);
  });

  it("preserves the expected approval-required state", async () => {
    fetchMock.mockResolvedValue(Response.json({ code: "monzo_approval_required" }, { status: 403 }));
    await expect(fetchAccounts("/api/accounts")).rejects.toMatchObject({ name: "AccessNotApprovedError", code: "monzo_approval_required" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
