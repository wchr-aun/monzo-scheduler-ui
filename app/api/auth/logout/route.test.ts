import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("logout route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
  });
});
