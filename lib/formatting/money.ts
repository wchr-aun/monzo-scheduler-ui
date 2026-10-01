export function formatMoney(amount: number, currency: string) {
  return formatMoneyParts(amount, currency).map((part) => part.value).join("");
}

export function formatMoneyParts(amount: number, currency: string): Intl.NumberFormatPart[] {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).formatToParts(amount / 100);
  } catch {
    return [{ type: "literal", value: `${amount} ${currency}` }];
  }
}
