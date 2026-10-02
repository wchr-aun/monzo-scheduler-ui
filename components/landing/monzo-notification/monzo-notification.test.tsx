import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {MonzoNotification} from "./monzo-notification";

describe("MonzoNotification", () => {
  it("shows one unread notification, opens on click, and can close and replay", () => {
    render(<MonzoNotification title="🎉 £50.00 deposited!" message="Your savings are on schedule." />);
    const trigger = screen.getByRole("button", {name: "Open Monzo notification"});
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toBeVisible();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("🎉 £50.00 deposited!")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).not.toBeVisible();
    expect(screen.getByText("Click Monzo to replay")).not.toBeVisible();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.getByRole("region", {name: "Monzo notification"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Close Monzo notification"})).toHaveFocus();
    expect(screen.getByText("🎉 £50.00 deposited!")).toBeVisible();
    expect(screen.getByText("Your savings are on schedule.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", {name: "Close Monzo notification"}));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(trigger).toBeVisible();
    expect(screen.getByText("Click Monzo to replay")).toBeVisible();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    expect(screen.getByText("🎉 £50.00 deposited!")).toBeVisible();
    fireEvent.keyDown(trigger, {key: "Escape"});
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
