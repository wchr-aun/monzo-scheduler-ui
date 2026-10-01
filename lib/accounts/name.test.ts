import {describe, expect, it} from "vitest";
import {getAccountName} from "./name";

function account(description: string) {
  return { id: "acc_123", description, balance_details: null };
}

describe("getAccountName", () => {
  it("preserves the main account name when the description matches the user ID", () => {
    expect(getAccountName(account("user_123"), "user_123")).toBe("Main Account");
  });

  it("uses Joint account when it appears anywhere in the description", () => {
    expect(getAccountName(account("Monzo Joint account_user_123"))).toBe("Joint Account");
  });

  it.each([
    ["personal_account_123", "Personal"],
    ["business", "Business"],
    ["Current Account", "Current Account"],
    ["", ""],
    ["_account_123", "_account_123"],
  ])("formats description %s as %s", (description, name) => {
    expect(getAccountName(account(description))).toBe(name);
  });
});
