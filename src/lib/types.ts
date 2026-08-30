import type { Database } from "@/lib/supabase/database.types";
import type { ExchangeRates } from "@/lib/fx";

export type TransactionType = "income" | "expense" | "transfer";
export type AccountType =
  | "payment"
  | "savings"
  | "credit_card"
  | "investment"
  | "reserve"
  | "liability"
  | "business"
  | "cash";
export type CategoryKind = "income" | "expense";
export type BudgetPeriodType = "monthly" | "yearly" | "custom";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type BudgetBook = Database["public"]["Tables"]["budget_books"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];

export interface Tags {
  tags: Tag[];
}
export type Recipient = Database["public"]["Tables"]["recipients"]["Row"];

export interface RecipientWithRelations
  extends Omit<Recipient, "account_id" | "category_id"> {
  account_id: string | null;
  category_id: string | null;
  account:
    | {
        id: string;
        name: string;
        currency: string;
      }
    | null
    | undefined;
  category:
    | {
        id: string;
        name: string;
        icon: string | null;
        color: string | null;
      }
    | null
    | undefined;
}

export interface AppData {
  profile: Profile | null;
  books: BudgetBook[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recipients: RecipientWithRelations[];
}

export type AddTransactionInput = {
  type: TransactionType;
  amount: number;
  account_id: string;
  category_id?: string;
  transfer_account_id?: string;
  recipient_id?: string;
  note?: string;
  transaction_date: string;
};

export type TransactionPatch = {
  type?: TransactionType;
  amount?: number;
  account_id?: string;
  category_id?: string | null;
  transfer_account_id?: string | null;
  recipient_id?: string | null;
  note?: string | null;
  transaction_date?: string;
};

export type AddAccountInput = {
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance?: number;
  currency?: string;
  color?: string | null;
  icon?: string | null;
  note?: string | null;
};

export type AccountPatch = {
  name?: string;
  type?: AccountType;
  currency?: string;
  color?: string | null;
  icon?: string | null;
  note?: string | null;
  initial_balance?: number;
  current_balance?: number;
  archived_at?: string | null;
};

export type AddCategoryInput = {
  name: string;
  kind?: CategoryKind;
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
};

export type CategoryPatch = {
  name?: string;
  icon?: string | null;
  color?: string | null;
};

export type AddBudgetInput = {
  category_id: string;
  amount_limit: number;
  name: string;
  period_type: BudgetPeriodType;
  start_date: string;
};

export type AddRecipientInput = {
  name: string;
  account_id?: string | null;
  category_id?: string | null;
  notes?: string | null;
};

export type RecipientPatch = {
  name?: string;
  account_id?: string | null;
  category_id?: string | null;
  notes?: string | null;
};

export type AddTagInput = {
  name: string;
  color?: string | null;
};

export type TagPatch = {
  name?: string;
  color?: string | null;
};

export type ProfilePatch = {
  full_name?: string;
  default_currency?: string;
  exchange_rates?: ExchangeRates | null;
};
