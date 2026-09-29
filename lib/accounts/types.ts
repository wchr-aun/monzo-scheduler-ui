export type Balance = {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
};

export type Account = {
  id: string;
  description: string;
  created: string;
  balance_details: Balance | null;
};
