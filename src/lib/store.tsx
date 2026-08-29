"use client";

import * as React from "react";
import { RefreshCw, TriangleAlert, X } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { ShellLoading } from "@/components/shell-loading";
import { Button } from "@/components/ui/button";
import type {
  Account,
  AddAccountInput,
  AddBudgetInput,
  AddCategoryInput,
  AddTransactionInput,
  Budget,
  BudgetBook,
  Category,
  Profile,
  Transaction,
} from "@/lib/types";

interface DataContextValue {
  profile: Profile | null;
  books: BudgetBook[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  activeBookId: string | null;
  activeBook: BudgetBook | null;
  currency: string;
  setActiveBook: (bookId: string) => void;
  updateProfile: (patch: { full_name?: string; default_currency?: string }) => Promise<void>;
  addTransaction: (input: AddTransactionInput) => void;
  addAccount: (input: AddAccountInput) => void;
  addCategory: (input: AddCategoryInput) => void;
  deleteCategory: (categoryId: string) => void;
  addBudget: (input: AddBudgetInput) => void;
}

const DataContext = React.createContext<DataContextValue | null>(null);
const orderCreated = { ascending: true } as const;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfileState] = React.useState<Profile | null>(null);
  const [books, setBooks] = React.useState<BudgetBook[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [activeBookId, setActiveBookId] = React.useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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

  const loadAll = React.useCallback(async () => {
    if (!userId) return;
    await Promise.resolve();
    setError(null);
    setProfileState(null);
    setBooks([]);
    setAccounts([]);
    setCategories([]);
    setTransactions([]);
    setBudgets([]);
    setActiveBookId(null);
    setHasLoaded(false);

    const [p, b, a, c, t, bg] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("budget_books").select("*").order("created_at", orderCreated),
      supabase.from("accounts").select("*").order("created_at", orderCreated),
      supabase.from("categories").select("*").order("created_at", orderCreated),
      supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false }),
      supabase.from("budgets").select("*").order("created_at", orderCreated),
    ]);
    if (p.error) setError(p.error.message);
    else if (p.data) setProfileState(p.data);
    if (!b.error && b.data) setBooks(b.data);
    if (!a.error && a.data) setAccounts(a.data);
    if (!c.error && c.data) setCategories(c.data);
    if (!t.error && t.data) setTransactions(t.data);
    if (!bg.error && bg.data) setBudgets(bg.data);
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

  const setActiveBook = React.useCallback((bookId: string) => {
    setActiveBookId(bookId);
  }, []);

  const updateProfile = React.useCallback(
    async (patch: { full_name?: string; default_currency?: string }) => {
      if (!userId) return;
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) {
        setError(error.message);
        return;
      }
      setProfileState((p) => (p ? { ...p, ...patch } : p));
    },
    [userId]
  );

  const catchError = (fn: () => Promise<unknown>) => {
    void (async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Невідома помилка");
      }
    })();
  };

  const addTransaction = React.useCallback(
    (input: AddTransactionInput) => {
      if (!effectiveActiveBookId) return;
      catchError(async () => {
        const { error } = await supabase.from("transactions").insert({
          budget_book_id: effectiveActiveBookId,
          account_id: input.account_id,
          category_id: input.type === "transfer" ? null : (input.category_id ?? null),
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
      });
    },
    [effectiveActiveBookId, currency, refreshTransactions, refreshAccounts]
  );

  const addAccount = React.useCallback(
    (input: AddAccountInput) => {
      if (!effectiveActiveBookId) return;
      catchError(async () => {
        const { error } = await supabase.from("accounts").insert({
          budget_book_id: effectiveActiveBookId,
          name: input.name,
          type: input.type,
          currency,
          initial_balance: input.initial_balance,
          current_balance: input.initial_balance,
        });
        if (error) throw new Error(error.message);
        await refreshAccounts();
      });
    },
    [effectiveActiveBookId, currency, refreshAccounts]
  );

  const addCategory = React.useCallback(
    (input: AddCategoryInput) => {
      if (!effectiveActiveBookId) return;
      catchError(async () => {
        const { error } = await supabase.from("categories").insert({
          budget_book_id: effectiveActiveBookId,
          name: input.name,
          kind: input.kind,
        });
        if (error) throw new Error(error.message);
        await refreshCategories();
      });
    },
    [effectiveActiveBookId, refreshCategories]
  );

  const deleteCategory = React.useCallback(
    (categoryId: string) => {
      catchError(async () => {
        const { error: budgetsError } = await supabase
          .from("budgets")
          .delete()
          .eq("category_id", categoryId);
        if (budgetsError) throw new Error(budgetsError.message);
        const { error } = await supabase.from("categories").delete().eq("id", categoryId);
        if (error) throw new Error(error.message);
        await Promise.all([refreshCategories(), refreshBudgets(), refreshTransactions()]);
      });
    },
    [refreshCategories, refreshBudgets, refreshTransactions]
  );

  const addBudget = React.useCallback(
    (input: AddBudgetInput) => {
      if (!effectiveActiveBookId) return;
      catchError(async () => {
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
      });
    },
    [effectiveActiveBookId, refreshBudgets]
  );

  const value = React.useMemo<DataContextValue>(
    () => ({
      profile,
      books,
      accounts,
      categories,
      transactions,
      budgets,
      activeBookId: effectiveActiveBookId,
      activeBook,
      currency,
      setActiveBook,
      updateProfile,
      addTransaction,
      addAccount,
      addCategory,
      deleteCategory,
      addBudget,
    }),
    [
      profile,
      books,
      accounts,
      categories,
      transactions,
      budgets,
      effectiveActiveBookId,
      activeBook,
      currency,
      setActiveBook,
      updateProfile,
      addTransaction,
      addAccount,
      addCategory,
      deleteCategory,
      addBudget,
    ]
  );

  if (userId && profile === null && hasLoaded) {
    return (
      <LoadErrorScreen
        message="Профіль користувача не знайдено."
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  if (userId && !hasLoaded) {
    if (error) return <LoadErrorScreen onRetry={() => setReloadKey((k) => k + 1)} />;
    return <ShellLoading label="Завантаження даних…" />;
  }

  return (
    <DataContext.Provider value={value}>
      {error ? (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-3">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm shadow-sm">
            <TriangleAlert className="size-4 shrink-0 text-destructive" />
            <span className="min-w-0 flex-1 truncate text-destructive">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Закрити помилку"
              className="rounded p-0.5 text-destructive/70 outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </DataContext.Provider>
  );
}

function LoadErrorScreen({
  message = "Не вдалося завантажити дані.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
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
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw />
          Спробувати ще раз
        </Button>
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