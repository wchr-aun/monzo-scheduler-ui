import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {InterestCalculation} from "./interest-calculation";

describe("InterestCalculation", () => {
  it("reveals the formula on hover and dismisses it with Escape", () => {
    render(<InterestCalculation />);
    const button = screen.getByRole("button", {name: "£2.87 before tax"});
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(button);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("£2,273 × ((1 + 0.0275)17/365 − 1) ≈ £2.87");
    expect(button).toHaveAttribute("aria-describedby", tooltip.id);
    fireEvent.keyDown(document, {key: "Escape"});
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("supports keyboard focus and dismisses on blur", () => {
    render(<InterestCalculation />);
    const button = screen.getByRole("button", {name: "£2.87 before tax"});
    fireEvent.focus(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on tap and closes when tapping outside", () => {
    render(<InterestCalculation />);
    fireEvent.click(screen.getByRole("button", {name: "£2.87 before tax"}));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
