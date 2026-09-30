"use client";

import { useMoneyVisibility } from "@/components/providers/money-visibility-provider";
import styles from "./money-visibility-toggle.module.css";

export function MoneyVisibilityToggle() {
  const { isMoneyHidden, toggleMoneyVisibility } = useMoneyVisibility();
  const label = isMoneyHidden ? "Show money values" : "Hide money values";

  return (
    <button
      className={styles.toggle}
      type="button"
      onClick={toggleMoneyVisibility}
      aria-label={label}
      aria-pressed={isMoneyHidden}
      title={label}
    >
      {isMoneyHidden ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.1 3.2" />
      <path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2" />
      <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
    </svg>
  );
}
