"use client";

import {useMoneyVisibility} from "@/components/providers/money-visibility-provider";
import {formatMoney} from "@/lib/formatting/money";
import {MONEY_MASK} from "@/lib/money/constants";

type MoneyProps = {
  amount: number;
  currency: string;
};

export function Money({ amount, currency }: MoneyProps) {
  const { isMoneyHidden } = useMoneyVisibility();

  return isMoneyHidden ? MONEY_MASK : formatMoney(amount, currency);
}
