import type { Database } from "@/lib/supabase/database.types";

export type TransactionType = "income" | "expense" | "transfer";
export type AccountType = "cash" | "bank" | "credit" | "investment" | "other";
export type CategoryKind = "income" | "expense";
export type BudgetPeriodType = "monthly" | "yearly" | "custom";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type BudgetBook = Database["public"]["Tables"]["budget_books"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];

export interface AppData {
  profile: Profile | null;
  books: BudgetBook[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

export type AddTransactionInput = {
  type: TransactionType;
  amount: number;
  account_id: string;
  category_id?: string;
  transfer_account_id?: string;
  note?: string;
  transaction_date: string;
};

export type AddAccountInput = {
  name: string;
  type: AccountType;
  initial_balance: number;
};

export type AddCategoryInput = {
  name: string;
  kind: CategoryKind;
};

export type AddBudgetInput = {
  category_id: string;
  amount_limit: number;
  name: string;
  period_type: BudgetPeriodType;
  start_date: string;
};

export type ProfilePatch = {
  full_name?: string;
  default_currency?: string;
};