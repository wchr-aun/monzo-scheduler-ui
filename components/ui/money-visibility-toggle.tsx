"use client";

import { useMoneyVisibility } from "@/components/providers/money-visibility-provider";
import { EyeIcon, EyeOffIcon } from "./visibility-icons";
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
