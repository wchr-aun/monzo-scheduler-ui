import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountName } from "@/lib/accounts/name";
import { getAccounts } from "@/lib/accounts/validation";
import { fetchAuthenticatedBackend } from "@/lib/auth/backend-fetch.server";
import { getUserId } from "@/lib/auth/session.server";
import { getPots } from "@/lib/pots/validation";

export async function requireConsoleSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.SESSION_COOKIE_NAME ?? "session")?.value;

  if (!token) redirect("/console");

  return token;
}

async function fetchMetadataPayload(path: string, token: string, accountId?: string): Promise<unknown> {
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) return null;

  try {
    const url = new URL(`${baseUrl}${path}`);
    if (accountId) url.searchParams.set("current_account_id", accountId);
    const response = await fetchAuthenticatedBackend(url, token, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function getConsoleAccountName(accountId: string) {
  const token = await requireConsoleSession();
  const accounts = getAccounts(await fetchMetadataPayload("/accounts-with-balances", token));
  const account = accounts?.find((candidate) => candidate.id === accountId);
  return account ? getAccountName(account, getUserId(token)) : "Account";
}

export async function getConsolePotName(accountId: string, potId: string) {
  const token = await requireConsoleSession();
  const payload = await fetchMetadataPayload("/pots", token, accountId);
  const pots = getPots(Array.isArray(payload) ? { pots: payload } : payload);
  const pot = pots?.find((candidate) => candidate.id === potId);
  return pot ? pot.name || "Unnamed pot" : "Pot";
}
