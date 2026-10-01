import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

import { DELETE } from "./route";

const context = {
  params: Promise.resolve({
    accountId: "acc_123",
    potId: "pot_456",
    setupId: "setup_1",
  }),
};

function backendResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => body,
  } as Response;
}

describe("cancel scheduled transfer route", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("BASE_URL", "https://backend.example/");
    vi.stubEnv("SESSION_COOKIE_NAME", "session");
    cookieGet.mockReset();
    cookieGet.mockReturnValue({ value: "secret-token" });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("cancels the transfer using the authenticated backend", async () => {
    const backend = new Response(null, { status: 204 });
    const jsonSpy = vi.spyOn(backend, "json");
    fetchMock.mockResolvedValue(backend);

    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example/schedule-transfer/setup_1",
      expect.objectContaining({
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer secret-token",
        },
        cache: "no-store",
      }),
    );
  });

  it("passes through backend client errors", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({ detail: "Not found" }, { ok: false, status: 404 }),
    );

    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "cancel_transfer_failed" });
  });

  it("rejects an unexpected backend success status", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({ setup_id: "another_setup", status: "deactivated" }),
    );

    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "invalid_cancel_transfer_response",
    });
  });

  it("does not call the backend without a session", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
