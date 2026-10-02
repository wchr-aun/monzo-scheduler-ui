import {act, fireEvent, render, screen, within} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createPreviewTransfersPage} from "@/lib/scheduled-transfers/preview";
import {PaymentFlow} from "./payment-flow";

const observers = new Map<Element, IntersectionObserverCallback>();
let reducedMotion = false;

function renderFlow() {
  const transfer = createPreviewTransfersPage().scheduledTransfers[1];
  render(<PaymentFlow transfer={{...transfer, amount: 227_300}} />);
  return screen.getByRole("figure", {name: "Example of a pot withdrawal followed by a payment scheduled in Monzo"});
}

function enter(element: Element) {
  act(() => {
    observers.get(element)?.([{isIntersecting: true} as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

function advance(milliseconds = 3_000) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

describe("PaymentFlow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    observers.clear();
    reducedMotion = false;
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    vi.stubGlobal("IntersectionObserver", class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(element: Element) { observers.set(element, this.callback); }
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reveals the flow once and plays all stages without waiting for individual steps to enter view", () => {
    const flow = renderFlow();
    advance(10_000);
    expect(screen.getByRole("status")).toHaveTextContent("Step 1 of 3");
    expect(within(flow).getByText("Executing soon")).toBeVisible();
    expect(within(flow).getByText("pending")).toBeVisible();
    expect(within(flow).queryByText(/withdrawn/)).not.toBeInTheDocument();
    expect(within(flow).queryByText("Landlord")).not.toBeInTheDocument();

    enter(flow);
    expect(screen.getByText("Next step in 2s")).toBeInTheDocument();
    advance(1_000);
    expect(screen.getByText("Next step in 1s")).toBeInTheDocument();
    advance(2_000);
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3");
    expect(screen.getByText("Next step in 3s")).toBeInTheDocument();
    expect(within(flow).getByText("completed")).toBeVisible();
    expect(within(flow).getByText(/withdrawn/)).toBeVisible();
    expect(within(flow).queryByText("Landlord")).not.toBeInTheDocument();

    advance();
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 3");
    expect(within(flow).getByText("Landlord")).toBeVisible();
    expect([...observers.keys()]).toEqual([flow]);
    expect(screen.queryByText(/Next step in/)).not.toBeInTheDocument();
    enter(flow);
    advance(10_000);
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 3");
  });

  it("replays from each selected step and gives a repeated selection its full duration", () => {
    const flow = renderFlow();
    enter(flow);
    fireEvent.click(screen.getByRole("button", {name: "Replay step 3: Rent sent to landlord"}));
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 3");

    const first = screen.getByRole("button", {name: "Replay step 1: Withdrawal due soon"});
    fireEvent.click(first);
    advance(2_000);
    fireEvent.click(first);
    advance(500);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(within(flow).getByText("pending")).toBeVisible();
    expect(within(flow).queryByText("Landlord")).not.toBeInTheDocument();
    advance(2_500);
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3");

    fireEvent.click(screen.getByRole("button", {name: "Replay step 2: Transfer completed"}));
    advance();
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 3");
  });

  it("shows the complete flow on entry with reduced motion and allows manual steps", () => {
    reducedMotion = true;
    const flow = renderFlow();
    enter(flow);
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 3");
    fireEvent.click(screen.getByRole("button", {name: "Replay step 1: Withdrawal due soon"}));
    advance(10_000);
    expect(screen.getByRole("status")).toHaveTextContent("Step 1 of 3");
    expect(screen.queryByText(/Next step in/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: "Replay step 2: Transfer completed"}));
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3");
  });
});
