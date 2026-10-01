"use client";

import {useMoneyVisibility} from "@/components/providers/money-visibility-provider";
import {formatMoneyParts} from "@/lib/formatting/money";
import {MONEY_MASK} from "@/lib/money/constants";
import {useEffect, useState} from "react";
import {EyeIcon, EyeOffIcon} from "./visibility-icons";
import styles from "./money.module.css";

type MoneyProps = {
  amount: number;
  currency: string;
  label?: string;
};

export function Money({ amount, currency, label = "money value" }: MoneyProps) {
  const { isMoneyHidden } = useMoneyVisibility();
  const [isLocallyRevealed, setIsLocallyRevealed] = useState(false);

  useEffect(() => {
    if (!isMoneyHidden) {
      setIsLocallyRevealed(false);
    }
  }, [isMoneyHidden]);

  const isValueHidden = isMoneyHidden && !isLocallyRevealed;
  const buttonLabel = `${isLocallyRevealed ? "Hide" : "Reveal"} ${label}`;

  return (
    <span className={styles.money}>
      <span>
        {isValueHidden ? MONEY_MASK : formatMoneyParts(amount, currency).map((part, index) => (
          <span
            className={part.type === "decimal" || part.type === "fraction" ? styles.decimals : undefined}
            key={index}
          >
            {part.value}
          </span>
        ))}
      </span>
      {isMoneyHidden ? (
        <button
          className={styles.toggle}
          type="button"
          aria-label={buttonLabel}
          title={buttonLabel}
          onClick={() => setIsLocallyRevealed((revealed) => !revealed)}
        >
          {isLocallyRevealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      ) : null}
    </span>
  );
}
