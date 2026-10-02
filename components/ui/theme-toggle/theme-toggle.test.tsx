import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.clear();
  });

  afterEach(() => {
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
});
