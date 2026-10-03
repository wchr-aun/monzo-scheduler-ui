import { describe, expect, it } from "vitest";
import { getBalanceKey } from "@/lib/accounts/keys";
import { getPotsKey } from "@/lib/pots/keys";
import { getScheduledTransfersKey, getScheduledTransfersPageKey } from "@/lib/scheduled-transfers/keys";
import { createDemoClient } from "./client";
import { DEMO_ACCOUNT_ID, DEMO_JOINT_ACCOUNT_ID, demoAccounts, demoJointPots } from "./fixtures";

describe("demo account data", () => {
  it("returns each account's balance and pots and rejects another account's pot", async () => {
    const client = createDemoClient();
    for (const account of demoAccounts) {
      const pots = await client.fetchPots(getPotsKey(account.id));
      const balance = await client.fetchBalance(getBalanceKey(account.id));
      expect(balance).toEqual(account.balance_details);
      expect(balance.total_balance).toBe(balance.balance + pots.reduce((total, pot) => total + pot.balance, 0));
    }
    const jointPot = demoJointPots[0];
    const wrongAccountKey = getScheduledTransfersKey(DEMO_ACCOUNT_ID, jointPot.id);
    await expect(client.fetchScheduledTransfers(wrongAccountKey)).rejects.toThrow("Demo pot not found.");
    await expect(client.request(wrongAccountKey, { method: "POST" }, "create the scheduled transfer")).rejects.toThrow("Demo pot not found.");
    await expect(client.fetchBalance(getBalanceKey("acc_missing"))).rejects.toThrow("Demo account not found.");
  });

  it("cancels joint schedules without changing the main account or another demo session", async () => {
    const client = createDemoClient();
    const otherSession = createDemoClient();
    const jointPot = demoJointPots[0];
    const key = getScheduledTransfersPageKey(DEMO_JOINT_ACCOUNT_ID, jointPot.id, ["pending"], 0);
    const pending = await client.fetchScheduledTransfers(key);
    const transfer = pending.scheduledTransfers[0];
    const mainKey = getScheduledTransfersPageKey(DEMO_ACCOUNT_ID, "pot_demo_savings", ["pending"], 0);
    const mainBefore = await client.fetchScheduledTransfers(mainKey);
    await client.request(`${getScheduledTransfersKey(DEMO_JOINT_ACCOUNT_ID, jointPot.id)}/${transfer.setup_id}`, { method: "DELETE" }, "cancel the scheduled transfer");
    expect((await client.fetchScheduledTransfers(key)).total).toBe(pending.total - 1);
    expect(await client.fetchScheduledTransfers(mainKey)).toEqual(mainBefore);
    expect((await otherSession.fetchScheduledTransfers(key)).total).toBe(pending.total);
  });
});
