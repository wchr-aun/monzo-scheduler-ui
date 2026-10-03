import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import type { ReactElement } from "react";
import { act, render as testingRender, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CallbackStatus } from "./callback-status";

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

  it("redirects to the console three seconds after login succeeds", async () => {
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
      screen.getByText("Redirecting you to the console…"),
    ).toBeInTheDocument();
    expect(screen.getByText("Logged in successfully.")).toHaveAttribute("role", "status");

    act(() => vi.advanceTimersByTime(2_999));
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledWith("/console");
  });

  it.each(["code", "state"])("rejects a callback without %s", async (parameter) => {
    searchParams.delete(parameter);

    render(<CallbackStatus />);

    expect(
      screen.getByText("Invalid callback: code and state are required."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Logged in successfully.")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3_000));
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows an error and stays on the callback page when login fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 502 }));

    render(<CallbackStatus />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText("Could not complete login. Please try logging in again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Logged in successfully.")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3_000));
    expect(replace).not.toHaveBeenCalled();
  });

});

function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ToastProvider });
}
