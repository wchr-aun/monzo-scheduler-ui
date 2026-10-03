import { request, readJson } from "@/lib/errors/request";
import { AppError } from "@/lib/errors/app-error";
import type { Pot } from "./types";
import { getPots } from "./validation";

export async function fetchPots(url: string): Promise<Pot[]> {
  const response = await request(url, { cache: "no-store" }, "load pots");
  const payload = await readJson(response, "load pots");
  const pots = getPots(payload);

  if (!pots) {
    throw new AppError("backend", "load pots", "invalid_pots_response");
  }

  return pots;
}
