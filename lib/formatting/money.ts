export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${amount} ${currency}`;
  }
}
