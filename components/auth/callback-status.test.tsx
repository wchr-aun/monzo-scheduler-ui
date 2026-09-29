import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CallbackStatus } from "@/components/auth/callback-status";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

describe("CallbackStatus", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    searchParams = new URLSearchParams({ code: "auth-code", state: "auth-state" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redirects to the homepage three seconds after login succeeds", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    render(<CallbackStatus />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/callback?code=auth-code&state=auth-state",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(
      screen.getByText("Redirecting you back to the homepage…"),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2_999));
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledWith("/");
  });
});
