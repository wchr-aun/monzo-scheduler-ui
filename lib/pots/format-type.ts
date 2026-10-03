export function formatPotType(type: string): string {
  const label = type.replaceAll("_", " ").trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}
