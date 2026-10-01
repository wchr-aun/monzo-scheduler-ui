import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConsolePage from "./page";

const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));
vi.mock("@/lib/auth/session.server", () => ({
  getUserId: () => "user_123",
}));
vi.mock("@/components/accounts/accounts-list", () => ({
  AccountsList: ({ userId }: { userId: string }) => <p>Accounts for {userId}</p>,
}));
vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button>Log out</button>,
}));

describe("ConsolePage", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    getCookie.mockReset();
    vi.stubEnv("SESSION_COOKIE_NAME", "custom-session");
    vi.stubEnv("BASE_URL", "https://backend.example.test/");
  });

  it("offers login when signed out", async () => {
    render(await ConsolePage());

    expect(getCookie).toHaveBeenCalledWith("custom-session");
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://backend.example.test/monzo-redirect",
    );
  });

  it("recognizes the configured session cookie and displays accounts", async () => {
    getCookie.mockReturnValue({ value: "session-token" });

    render(await ConsolePage());

    expect(getCookie).toHaveBeenCalledWith("custom-session");
    expect(screen.getByText("Accounts for user_123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
