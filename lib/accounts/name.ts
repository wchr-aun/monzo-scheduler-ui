import type {Account} from "./types";

export function getAccountName(account: Account, userId?: string | null) {
  if (userId && account.description === userId) {
    return "Main Account";
  }

  if (account.description.toLowerCase().includes("joint account")) {
    return "Joint Account";
  }

  const name = account.description.split("_")[0].trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : account.description;
}
