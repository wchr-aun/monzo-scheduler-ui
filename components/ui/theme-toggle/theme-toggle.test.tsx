import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import type { ReactElement } from "react";
import { fireEvent, render as testingRender, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([true, false])("overrides the system preference when dark mode is %s", (isDark) => {
    delete document.documentElement.dataset.theme;
    const matchMedia = vi.fn().mockReturnValue({ matches: isDark });
    vi.stubGlobal("matchMedia", matchMedia);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));

    const expectedTheme = isDark ? "light" : "dark";
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    expect(document.documentElement).toHaveAttribute("data-theme", expectedTheme);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(expectedTheme);
  });

  it("switches the document theme and remembers the choice", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("reports storage failure while still applying the theme and suppressing duplicate reports", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("private storage details"); });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("alert")).toHaveTextContent("Frontend error: Could not save your preferences. Your changes still apply for this visit.");
    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByText(/private storage details/)).not.toBeInTheDocument();
  });
});

function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ToastProvider });
}
