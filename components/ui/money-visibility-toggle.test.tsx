import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MoneyVisibilityProvider } from "@/components/providers/money-visibility-provider";
import {
  MONEY_MASK,
  MONEY_VISIBILITY_STORAGE_KEY,
} from "@/lib/money/constants";
import { Money } from "./money";
import { MoneyVisibilityToggle } from "./money-visibility-toggle";

describe("MoneyVisibilityToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("masks and reveals every money value", () => {
    render(
      <MoneyVisibilityProvider>
        <MoneyVisibilityToggle />
        <span>
          <Money amount={12_345} currency="GBP" />
        </span>
        <span>
          <Money amount={5_000} currency="GBP" />
        </span>
      </MoneyVisibilityProvider>,
    );

    const hideButton = screen.getByRole("button", { name: "Hide money values" });
    expect(hideButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("£123.45")).toBeInTheDocument();
    expect(screen.getByText("£50.00")).toBeInTheDocument();

    fireEvent.click(hideButton);

    expect(screen.queryByText("£123.45")).not.toBeInTheDocument();
    expect(screen.queryByText("£50.00")).not.toBeInTheDocument();
    expect(screen.getAllByText(MONEY_MASK)).toHaveLength(2);

    const showButton = screen.getByRole("button", { name: "Show money values" });
    expect(showButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(showButton);

    expect(screen.getByText("£123.45")).toBeInTheDocument();
    expect(screen.getByText("£50.00")).toBeInTheDocument();
    expect(localStorage.getItem(MONEY_VISIBILITY_STORAGE_KEY)).toBe("false");
  });

  it("restores the saved visibility after remounting", () => {
    const firstRender = render(
      <MoneyVisibilityProvider>
        <MoneyVisibilityToggle />
        <span>
          <Money amount={12_345} currency="GBP" />
        </span>
      </MoneyVisibilityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide money values" }));
    expect(localStorage.getItem(MONEY_VISIBILITY_STORAGE_KEY)).toBe("true");
    firstRender.unmount();

    render(
      <MoneyVisibilityProvider>
        <MoneyVisibilityToggle />
        <span>
          <Money amount={12_345} currency="GBP" />
        </span>
      </MoneyVisibilityProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Show money values" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(MONEY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("£123.45")).not.toBeInTheDocument();
  });

  it("reveals only the selected money value", () => {
    render(
      <MoneyVisibilityProvider>
        <MoneyVisibilityToggle />
        <Money amount={12_345} currency="GBP" />
        <Money amount={5_000} currency="GBP" />
      </MoneyVisibilityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide money values" }));
    const revealButtons = screen.getAllByRole("button", {
      name: "Reveal money value",
    });

    fireEvent.click(revealButtons[0]);

    expect(screen.getByText("£123.45")).toBeInTheDocument();
    expect(screen.queryByText("£50.00")).not.toBeInTheDocument();
    expect(screen.getAllByText(MONEY_MASK)).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Hide money value" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show money values" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide money values" }));

    expect(screen.getAllByText(MONEY_MASK)).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Hide money value" }),
    ).not.toBeInTheDocument();
  });

  it("still toggles when browser storage is unavailable", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

    render(
      <MoneyVisibilityProvider>
        <MoneyVisibilityToggle />
        <span>
          <Money amount={12_345} currency="GBP" />
        </span>
      </MoneyVisibilityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide money values" }));

    expect(
      screen.getByRole("button", { name: "Show money values" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(MONEY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("£123.45")).not.toBeInTheDocument();

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
