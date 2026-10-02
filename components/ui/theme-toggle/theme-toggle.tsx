"use client";

import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import {MoonIcon, SunIcon} from "@/components/ui/icons/theme-icons";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = isDark ? "light" : "dark";

    root.dataset.theme = nextTheme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The active theme still applies when browser storage is unavailable.
    }
  }

  return (
    <button
      className={styles.toggle}
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <MoonIcon className={styles.moon} />
      <SunIcon className={styles.sun} />
    </button>
  );
}
