import { request, readJson } from "@/lib/errors/request";
import { AppError } from "@/lib/errors/app-error";
import type { Account, Balance } from "./types";
import { getAccounts, isBalance } from "./validation";

export class AccessNotApprovedError extends AppError {
  constructor(message?: string) {
    super("backend", "load accounts", "monzo_approval_required", 403);
    this.message = message || "You have not yet allowed access to your data. Please allow access in the Monzo app.";
    this.name = "AccessNotApprovedError";
  }
}

export async function fetchAccounts(url: string): Promise<Account[]> {
  let response: Response;
  try {
    response = await request(url, { cache: "no-store" }, "load accounts");
  } catch (error) {
    if (error instanceof AppError && error.status === 403 && error.code === "monzo_approval_required") throw new AccessNotApprovedError();
    throw error;
  }
  const payload = await readJson(response, "load accounts");

  const accounts = getAccounts(payload);

  if (!accounts) {
    throw new AppError("backend", "load accounts", "invalid_accounts_response");
  }

  return accounts;
}

export async function fetchBalance(url: string): Promise<Balance> {
  const response = await request(url, { cache: "no-store" }, "load the balance");
  const payload = await readJson(response, "load the balance");

  if (!isBalance(payload)) {
    throw new AppError("backend", "load the balance", "invalid_balance_response");
  }

  return payload;
}
