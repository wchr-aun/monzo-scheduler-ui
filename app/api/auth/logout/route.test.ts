import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/cookie-names";

const cookieGet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

const token = `header.${Buffer.from(JSON.stringify({ sub: "user_123" })).toString("base64url")}.signature`;

describe("logout route", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("BASE_URL", "https://backend.example/");
    vi.stubEnv("SESSION_COOKIE_NAME", "monzo_session");
    cookieGet.mockReset().mockReturnValue({ value: token });
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("expires the configured session cookie without returning data", async () => {
    vi.stubEnv("SESSION_COOKIE_NAME", "monzo_session");
    vi.stubEnv("NODE_ENV", "production");

    const response = await POST();
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(setCookie).toContain("monzo_session=");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).toContain(`${REFRESH_TOKEN_COOKIE_NAME}=`);
    expect(cookieGet).toHaveBeenCalledWith("monzo_session");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example/logout",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: "user_123",
        cache: "no-store",
      }),
    );
  });

  it("clears cookies without contacting the backend when already signed out", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await POST();

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a session without a valid user ID", async () => {
    cookieGet.mockReturnValue({ value: "invalid-token" });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("reports missing backend configuration", async () => {
    vi.stubEnv("BASE_URL", "");

    const response = await POST();

    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it.each([401, 403, 500])("preserves cookies when the backend returns %s", async (status) => {
    fetchMock.mockResolvedValue(new Response("private backend error", { status }));

    const response = await POST();

    expect(response.status).toBe(status < 500 ? status : 502);
    expect(await response.json()).toEqual({ error: "logout_failed" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("preserves cookies when the backend is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("Unavailable"));

    const response = await POST();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "logout_unavailable" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
