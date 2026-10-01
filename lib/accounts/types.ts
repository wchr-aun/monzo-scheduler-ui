export type Balance = {
  balance: number;
  total_balance: number;
  currency: string;
};

export type Account = {
  id: string;
  description: string;
  balance_details: Balance | null;
};
