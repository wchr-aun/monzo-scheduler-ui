import type { Pot } from "./types";
import { getPots } from "./validation";

export async function fetchPots(url: string): Promise<Pot[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const pots = getPots(payload);

  if (!response.ok || !pots) {
    throw new Error("Pots response was invalid");
  }

  return pots;
}
