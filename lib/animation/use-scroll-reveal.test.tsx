import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollReveal } from "./use-scroll-reveal";

type Observer = {
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
};
const observers: Observer[] = [];
let pageHeight = 2000;
let reducedMotion = false;

function Reveal({ label }: { label: string }) {
  const { ref, entered, hidden } = useScrollReveal();
  return <div ref={ref}><output aria-label={label}>{hidden ? "Hidden" : entered ? "Revealed" : "Visible"}</output></div>;
}

function scrollTo(position: number) {
  vi.stubGlobal("scrollY", position);
  fireEvent.scroll(window);
}

function enter(index: number) {
  act(() => observers[index].callback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    observers[index] as unknown as IntersectionObserver,
  ));
}

describe("useScrollReveal", () => {
  beforeEach(() => {
    observers.length = 0;
    pageHeight = 2000;
    reducedMotion = false;
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("scrollY", 0);
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockImplementation(() => pageHeight);
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal("IntersectionObserver", class {
      disconnect = vi.fn();
      constructor(public callback: IntersectionObserverCallback) { observers.push(this); }
      observe() {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reveals all pending content near the bottom using one shared passive listener", () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    render(<><Reveal label="First" /><Reveal label="Last" /></>);
    expect(screen.getByLabelText("First")).toHaveTextContent("Hidden");
    expect(screen.getByLabelText("Last")).toHaveTextContent("Hidden");
    expect(addListener.mock.calls.filter(([event]) => event === "scroll")).toHaveLength(1);
    expect(addListener).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });

    scrollTo(1197.5);
    expect(screen.getByLabelText("Last")).toHaveTextContent("Hidden");
    scrollTo(1198.5);
    expect(screen.getByLabelText("First")).toHaveTextContent("Revealed");
    expect(screen.getByLabelText("Last")).toHaveTextContent("Revealed");
    for (const observer of observers) expect(observer.disconnect).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("keeps normal intersection reveals and does not hide content when scrolling back up", () => {
    render(<><Reveal label="First" /><Reveal label="Last" /></>);
    enter(0);
    expect(screen.getByLabelText("First")).toHaveTextContent("Revealed");
    expect(screen.getByLabelText("Last")).toHaveTextContent("Hidden");
    scrollTo(1200);
    scrollTo(0);
    expect(screen.getByLabelText("First")).toHaveTextContent("Revealed");
    expect(screen.getByLabelText("Last")).toHaveTextContent("Revealed");
  });

  it.each([
    { height: 2000, position: 1200, scenario: "starts at the bottom" },
    { height: 600, position: 0, scenario: "fits within the viewport" },
  ])("reveals immediately when the page $scenario", ({ height, position }) => {
    pageHeight = height;
    vi.stubGlobal("scrollY", position);
    render(<Reveal label="Content" />);
    expect(screen.getByLabelText("Content")).toHaveTextContent("Revealed");
  });

  it("reveals pending content when resizing reaches the bottom", () => {
    render(<Reveal label="Content" />);
    expect(screen.getByLabelText("Content")).toHaveTextContent("Hidden");
    vi.stubGlobal("innerHeight", 2000);
    fireEvent.resize(window);
    expect(screen.getByLabelText("Content")).toHaveTextContent("Revealed");
  });

  it("cleans up on unmount and waits normally on a new page", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const view = render(<Reveal label="Old page" />);
    view.unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
    scrollTo(1200);
    vi.stubGlobal("scrollY", 0);
    render(<Reveal label="New page" />);
    expect(screen.getByLabelText("New page")).toHaveTextContent("Hidden");
  });

  it("keeps content visible when reduced motion is preferred", () => {
    reducedMotion = true;
    render(<Reveal label="Content" />);
    expect(screen.getByLabelText("Content")).toHaveTextContent("Visible");
    scrollTo(1200);
    expect(screen.getByLabelText("Content")).toHaveTextContent("Revealed");
  });
});
