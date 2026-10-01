import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

import { GET, POST } from "./route";

const context = {
  params: Promise.resolve({ accountId: "acc_123", potId: "pot_456" }),
};

function backendResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => body,
  } as Response;
}

describe("scheduled transfers route", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("BASE_URL", "https://backend.example/");
    vi.stubEnv("SESSION_COOKIE_NAME", "session");
    cookieGet.mockReset();
    cookieGet.mockReturnValue({ value: "secret-token" });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("forwards authentication and returns only transfers for the requested pot", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({
        items: [
          {
            setup_id: "setup_1",
            transfer_id: "transfer_1",
            status: "pending",
            created_at: "2026-09-01T08:15:00Z",
            executed_at: null,
            scheduled_for: "2026-10-01T09:30:00Z",
            interval: "monthly",
            type: "deposit",
            amount: 2500,
            pot_id: "pot_456",
            account_id: "acc_123",
          },
          {
            setup_id: "setup_2",
            transfer_id: "transfer_2",
            status: "completed",
            created_at: "2026-09-02T08:15:00Z",
            executed_at: "2026-10-02T09:30:05Z",
            scheduled_for: "2026-10-02T09:30:00Z",
            interval: "monthly",
            type: "deposit",
            amount: 1000,
            pot_id: "another_pot",
            account_id: "acc_123",
          },
        ],
        total: 2,
        limit: 50,
        offset: 0,
      }),
    );

    const response = await GET(new Request("http://localhost"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.scheduledTransfers).toHaveLength(1);
    expect(body.scheduledTransfers[0].transfer_id).toBe("transfer_1");
    expect(body.scheduledTransfers[0].created_at).toBe(
      "2026-09-01T08:15:00Z",
    );
    expect(body.scheduledTransfers[0].executed_at).toBeNull();
    expect(body).toMatchObject({ total: 2, limit: 50, offset: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "https://backend.example/scheduled-transfers?limit=50&offset=0&status=completed%2Cpending%2Cfailed",
      ),
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer secret-token",
        },
        cache: "no-store",
      }),
    );
  });

  it("forwards valid pagination parameters", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({ items: [], total: 75, limit: 25, offset: 50 }),
    );

    const response = await GET(
      new Request("http://localhost?limit=25&offset=50"),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      scheduledTransfers: [],
      total: 75,
      limit: 25,
      offset: 50,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "https://backend.example/scheduled-transfers?limit=25&offset=50&status=completed%2Cpending%2Cfailed",
      ),
      expect.anything(),
    );
  });

  it("forwards selected statuses", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({ items: [], total: 0, limit: 50, offset: 0 }),
    );

    const response = await GET(
      new Request("http://localhost?status=pending,cancelled"),
      context,
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "https://backend.example/scheduled-transfers?limit=50&offset=0&status=pending%2Ccancelled",
      ),
      expect.anything(),
    );
  });

  it("rejects invalid statuses without calling the backend", async () => {
    const response = await GET(
      new Request("http://localhost?status=pending,unknown"),
      context,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_status" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects out-of-range pagination without calling the backend", async () => {
    const response = await GET(
      new Request("http://localhost?limit=101&offset=-1"),
      context,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_pagination" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid backend response", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({
        items: [{ setup_id: "incomplete" }],
        total: 1,
        limit: 50,
        offset: 0,
      }),
    );

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "invalid_scheduled_transfers_response",
    });
  });

  it("rejects invalid pagination metadata", async () => {
    fetchMock.mockResolvedValue(
      backendResponse({ items: [], total: 0, limit: 0, offset: 0 }),
    );

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "invalid_scheduled_transfers_response",
    });
  });

  it("does not call the backend without a session", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a scheduled transfer with the authenticated backend", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(
        {
          status: "scheduled",
          setup_id: "setup_1",
          transfer_id: "transfer_1",
          next_run_at: "2026-10-01T09:30:00+01:00",
        },
        { status: 201 },
      ),
    );
    const payload = {
      datetime: "2026-10-01T09:30:00+01:00",
      interval: "monthly",
      type: "deposit",
      amount: 2500,
      pot_id: "pot_456",
      account_id: "acc_123",
    };

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      context,
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example/schedule-transfer",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer secret-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }),
    );
  });

  it("rejects invalid schedule data without calling the backend", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: "2026-10-01T09:30:15+01:00",
          interval: "monthly",
          type: "deposit",
          amount: 0,
          pot_id: "pot_456",
          account_id: "acc_123",
        }),
      }),
      context,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid create response from the backend", async () => {
    fetchMock.mockResolvedValue(backendResponse({ status: "scheduled" }));

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: "2026-10-01T09:30:00+01:00",
          interval: "daily",
          type: "withdraw",
          amount: 2500,
          pot_id: "pot_456",
          account_id: "acc_123",
        }),
      }),
      context,
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "invalid_schedule_transfer_response",
    });
  });

  it("rejects account and pot IDs that do not match the route", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: "2026-10-01T09:30:00+01:00",
          interval: "monthly",
          type: "deposit",
          amount: 2500,
          pot_id: "another_pot",
          account_id: "acc_123",
        }),
      }),
      context,
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not create a transfer without a session", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: "2026-01-01T09:30:00+00:00",
          interval: "monthly",
          type: "deposit",
          amount: 2500,
          pot_id: "pot_456",
          account_id: "acc_123",
        }),
      }),
      context,
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
