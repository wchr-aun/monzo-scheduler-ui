import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { ToastProvider, useToast } from "./toast-provider";

function Actions() {
  const toast = useToast();
  const id = useRef("");
  return <>
    <button onClick={() => { id.current = toast.show({ tone: "progress", message: "Creating…" }); }}>Start</button>
    <button onClick={() => toast.update(id.current, { tone: "success", message: "Created." })}>Finish</button>
    <button onClick={() => toast.show({ tone: "error", message: "Failed." })}>Fail</button>
  </>;
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("global toasts", () => {
  it("updates a single notification and keeps it through page changes", () => {
    const view = render(<ToastProvider><Actions /><div>First page</div></ToastProvider>);
    fireEvent.click(screen.getByText("Start"));
    expect(screen.getByRole("status")).toHaveTextContent("Creating…");
    fireEvent.click(screen.getByText("Finish"));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    view.rerender(<ToastProvider><div>Second page</div></ToastProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("Created.");
  });

  it("keeps concurrent actions separate and does not resurrect dismissed progress", () => {
    render(<ToastProvider><Actions /></ToastProvider>);
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Start"));
    expect(screen.getAllByRole("status")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss notification: Creating…" })[1]);
    fireEvent.click(screen.getByText("Finish"));
    expect(screen.queryByText("Created.")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("auto-dismisses success after five seconds and pauses on hover and focus", () => {
    vi.useFakeTimers();
    render(<ToastProvider><Actions /></ToastProvider>);
    fireEvent.click(screen.getByText("Start"));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Finish"));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    const close = screen.getByRole("button", { name: "Dismiss notification: Created." });
    fireEvent.mouseEnter(close.parentElement!);
    act(() => vi.advanceTimersByTime(6_000));
    expect(screen.getByText("Created.")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "3 seconds remaining, paused");
    fireEvent.focus(close);
    fireEvent.mouseLeave(close.parentElement!);
    act(() => vi.advanceTimersByTime(6_000));
    expect(screen.getByText("Created.")).toBeInTheDocument();
    fireEvent.blur(close);
    act(() => vi.advanceTimersByTime(2_999));
    expect(screen.getByText("Created.")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Created.")).not.toBeInTheDocument();
  });

  it("keeps progress and errors until dismissed, including with Escape", () => {
    vi.useFakeTimers();
    render(<ToastProvider><Actions /></ToastProvider>);
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Fail"));
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole("status")).toHaveTextContent("Creating…");
    expect(screen.getByRole("alert")).toHaveTextContent("Failed.");
    fireEvent.keyDown(screen.getByRole("button", { name: "Dismiss notification: Failed." }), { key: "Escape" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses horizontal swipes in either direction, while short and vertical gestures recover", () => {
    class TestPointerEvent extends MouseEvent {
      pointerId = 1;
      isPrimary = true;
    }
    vi.stubGlobal("PointerEvent", TestPointerEvent);
    render(<ToastProvider><Actions /></ToastProvider>);
    fireEvent.click(screen.getByText("Start"));
    const notification = screen.getByRole("status").parentElement!;
    notification.setPointerCapture = vi.fn();
    const swipe = (x: number, y = 0, cancelled = false) => {
      fireEvent.pointerDown(notification, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.pointerMove(notification, { clientX: 100 + x, clientY: 100 + y });
      fireEvent(notification, new TestPointerEvent(cancelled ? "pointercancel" : "pointerup", { bubbles: true, clientX: 100 + x, clientY: 100 + y }));
    };
    swipe(20);
    expect(screen.getByRole("status")).toBeInTheDocument();
    swipe(100, 0, true);
    expect(screen.getByRole("status")).toBeInTheDocument();
    swipe(100, 150);
    expect(screen.getByRole("status")).toBeInTheDocument();
    swipe(-100);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Start"));
    const next = screen.getByRole("status").parentElement!;
    next.setPointerCapture = vi.fn();
    fireEvent.pointerDown(next, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(next, { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(next, { clientX: 200, clientY: 100 });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("pauses auto-dismiss while dragging and resumes after a short swipe", () => {
    vi.useFakeTimers();
    class TestPointerEvent extends MouseEvent {
      pointerId = 1;
      isPrimary = true;
    }
    vi.stubGlobal("PointerEvent", TestPointerEvent);
    render(<ToastProvider><Actions /></ToastProvider>);
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Finish"));
    act(() => vi.advanceTimersByTime(2_000));
    const notification = screen.getByRole("status").parentElement!;
    notification.setPointerCapture = vi.fn();
    fireEvent.pointerDown(notification, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(notification, { clientX: 120, clientY: 100 });
    act(() => vi.advanceTimersByTime(6_000));
    expect(screen.getByText("Created.")).toBeInTheDocument();
    fireEvent.pointerUp(notification, { clientX: 120, clientY: 100 });
    act(() => vi.advanceTimersByTime(2_999));
    expect(screen.getByText("Created.")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Created.")).not.toBeInTheDocument();
  });
});
