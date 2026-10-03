import type { Account } from "@/lib/accounts/types";
import type { Pot } from "@/lib/pots/types";

export const DEMO_ACCOUNT_ID = "acc_demo";
export const DEMO_JOINT_ACCOUNT_ID = "acc_demo_joint";
export const DEMO_USER_ID = "user_demo";

export const demoPots: Pot[] = [
  {
    id: "pot_demo_round_up",
    name: "Round-up Savings",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/orange.png",
    type: "default",
  },
  {
    id: "pot_demo_flexible_savings",
    name: "Flexible Savings",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/navy.png",
    type: "flexible_savings",
  },
  {
    id: "pot_demo_holiday",
    name: "Holiday Fund",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/lightbulb.jpg",
    type: "default",
  },
  {
    id: "pot_demo_rainy_day",
    name: "Rainy Day Fund",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/generic_blue.png",
    type: "default",
  },
  {
    id: "pot_demo_savings",
    name: "Savings",
    balance: 425000,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/savings.png",
    type: "instant_access",
  },
  {
    id: "pot_demo_fixed_savings",
    name: "Fixed Savings",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/generic_neon.png",
    type: "fixed_savings",
  },
  {
    id: "pot_demo_bills",
    name: "Household Bills",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/house.png",
    type: "default",
  },
  {
    id: "pot_demo_emergency_fund",
    name: "Emergency Fund",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/savings.png",
    type: "instant_access",
  },
  {
    id: "pot_demo_penny_challenge",
    name: "Penny Challenge",
    balance: 0,
    currency: "GBP",
    deleted: true,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/penny_savings_challenge.webp",
    type: "instant_access",
  },
  {
    id: "pot_demo_treats",
    name: "Treats",
    balance: 18500,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/generic_neon.png",
    type: "default",
  },
  {
    id: "pot_demo_savings_challenge",
    name: "Savings Challenge",
    balance: 82500,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/subscriptions/saving_challenge_2026/list_item_2026_coin@3x.webp",
    type: "instant_access",
  },
  {
    id: "pot_demo_hobbies",
    name: "Hobbies",
    balance: 0,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/tickets_v1.webp",
    type: "default",
  },
];

export const demoJointPots: Pot[] = [
  {
    id: "pot_demo_joint_bills",
    name: "Household Bills",
    balance: 125000,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/house.png",
    type: "default",
  },
  {
    id: "pot_demo_joint_holiday",
    name: "Holiday Fund",
    balance: 75000,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/tickets_v1.webp",
    type: "default",
  },
  {
    id: "pot_demo_joint_home",
    name: "Home Improvements",
    balance: 250000,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/savings.png",
    type: "instant_access",
  },
  {
    id: "pot_demo_joint_groceries",
    name: "Groceries",
    balance: 30000,
    currency: "GBP",
    deleted: false,
    cover_image_url: "https://public-images.monzo.com/pots/gallery_covers/orange.png",
    type: "default",
  },
];

export const demoPotsByAccount: Record<string, Pot[]> = {
  [DEMO_ACCOUNT_ID]: demoPots,
  [DEMO_JOINT_ACCOUNT_ID]: demoJointPots,
};

export const demoEmptyPotIds = new Set(["pot_demo_hobbies", "pot_demo_joint_groceries"]);

export const demoAccounts: Account[] = [
  {
    id: DEMO_ACCOUNT_ID,
    description: DEMO_USER_ID,
    balance_details: {
      balance: 184250,
      total_balance: 184250 + demoPots.reduce((total, pot) => total + pot.balance, 0),
      currency: "GBP",
    },
  },
  {
    id: DEMO_JOINT_ACCOUNT_ID,
    description: "Joint Account",
    balance_details: {
      balance: 235000,
      total_balance: 235000 + demoJointPots.reduce((total, pot) => total + pot.balance, 0),
      currency: "GBP",
    },
  },
];
