"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Search, SlidersHorizontal, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { PageHeading } from "@/components/page-heading";
import {
  AddTransactionDialog,
  TransactionDialog,
} from "@/components/transaction-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TypeBadge, AmountText } from "@/components/type-badge";
import { CategorySwatch } from "@/components/category-looks";
import { PeriodSelector, parsePeriodParam } from "@/components/period-selector";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { leafCategories } from "@/lib/categories";
import { convertAmount } from "@/lib/fx";
import {
  eachDay,
  periodEnd,
  periodLabel,
  periodStart,
  type PeriodKey,
} from "@/lib/period";
import { toISODate } from "@/lib/format";
import { toast } from "sonner";
import type { Transaction } from "@/lib/types";

const LIMIT = 150;
type FilterKey = "type" | "account" | "category";

export function TransactionsView() {
  const {
    transactions,
    accounts,
    categories,
    activeBookId,
    activeBook,
    currency,
    exchangeRates,
    deleteTransaction,
  } = useData();
  const { language, text } = useLanguage();
  const locale = language === "uk" ? "uk-UA" : "en-US";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState("");

  const type = searchParams.get("type") ?? "all";
  const accountId = searchParams.get("account") ?? "all";
  const categoryId = searchParams.get("category") ?? "all";
  const period: PeriodKey = parsePeriodParam(searchParams.get("period"));

  const setFilter = (key: FilterKey | "period", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "period") {
      if (value === "30d") params.delete("period");
      else params.set("period", value);
    } else if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `/transactions?${qs}` : "/transactions", { scroll: false });
  };

  const bookTransactions = React.useMemo(
    () =>
      transactions
        .filter((tx) => tx.budget_book_id === activeBookId)
        .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : a.transaction_date > b.transaction_date ? -1 : 0)),
    [transactions, activeBookId]
  );

  const accountName = React.useCallback(
    (id: string) => accounts.find((a) => a.id === id)?.name ?? "—",
    [accounts]
  );
  const categoryName = React.useCallback(
    (id?: string | null) => categories.find((c) => c.id === id)?.name ?? "",
    [categories]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookTransactions.filter((tx) => {
      if (type !== "all" && tx.type !== type) return false;
      if (
        accountId !== "all" &&
        tx.account_id !== accountId &&
        tx.transfer_account_id !== accountId
      ) {
        return false;
      }
      if (categoryId !== "all" && tx.category_id !== categoryId) return false;
      if (q) {
        const haystack =
          `${tx.note ?? ""} ${categoryName(tx.category_id)} ${accountName(tx.account_id)} ${accountName(tx.transfer_account_id ?? "")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [bookTransactions, query, type, accountId, categoryId, categoryName, accountName]);

  const showMore = filtered.length > LIMIT;
  const visible = showMore ? filtered.slice(0, LIMIT) : filtered;

  const hasFilters =
    query.trim().length > 0 || type !== "all" || accountId !== "all" || categoryId !== "all";

  const now = React.useMemo(() => new Date(), []);
  const rangeStart = React.useMemo(() => periodStart(period, now), [period, now]);
  const rangeEnd = React.useMemo(() => periodEnd(period, now), [period, now]);
  const days = React.useMemo(() => eachDay(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const dailyIndex = React.useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d, i) => map.set(toISODate(d), i));
    return map;
  }, [days]);

  const money = React.useCallback(
    (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount),
    [locale, currency]
  );

  const periodStats = React.useMemo(() => {
    const incomeTotals = new Array(days.length).fill(0);
    const expenseTotals = new Array(days.length).fill(0);
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      const idx = dailyIndex.get(tx.transaction_date);
      if (idx == null) continue;
      const amount = convertAmount(tx.amount, tx.currency, currency, exchangeRates);
      if (tx.type === "income") {
        incomeTotals[idx] += amount;
        income += amount;
      } else if (tx.type === "expense") {
        expenseTotals[idx] += amount;
        expense += amount;
      }
    }
    const chartData = days.map((d, i) => ({
      date: toISODate(d),
      income: incomeTotals[i],
      expense: expenseTotals[i],
    }));
    return { chartData, income, expense };
  }, [filtered, days, dailyIndex, currency, exchangeRates]);

  const incomeChartConfig = {
    income: { label: text("Income", "Доходи"), color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const expenseChartConfig = {
    expense: { label: text("Expenses", "Витрати"), color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const resetFilters = () => {
    setQuery("");
    router.replace("/transactions");
  };

  const [editTarget, setEditTarget] = React.useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      toast.success(text("Transaction deleted", "Транзакцію видалено"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : text("Delete error", "Помилка видалення")
      );
    } finally {
      setDeleting(false);
    }
  };

  const deleteLabel = text("Delete", "Видалити");
  const editLabel = text("Edit", "Редагувати");

  const bookAccounts = accounts.filter((a) => a.budget_book_id === activeBookId);
  const bookCategories = leafCategories(categories, activeBookId);
  const categoryGroups = React.useMemo(() => {
    const groups = new Map<string, typeof bookCategories>();
    for (const c of bookCategories) {
      const pid = c.parent_id ?? "";
      const list = groups.get(pid) ?? [];
      list.push(c);
      groups.set(pid, list);
    }
    return Array.from(groups.entries());
  }, [bookCategories]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={text("Transactions", "Транзакції")}
        description={text(
          `${filtered.length} transactions in "${activeBook?.name ?? "..."}`,
          `${filtered.length} операцій у книзі «${activeBook?.name ?? "…"}»`
        )}
        actions={<AddTransactionDialog />}
      />

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium">
            {text("Charts period", "Період графіків")}
          </p>
          <p className="text-xs text-muted-foreground">
            {periodLabel(period, locale, now)}
          </p>
        </div>
        <PeriodSelector
          value={period}
          onChange={(p) => setFilter("period", p)}
          className="self-end"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base">{text("Income", "Доходи")}</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ArrowUpRight className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {money(periodStats.income)}
            </p>
            <ChartContainer
              config={incomeChartConfig}
              className="mt-4 aspect-auto h-[180px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={periodStats.chartData}
                margin={{ left: 4, right: 4 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  minTickGap={28}
                  tickFormatter={(value) => {
                    const date = new Date(`${value}T00:00:00`);
                    return date.toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="income"
                      labelFormatter={(value) =>
                        new Date(`${String(value)}T00:00:00`).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                    />
                  }
                />
                <Bar
                  dataKey="income"
                  fill="var(--color-income)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base">{text("Expenses", "Витрати")}</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <ArrowDownRight className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {money(periodStats.expense)}
            </p>
            <ChartContainer
              config={expenseChartConfig}
              className="mt-4 aspect-auto h-[180px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={periodStats.chartData}
                margin={{ left: 4, right: 4 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  minTickGap={28}
                  tickFormatter={(value) => {
                    const date = new Date(`${value}T00:00:00`);
                    return date.toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="expense"
                      labelFormatter={(value) =>
                        new Date(`${String(value)}T00:00:00`).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                    />
                  }
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={text(
                  "Search by description, account, or category...",
                  "Пошук за описом, рахунком, категорією…"
                )}
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={type} onValueChange={(v) => setFilter("type", v)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={text("Type", "Тип")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{text("All types", "Усі типи")}</SelectItem>
                  <SelectItem value="expense">{text("Expenses", "Витрати")}</SelectItem>
                  <SelectItem value="income">{text("Income", "Доходи")}</SelectItem>
                  <SelectItem value="transfer">{text("Transfers", "Перекази")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accountId} onValueChange={(v) => setFilter("account", v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={text("Account", "Рахунок")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{text("All accounts", "Усі рахунки")}</SelectItem>
                  {bookAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryId} onValueChange={(v) => setFilter("category", v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={text("Category", "Категорія")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{text("All categories", "Усі категорії")}</SelectItem>
                  {categoryGroups.map(([parentId, items], index) => (
                    <React.Fragment key={parentId}>
                      {index > 0 ? <SelectSeparator /> : null}
                      <SelectGroup>
                        <SelectLabel>
                          {categories.find((c) => c.id === parentId)?.name ?? text("Ungrouped", "Без групи")}
                        </SelectLabel>
                        {items.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <CategorySwatch
                                icon={c.icon}
                                color={c.color}
                                className="size-5 rounded"
                              />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <SlidersHorizontal />
                  {text("Reset filters", "Скинути фільтри")}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-sm font-medium">{text("No results found", "Нічого не знайдено")}</p>
              <p className="text-sm text-muted-foreground">
                {text(
                  "Try changing the filters or search query.",
                  "Спробуйте змінити фільтри або пошуковий запит."
                )}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text("Date", "Дата")}</TableHead>
                    <TableHead>{text("Description", "Опис")}</TableHead>
                    <TableHead>{text("Category", "Категорія")}</TableHead>
                    <TableHead className="hidden md:table-cell">{text("Account", "Рахунок")}</TableHead>
                    <TableHead className="hidden xl:table-cell">{text("Book", "Книга")}</TableHead>
                    <TableHead>{text("Type", "Тип")}</TableHead>
                    <TableHead className="text-right">{text("Amount", "Сума")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((tx) => (
                    <ContextMenu key={tx.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow className="cursor-default">
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {new Intl.DateTimeFormat(locale, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }).format(new Date(`${tx.transaction_date}T00:00:00`))}
                          </TableCell>
                          <TableCell className="max-w-52 truncate font-medium">
                            {tx.note || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {categoryName(tx.category_id) || "—"}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {accountName(tx.account_id)}
                            {tx.type === "transfer" && tx.transfer_account_id
                              ? ` → ${accountName(tx.transfer_account_id)}`
                              : ""}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground xl:table-cell">
                            {activeBook?.name ?? '…'}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={tx.type} />
                          </TableCell>
                          <TableCell className="text-right">
                            {tx.type === "transfer" ? (
                              <AmountText
                                type={tx.type}
                                amount={tx.amount}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <AmountText type={tx.type} amount={tx.amount} />
                            )}
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onSelect={() => setEditTarget(tx)}>
                          <Pencil />
                          {editLabel}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(tx)}
                        >
                          <Trash2 />
                          {deleteLabel}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </TableBody>
              </Table>
              {showMore ? (
                <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
                  {text(
                    `Showing the first ${LIMIT} of ${filtered.length} transactions. Add filters to narrow the list.`,
                    `Показано перші ${LIMIT} із ${filtered.length} операцій. Додайте фільтри, щоб звузити список.`
                  )}
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {editTarget ? (
        <TransactionDialog
          key={editTarget.id}
          mode="edit"
          transaction={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title={text("Delete transaction?", "Видалити транзакцію?")}
        description={text(
          "The transaction will be removed and the account balance will be reverted.",
          "Транзакцію буде видалено, а баланс рахунку повернеться до попереднього значення."
        )}
        confirmLabel={deleting ? text("Deleting…", "Видалення…") : deleteLabel}
        onConfirm={handleDelete}
      />
    </div>
  );
}
