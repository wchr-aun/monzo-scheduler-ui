import type { ConsoleClient } from "@/lib/console/types";
import { AppError } from "@/lib/errors/app-error";
import { scheduledTransferStatuses, type ScheduledTransfer } from "@/lib/scheduled-transfers/types";
import { getScheduledTransfersKey } from "@/lib/scheduled-transfers/keys";
import { demoAccounts, demoPotsByAccount, demoEmptyPotIds } from "./fixtures";

// Each mounted demo owns its store. No network fallback or browser persistence.
export function createDemoClient(now = new Date()): ConsoleClient {
  const transfers = new Map<string, ScheduledTransfer[]>();
  let nextId = 0;
  for (const account of demoAccounts) {
    for (const pot of demoPotsByAccount[account.id].filter((pot) => !pot.deleted)) {
      transfers.set(getScheduledTransfersKey(account.id, pot.id), demoEmptyPotIds.has(pot.id) ? [] : Array.from({ length: 80 }, (_, index) => {
        const status = scheduledTransferStatuses[index % scheduledTransferStatuses.length];
        const scheduledFor = new Date(now.getTime() + (status === "pending" ? index + 1 : -index - 1) * 86_400_000).toISOString();
        return {
          setup_id: `demo_setup_${pot.id}_${index}`,
          transfer_id: `demo_transfer_${pot.id}_${index}`,
          status,
          created_at: new Date(now.getTime() - (index + 30) * 86_400_000).toISOString(),
          executed_at: status === "completed" || status === "failed" ? scheduledFor : null,
          scheduled_for: scheduledFor,
          interval: ["daily", "weekly", "monthly"][index % 3],
          type: index % 3 === 0 ? "withdraw" : "deposit",
          amount: (index + 1) * 100,
        };
      }));
    }
  }

  function potForUrl(url: string) {
    const parsed = new URL(url, "https://demo.invalid");
    const match = parsed.pathname.match(/^\/api\/accounts\/([^/]+)\/pots\/([^/]+)\/scheduled-transfers(?:\/([^/]+))?$/);
    if (!match) throw new Error("Demo route not found.");
    const accountId = decodeURIComponent(match[1]);
    if (!demoAccounts.some((account) => account.id === accountId)) throw new Error("Demo account not found.");
    const potId = decodeURIComponent(match[2]);
    const transfersKey = getScheduledTransfersKey(accountId, potId);
    if (!transfers.has(transfersKey)) throw new Error("Demo pot not found.");
    return { parsed, accountId, potId, transfersKey, setupId: match[3] ? decodeURIComponent(match[3]) : undefined };
  }

  function accountForUrl(url: string, resource: "balance" | "pots") {
    const parsed = new URL(url, "https://demo.invalid");
    const match = parsed.pathname.match(/^\/api\/accounts\/([^/]+)\/(balance|pots)$/);
    const account = match && match[2] === resource
      ? demoAccounts.find((candidate) => candidate.id === decodeURIComponent(match[1]))
      : undefined;
    if (!account) throw new Error("Demo account not found.");
    return account;
  }

  return {
    basePath: "/demo",
    fetchAccounts: async () => structuredClone(demoAccounts),
    fetchBalance: async (url) => {
      const account = accountForUrl(url, "balance");
      return structuredClone(account.balance_details!);
    },
    fetchPots: async (url) => {
      const account = accountForUrl(url, "pots");
      return structuredClone(demoPotsByAccount[account.id]);
    },
    fetchScheduledTransfers: async (url) => {
      const { parsed, transfersKey } = potForUrl(url);
      const statuses = parsed.searchParams.get("status")?.split(",") ?? [...scheduledTransferStatuses];
      const filtered = transfers.get(transfersKey)!.filter((transfer) => statuses.includes(transfer.status));
      const limit = 50;
      const offset = Math.max(0, Number(parsed.searchParams.get("offset")) || 0);
      return { scheduledTransfers: structuredClone(filtered.slice(offset, offset + limit)), total: filtered.length, limit, offset };
    },
    request: async (url, init, operation) => {
      const { accountId, potId, transfersKey, setupId } = potForUrl(url);
      const entries = transfers.get(transfersKey)!;
      if (init.method === "DELETE" && setupId) {
        if (!entries.some((transfer) => transfer.setup_id === setupId && transfer.status === "pending")) {
          throw new AppError("backend", operation, "transfer_not_found", 404);
        }
        entries.forEach((transfer) => {
          if (transfer.setup_id === setupId && transfer.status === "pending") transfer.status = "cancelled";
        });
      } else if (init.method === "POST" && !setupId && typeof init.body === "string") {
        const payload: unknown = JSON.parse(init.body);
        if (typeof payload !== "object" || payload === null ||
          !("datetime" in payload) || typeof payload.datetime !== "string" || !Number.isFinite(Date.parse(payload.datetime)) || Date.parse(payload.datetime) < Date.now() ||
          !("amount" in payload) || typeof payload.amount !== "number" || !Number.isSafeInteger(payload.amount) || payload.amount <= 0 ||
          !("interval" in payload) || typeof payload.interval !== "string" || !["daily", "weekly", "monthly"].includes(payload.interval) ||
          !("type" in payload) || typeof payload.type !== "string" || !["deposit", "withdraw"].includes(payload.type) ||
          !("account_id" in payload) || payload.account_id !== accountId || !("pot_id" in payload) || payload.pot_id !== potId) {
          throw new AppError("backend", operation, "invalid_transfer", 400);
        }
        const id = ++nextId;
        entries.unshift({
          setup_id: `demo_created_setup_${id}`, transfer_id: `demo_created_transfer_${id}`,
          status: "pending", created_at: new Date().toISOString(), executed_at: null,
          scheduled_for: payload.datetime, interval: payload.interval, type: payload.type, amount: payload.amount,
        });
      } else {
        throw new AppError("backend", operation, "unsupported_demo_request", 400);
      }
      return Response.json({ success: true });
    },
  };
}
