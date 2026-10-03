import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("login redirect", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "https://backend.example");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: {
      location: "https://auth.example/authorize",
      "set-cookie": "monzo_oauth_state=example-state; HttpOnly",
    } }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each([false, true])("supports navigation and a checked JSON redirect (JSON: %s)", async (json) => {
    const response = await GET(new Request(`https://frontend.example/api/auth/login${json ? "?format=json" : ""}`));
    expect(response.status).toBe(json ? 200 : 302);
    expect(response.cookies.get("monzo_oauth_state")?.value).toBe("example-state");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    if (json) expect(await response.json()).toEqual({ url: "https://auth.example/authorize" });
    else expect(response.headers.get("location")).toBe("https://auth.example/authorize");
  });

  it("returns a safe backend error without setting cookies when the backend fails", async () => {
    fetchMock.mockRejectedValue(new Error("private backend details"));
    const response = await GET(new Request("https://frontend.example/api/auth/login?format=json"));
    expect(await response.json()).toEqual({ source: "backend", error: "login_unavailable" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects unsafe redirect URLs", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: "javascript:alert(1)" } }));
    const response = await GET(new Request("https://frontend.example/api/auth/login?format=json"));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ source: "backend", error: "invalid_login_redirect" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
