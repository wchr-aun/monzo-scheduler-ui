import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast-provider";
import { AppError } from "@/lib/errors/app-error";
import { DataProvider } from "@/components/providers/data-provider";
import { AccountsPreloader } from "@/components/accounts/accounts-preloader/accounts-preloader";
import { AccountsList } from "@/components/accounts/accounts-list/accounts-list";
import { MoneyVisibilityProvider } from "@/components/providers/money-visibility-provider";
import { MoneyVisibilityToggle } from "@/components/ui/money-visibility-toggle/money-visibility-toggle";
import RootLayout from "@/app/layout";
import { renderToStaticMarkup } from "react-dom/server";

function Reports() {
  const toast = useToast();
  return <>
    <button onClick={() => toast.reportError(new AppError("backend", "load accounts"))}>Report</button>
    <button onClick={() => toast.reportError(new DOMException("Stopped", "AbortError"))}>Abort</button>
    <button onClick={() => toast.reportError(new AppError("backend", "load accounts", "monzo_approval_required", 403))}>Approval</button>
    <button onClick={() => {
      toast.reportError(new AppError("backend", "load accounts", "not_authenticated", 401));
      toast.reportError(new AppError("backend", "load pots", "not_authenticated", 401));
    }}>Expired session</button>
    <button onClick={() => {
      const id = toast.show({ tone: "progress", message: "Creating…" });
      toast.reportError(new AppError("connection", "create the scheduled transfer"), { toastId: id });
    }}>Fail action</button>
  </>;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.themeStorageUnavailable;
});

describe("global error reporting", () => {
  it("deduplicates repeated reports and permits a later independent failure", () => {
    vi.useFakeTimers();
    render(<ToastProvider><Reports /></ToastProvider>);
    fireEvent.click(screen.getByText("Report"));
    fireEvent.click(screen.getByText("Report"));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Dismiss notification/ }));
    fireEvent.click(screen.getByText("Report"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10_000));
    fireEvent.click(screen.getByText("Report"));
    expect(screen.getByRole("alert")).toHaveTextContent("Backend error:");
  });

  it("ignores aborts and pending approval while replacing action progress with danger messages", () => {
    render(<ToastProvider><Reports /></ToastProvider>);
    fireEvent.click(screen.getByText("Abort"));
    fireEvent.click(screen.getByText("Approval"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Fail action"));
    expect(screen.queryByText("Creating…")).not.toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Connection error: Could not create the scheduled transfer.");
  });

  it("groups session expiry from different API reads into a single notification", () => {
    render(<ToastProvider><Reports /></ToastProvider>);
    fireEvent.click(screen.getByText("Expired session"));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired.");
  });

  it("catches uncaught frontend exceptions and promise rejections without leaking details", () => {
    render(<ToastProvider><Reports /></ToastProvider>);
    const error = new Error("private runtime details");
    act(() => window.dispatchEvent(new ErrorEvent("error", { error })));
    const rejection = new Event("unhandledrejection");
    Object.defineProperty(rejection, "reason", { value: error });
    act(() => window.dispatchEvent(rejection));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Frontend error: Could not display this page.");
    expect(screen.queryByText(/private runtime details/)).not.toBeInTheDocument();
  });

  it("reports shared SWR failures once even with multiple readers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ error: "accounts_failed" }, { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ToastProvider><DataProvider><AccountsPreloader /><AccountsList /></DataProvider></ToastProvider>);
    expect(await screen.findByText("Backend error: Could not load accounts. Please try again.")).toHaveAttribute("role", "alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Could not load accounts.")).toBeInTheDocument();
  });

  it("reports theme restoration failures from before hydration once, even when money restoration fails too", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("private storage details"); });
    const html = renderToStaticMarkup(RootLayout({ children: null }));
    const script = new DOMParser().parseFromString(html, "text/html").querySelector("script")!.textContent!;
    new Function("document", "localStorage", script)(document, localStorage);
    expect(document.documentElement.dataset.themeStorageUnavailable).toBe("true");
    render(<ToastProvider><MoneyVisibilityProvider><MoneyVisibilityToggle /></MoneyVisibilityProvider></ToastProvider>);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Frontend error: Could not restore saved preferences. Default settings are being used.");
    expect(document.documentElement.dataset.themeStorageUnavailable).toBeUndefined();
    expect(screen.queryByText(/private storage details/)).not.toBeInTheDocument();
  });
});
