import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import { LoginButton } from "./login-button";

afterEach(() => vi.unstubAllGlobals());

describe("login action errors", () => {
  it.each(["backend", "connection", "invalid redirect"])("shows a danger notification for %s failures", async (failure) => {
    const fetchMock = vi.fn();
    if (failure === "connection") fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    else if (failure === "invalid redirect") fetchMock.mockResolvedValue(Response.json({ url: "javascript:alert(1)" }));
    else fetchMock.mockResolvedValue(Response.json({ error: "login_unavailable" }, { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ToastProvider><LoginButton href="/api/auth/login" /></ToastProvider>);
    fireEvent.click(screen.getByRole("link", { name: "Login with Monzo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(failure === "connection" ? "Connection error:" : "Backend error:");
    expect(screen.queryByText("Starting login…")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("aria-disabled", "false");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login?format=json", expect.any(Object));
  });
});
