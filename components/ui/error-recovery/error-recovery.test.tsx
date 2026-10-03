import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import { ErrorRecovery } from "./error-recovery";

describe("page error recovery", () => {
  it.each([false, true])("provides a recovery action and a safe toast (server error: %s)", (server) => {
    const reset = vi.fn();
    const error = server ? Object.assign(new Error("private details"), { digest: "123" }) : new Error("private details");
    render(<ToastProvider><ErrorRecovery error={error} reset={reset} /></ToastProvider>);
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(server ? "Backend error:" : "Frontend error:");
    expect(screen.queryByText(/private details/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
