"use client";

import * as React from "react";
import { RefreshCw, LogOut, TriangleAlert } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { normalizeRates } from "@/lib/fx";
import type { Database } from "@/lib/supabase/database.types";
import { useAuth } from "@/lib/auth";
import { ShellLoading } from "@/components/shell-loading";
import { Button } from "@/components/ui/button";
import type {
  Account,
  AccountPatch,
  AddAccountInput,
  AddBudgetInput,
  AddCategoryInput,
  AddRecipientInput,
  AddTagInput,
  AddTransactionInput,
  Budget,
  BudgetBook,
  Category,
  CategoryPatch,
  Profile,
  ProfilePatch,
  RecipientPatch,
  RecipientWithRelations,
  Tag,
  TagPatch,
  Transaction,
  TransactionPatch,
} from "@/lib/types";

interface DataContextValue {
  profile: Profile | null;
  books: BudgetBook[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recipients: RecipientWithRelations[];
  tags: Tag[];
  activeBookId: string | null;
  activeBook: BudgetBook | null;
  currency: string;
  exchangeRates: import("@/lib/fx").ExchangeRates;
  setActiveBook: (bookId: string) => void;
  createBudgetBook: (name: string) => Promise<BudgetBook | null>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  addTransaction: (input: AddTransactionInput) => Promise<void>;
  updateTransaction: (transactionId: string, patch: TransactionPatch) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addAccount: (input: AddAccountInput) => Promise<void>;
  updateAccount: (accountId: string, patch: AccountPatch) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  addCategory: (input: AddCategoryInput) => Promise<void>;
  updateCategory: (categoryId: string, patch: CategoryPatch) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addBudget: (input: AddBudgetInput) => Promise<void>;
  addRecipient: (input: AddRecipientInput) => Promise<void>;
  updateRecipient: (recipientId: string, patch: RecipientPatch) => Promise<void>;
  deleteRecipient: (recipientId: string) => Promise<void>;
  addTag: (input: AddTagInput) => Promise<void>;
  updateTag: (tagId: string, patch: TagPatch) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
}

const DataContext = React.createContext<DataContextValue | null>(null);
const orderCreated = { ascending: true } as const;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfileState] = React.useState<Profile | null>(null);
  const [books, setBooks] = React.useState<BudgetBook[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [recipients, setRecipients] = React.useState<RecipientWithRelations[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [activeBookId, setActiveBookId] = React.useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const refreshAccounts = React.useCallback(async () => {
    const { data } = await supabase.from("accounts").select("*").order("created_at", orderCreated);
    if (data) setAccounts(data);
  }, []);

  const refreshCategories = React.useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", orderCreated);
    if (data) setCategories(data);
  }, []);

  const refreshTransactions = React.useCallback(async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false });
    if (data) setTransactions(data);
  }, []);

  const refreshBudgets = React.useCallback(async () => {
    const { data } = await supabase.from("budgets").select("*").order("created_at", orderCreated);
    if (data) setBudgets(data);
  }, []);

  const refreshRecipients = React.useCallback(async () => {
    const { data } = await supabase
      .from("recipients")
      .select(
        "*, account:accounts(id, name, currency), category:categories(id, name, icon, color)"
      )
      .order("created_at", orderCreated);
    if (data) setRecipients(data);
  }, []);

  const refreshTags = React.useCallback(async () => {
    const { data } = await supabase.from("tags").select("*").order("created_at", orderCreated);
    if (data) setTags(data);
  }, []);

  const loadAll = React.useCallback(async () => {
    if (!userId) return;
    await Promise.resolve();
    setLoadError(null);
    setProfileState(null);
    setBooks([]);
    setAccounts([]);
    setCategories([]);
    setTransactions([]);
    setBudgets([]);
    setRecipients([]);
    setTags([]);
    setActiveBookId(null);
    setHasLoaded(false);

    const [p, b, a, c, t, bg, r, tg] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("budget_books").select("*").order("created_at", orderCreated),
      supabase.from("accounts").select("*").order("created_at", orderCreated),
      supabase.from("categories").select("*").order("created_at", orderCreated),
      supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false }),
      supabase.from("budgets").select("*").order("created_at", orderCreated),
      supabase
        .from("recipients")
        .select(
          "*, account:accounts(id, name, currency), category:categories(id, name, icon, color)"
        )
        .order("created_at", orderCreated),
      supabase.from("tags").select("*").order("created_at", orderCreated),
    ]);
    if (p.error) setLoadError(p.error.message);
    else if (p.data) setProfileState(p.data);
    if (!b.error && b.data) setBooks(b.data);
    if (!a.error && a.data) setAccounts(a.data);
    if (!c.error && c.data) setCategories(c.data);
    if (!t.error && t.data) setTransactions(t.data);
    if (!bg.error && bg.data) setBudgets(bg.data);
    if (!r.error && r.data) setRecipients(r.data);
    if (!tg.error && tg.data) setTags(tg.data);
    setHasLoaded(true);
  }, [userId]);

  React.useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch in provider on auth change
    void loadAll();
  }, [userId, reloadKey, loadAll]);

  const effectiveActiveBookId = React.useMemo(() => {
    if (activeBookId && books.some((book) => book.id === activeBookId)) return activeBookId;
    return books.find((book) => book.is_default)?.id ?? (books[0]?.id ?? null);
  }, [activeBookId, books]);

  const activeBook = effectiveActiveBookId
    ? (books.find((book) => book.id === effectiveActiveBookId) ?? null)
    : null;
  const currency = profile?.default_currency ?? "USD";
  const exchangeRates = React.useMemo(
    () => normalizeRates(profile?.exchange_rates),
    [profile?.exchange_rates]
  );

  const setActiveBook = React.useCallback((bookId: string) => {
    setActiveBookId(bookId);
  }, []);

  const createBudgetBook = React.useCallback(
    async (name: string): Promise<BudgetBook | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("budget_books")
        .insert({ user_id: userId, name, is_default: false })
        .select()
        .single();
      if (error) {
        throw new Error(error.message);
      }
      setBooks((prev) => [...prev, data]);
      setActiveBookId(data.id);
      return data;
    },
    [userId]
  );

  const updateProfile = React.useCallback(
    async (patch: ProfilePatch) => {
      if (!userId) return;
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) {
        throw new Error(error.message);
      }
      setProfileState((p) => (p ? { ...p, ...patch } : p));
    },
    [userId]
  );

  const addTransaction = React.useCallback(
    async (input: AddTransactionInput): Promise<void> => {
      if (!effectiveActiveBookId) {
        throw new Error("Активна книга не вибрана");
      }
      const { error } = await supabase.from("transactions").insert({
        budget_book_id: effectiveActiveBookId,
        account_id: input.account_id,
        category_id: input.type === "transfer" ? null : (input.category_id ?? null),
        recipient_id: input.recipient_id ?? null,
        tag_id: input.tag_id ?? null,
        transfer_account_id:
          input.type === "transfer" ? (input.transfer_account_id ?? null) : null,
        type: input.type,
        amount: input.amount,
        currency,
        note: input.note?.trim() ? input.note.trim() : null,
        transaction_date: input.transaction_date,
      });
      if (error) throw new Error(error.message);
      await Promise.all([refreshTransactions(), refreshAccounts()]);
    },
    [effectiveActiveBookId, currency, refreshTransactions, refreshAccounts]
  );

  const updateTransaction = React.useCallback(
    async (transactionId: string, patch: TransactionPatch): Promise<void> => {
      const update: Database["public"]["Tables"]["transactions"]["Update"] = {};
      if (patch.type !== undefined) {
        update.type = patch.type;
        if (patch.type === "transfer") {
          update.category_id = null;
          update.transfer_account_id = patch.transfer_account_id ?? null;
        } else {
          update.category_id = patch.category_id ?? null;
          update.transfer_account_id = null;
        }
      } else {
        if (patch.category_id !== undefined) update.category_id = patch.category_id;
        if (patch.transfer_account_id !== undefined) {
          update.transfer_account_id = patch.transfer_account_id;
        }
      }
      if (patch.amount !== undefined) update.amount = patch.amount;
      if (patch.account_id !== undefined) update.account_id = patch.account_id;
      if (patch.recipient_id !== undefined) update.recipient_id = patch.recipient_id;
      if (patch.tag_id !== undefined) update.tag_id = patch.tag_id;
      if (patch.note !== undefined) {
        update.note = patch.note?.trim() ? patch.note.trim() : null;
      }
      if (patch.transaction_date !== undefined) {
        update.transaction_date = patch.transaction_date;
      }

      const { error } = await supabase
        .from("transactions")
        .update(update)
        .eq("id", transactionId);
      if (error) throw new Error(error.message);
      await Promise.all([refreshTransactions(), refreshAccounts()]);
    },
    [refreshTransactions, refreshAccounts]
  );

  const deleteTransaction = React.useCallback(
    async (transactionId: string): Promise<void> => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);
      if (error) throw new Error(error.message);
      await Promise.all([refreshTransactions(), refreshAccounts()]);
    },
    [refreshTransactions, refreshAccounts]
  );

  const addAccount = React.useCallback(
    async (input: AddAccountInput): Promise<void> => {
      if (!effectiveActiveBookId) {
        throw new Error("Активна книга не вибрана");
      }
      const opening = input.initial_balance;
      const { error } = await supabase.from("accounts").insert({
        budget_book_id: effectiveActiveBookId,
        name: input.name,
        type: input.type,
        currency: input.currency ?? currency,
        initial_balance: opening,
        current_balance: input.current_balance ?? opening,
        color: input.color ?? null,
        icon: input.icon ?? null,
        note: input.note ?? null,
      });
      if (error) {
        throw new Error(error.message);
      }
      await refreshAccounts();
    },
    [effectiveActiveBookId, currency, refreshAccounts]
  );

const updateAccount = React.useCallback(
    async (accountId: string, patch: AccountPatch): Promise<void> => {
      const { error } = await supabase
        .from("accounts")
        .update(patch)
        .eq("id", accountId);
      if (error) {
        throw new Error(error.message);
      }
      await refreshAccounts();
    },
    [refreshAccounts]
  );

const deleteAccount = React.useCallback(
    async (accountId: string): Promise<void> => {
      const { error } = await supabase.from("accounts").delete().eq("id", accountId);
      if (error) {
        throw new Error(error.message);
      }
      await Promise.all([refreshAccounts(), refreshTransactions()]);
    },
    [refreshAccounts, refreshTransactions]
  );

  const addCategory = React.useCallback(
    async (input: AddCategoryInput): Promise<void> => {
      if (!effectiveActiveBookId) {
        throw new Error("Активна книга не вибрана");
      }
      const { error } = await supabase.from("categories").insert({
        budget_book_id: effectiveActiveBookId,
        parent_id: input.parent_id ?? null,
        name: input.name,
        kind: input.kind ?? "expense",
        icon: input.parent_id ? (input.icon ?? null) : null,
        color: input.parent_id ? (input.color ?? null) : null,
      });
      if (error) throw new Error(error.message);
      await refreshCategories();
    },
    [effectiveActiveBookId, refreshCategories]
  );

  const updateCategory = React.useCallback(
    async (categoryId: string, patch: CategoryPatch): Promise<void> => {
      const { error } = await supabase
        .from("categories")
        .update(patch)
        .eq("id", categoryId);
      if (error) throw new Error(error.message);
      await refreshCategories();
    },
    [refreshCategories]
  );

  const deleteCategory = React.useCallback(
    async (categoryId: string): Promise<void> => {
      const category = categories.find((c) => c.id === categoryId);
      const targets = [categoryId];
      if (category && category.parent_id == null) {
        categories
          .filter((c) => c.parent_id === categoryId)
          .forEach((c) => targets.push(c.id));
      }
      const { error: budgetsError } = await supabase
        .from("budgets")
        .delete()
        .in("category_id", targets);
      if (budgetsError) throw new Error(budgetsError.message);
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw new Error(error.message);
      await Promise.all([refreshCategories(), refreshBudgets(), refreshTransactions()]);
    },
    [categories, refreshCategories, refreshBudgets, refreshTransactions]
  );

  const addBudget = React.useCallback(
    async (input: AddBudgetInput): Promise<void> => {
      if (!effectiveActiveBookId) {
        throw new Error("Активна книга не вибрана");
      }
      const { error } = await supabase.from("budgets").insert({
        budget_book_id: effectiveActiveBookId,
        category_id: input.category_id,
        amount_limit: input.amount_limit,
        name: input.name,
        period_type: input.period_type,
        start_date: input.start_date,
      });
      if (error) throw new Error(error.message);
      await refreshBudgets();
    },
    [effectiveActiveBookId, refreshBudgets]
  );

  const addRecipient = React.useCallback(
    async (input: AddRecipientInput): Promise<void> => {
      if (!effectiveActiveBookId) {
        throw new Error("Активна книга не вибрана");
      }
      const { error } = await supabase.from("recipients").insert({
        budget_book_id: effectiveActiveBookId,
        name: input.name,
        account_id: input.account_id ?? null,
        category_id: input.category_id ?? null,
        notes: input.notes ?? null,
      });
      if (error) throw new Error(error.message);
      await refreshRecipients();
    },
    [effectiveActiveBookId, refreshRecipients]
  );

  const updateRecipient = React.useCallback(
    async (recipientId: string, patch: RecipientPatch): Promise<void> => {
      const { error } = await supabase
        .from("recipients")
        .update({
          name: patch.name,
          account_id: patch.account_id ?? null,
          category_id: patch.category_id ?? null,
          notes: patch.notes ?? null,
        })
        .eq("id", recipientId);
      if (error) throw new Error(error.message);
      await refreshRecipients();
    },
    [refreshRecipients]
  );

  const deleteRecipient = React.useCallback(
    async (recipientId: string): Promise<void> => {
      const { error } = await supabase.from("recipients").delete().eq("id", recipientId);
      if (error) throw new Error(error.message);
      await Promise.all([refreshRecipients(), refreshTransactions()]);
    },
    [refreshRecipients, refreshTransactions]
  );

  const addTag = React.useCallback(
    async (input: AddTagInput): Promise<void> => {
      if (!effectiveActiveBookId) {
        throw new Error("Активна книга не вибрана");
      }
      const { error } = await supabase.from("tags").insert({
        budget_book_id: effectiveActiveBookId,
        name: input.name,
        color: input.color ?? null,
      });
      if (error) throw new Error(error.message);
      await refreshTags();
    },
    [effectiveActiveBookId, refreshTags]
  );

const updateTag = React.useCallback(
    async (tagId: string, patch: TagPatch): Promise<void> => {
      const { error } = await supabase
        .from("tags")
        .update(patch)
        .eq("id", tagId);
      if (error) throw new Error(error.message);
      await refreshTags();
    },
    [refreshTags]
  );

const deleteTag = React.useCallback(
    async (tagId: string): Promise<void> => {
      const { error } = await supabase.from("tags").delete().eq("id", tagId);
      if (error) throw new Error(error.message);
      await Promise.all([refreshTags(), refreshTransactions()]);
    },
    [refreshTags, refreshTransactions]
  );

  const value = React.useMemo<DataContextValue>(
    () => ({
      profile,
      books,
      accounts,
      categories,
      transactions,
      budgets,
      recipients,
      tags,
      activeBookId: effectiveActiveBookId,
      activeBook,
      currency,
      exchangeRates,
      setActiveBook,
      createBudgetBook,
      updateProfile,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addBudget,
      addRecipient,
      updateRecipient,
      deleteRecipient,
      addTag,
      updateTag,
      deleteTag,
    }),
    [
      profile,
      books,
      accounts,
      categories,
      transactions,
      budgets,
      recipients,
      tags,
      effectiveActiveBookId,
      activeBook,
      currency,
      exchangeRates,
      setActiveBook,
      createBudgetBook,
      updateProfile,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addBudget,
      addRecipient,
      updateRecipient,
      deleteRecipient,
      addTag,
      updateTag,
      deleteTag,
    ]
  );

  if (userId && profile === null && hasLoaded) {
    return (
      <LoadErrorScreen
        message="Профіль користувача не знайдено."
        onRetry={() => setReloadKey((k) => k + 1)}
        onSignOut={() => {
          void signOut();
        }}
      />
    );
  }

  if (userId && !hasLoaded) {
    if (loadError) return <LoadErrorScreen onRetry={() => setReloadKey((k) => k + 1)} />;
    return <ShellLoading label="Завантаження даних…" />;
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function LoadErrorScreen({
  message = "Не вдалося завантажити дані.",
  onRetry,
  onSignOut,
}: {
  message?: string;
  onRetry: () => void;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </div>
        <p className="text-sm font-medium">{message}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Перевірте, що Supabase запущено та доступний.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw />
            Спробувати ще раз
          </Button>
          {onSignOut ? (
            <Button
              onClick={onSignOut}
              variant="ghost"
              size="sm"
              className="text-destructive"
            >
              <LogOut />
              Вийти з акаунта
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function useData(): DataContextValue {
  const ctx = React.useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}
