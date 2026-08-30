"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { PageHeading } from "@/components/page-heading";
import { TypeBadge, AmountText } from "@/components/type-badge";
import { CategorySwatch } from "@/components/category-looks";
import { PeriodSelector, parsePeriodParam } from "@/components/period-selector";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { computeBudgetSpent } from "@/lib/selectors";
import { convertAmount } from "@/lib/fx";
import {
  eachDay,
  periodEnd,
  periodLabel,
  periodStart,
  type PeriodKey,
} from "@/lib/period";
import { toISODate } from "@/lib/format";

type NetWorthKey = "income" | "expense";

export function OverviewView() {
  const {
    transactions,
    accounts,
    categories,
    budgets,
    activeBookId,
    activeBook,
    currency,
    exchangeRates,
  } = useData();
  const { language, text } = useLanguage();
  const locale = language === "uk" ? "uk-UA" : "en-US";
  const router = useRouter();
  const searchParams = useSearchParams();

  const period: PeriodKey = parsePeriodParam(searchParams.get("period"));
  const setPeriod = React.useCallback(
    (next: PeriodKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "30d") {
        params.delete("period");
      } else {
        params.set("period", next);
      }
      const qs = params.toString();
      router.replace(qs ? `/overview?${qs}` : "/overview", { scroll: false });
    },
    [router, searchParams]
  );

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

  const bookAccounts = React.useMemo(
    () => accounts.filter((a) => a.budget_book_id === activeBookId),
    [accounts, activeBookId]
  );

  const currentBalance = React.useMemo(
    () =>
      bookAccounts.reduce((sum, a) => {
        const acc = a.current_balance || 0;
        const cur = a.currency || currency;
        return sum + convertAmount(acc, cur, currency, exchangeRates);
      }, 0),
    [bookAccounts, currency, exchangeRates]
  );

  const periodTransactions = React.useMemo(() => {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    return transactions.filter((tx) => {
      if (tx.budget_book_id !== activeBookId) return false;
      const d = new Date(`${tx.transaction_date}T00:00:00`).getTime();
      return d >= startMs && d <= endMs;
    });
  }, [transactions, activeBookId, rangeStart, rangeEnd]);

  const periodStats = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    const uncategorizedIncome = { total: 0, label: text("Uncategorized", "Без категорії") };
    const uncategorizedExpense = { total: 0, label: text("Uncategorized", "Без категорії") };
    for (const tx of periodTransactions) {
      const amount = convertAmount(tx.amount, tx.currency, currency, exchangeRates);
      if (tx.type === "income") {
        income += amount;
        const key = tx.category_id ?? "";
        if (key) {
          incomeByCategory.set(key, (incomeByCategory.get(key) ?? 0) + amount);
        } else {
          uncategorizedIncome.total += amount;
        }
      } else if (tx.type === "expense") {
        expense += amount;
        const key = tx.category_id ?? "";
        if (key) {
          expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + amount);
        } else {
          uncategorizedExpense.total += amount;
        }
      }
    }
    return {
      income,
      expense,
      incomeByCategory,
      expenseByCategory,
      uncategorizedIncome,
      uncategorizedExpense,
    };
  }, [periodTransactions, currency, exchangeRates, text]);

  const lineChartData = React.useMemo(() => {
    const incomeTotals = new Array(days.length).fill(0);
    const expenseTotals = new Array(days.length).fill(0);
    for (const tx of periodTransactions) {
      if (tx.type !== "income" && tx.type !== "expense") continue;
      const idx = dailyIndex.get(tx.transaction_date);
      if (idx == null) continue;
      const amount = convertAmount(tx.amount, tx.currency, currency, exchangeRates);
      if (tx.type === "income") incomeTotals[idx] += amount;
      else expenseTotals[idx] += amount;
    }
    return days.map((d, i) => ({
      date: toISODate(d),
      income: incomeTotals[i],
      expense: expenseTotals[i],
    }));
  }, [periodTransactions, days, dailyIndex, currency, exchangeRates]);

  const [activeSeries, setActiveSeries] = React.useState<NetWorthKey>("expense");

  const lineChartConfig = {
    income: { label: text("Income", "Доходи"), color: "var(--chart-1)" },
    expense: { label: text("Expenses", "Витрати"), color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const seriesTotals = React.useMemo(() => {
    return {
      income: lineChartData.reduce((sum, point) => sum + point.income, 0),
      expense: lineChartData.reduce((sum, point) => sum + point.expense, 0),
    };
  }, [lineChartData]);

  const budgetRows = React.useMemo(() => {
    return budgets
      .filter((b) => b.budget_book_id === activeBookId)
      .map((b) => {
        const spent = computeBudgetSpent(transactions, activeBookId, b.category_id, now);
        return { ...b, spent };
      })
      .sort((a, b) => b.spent / b.amount_limit - a.spent / a.amount_limit);
  }, [budgets, transactions, activeBookId, now]);

  const recent = React.useMemo(() => {
    return [...transactions]
      .filter((tx) => tx.budget_book_id === activeBookId)
      .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : a.transaction_date > b.transaction_date ? -1 : 0))
      .slice(0, 6);
  }, [transactions, activeBookId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={text("Overview", "Огляд")}
        description={text(
          `Activity for ${periodLabel(period, locale, now)}`,
          `Операції за ${periodLabel(period, locale, now)}`
        )}
        actions={
          <PeriodSelector value={period} onChange={setPeriod} className="self-end" />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{text("Current balance", "Поточний баланс")}</p>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Wallet className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
              {money(currentBalance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {text("in", "у книзі")} {text(`"${activeBook?.name ?? "..."}"`, `«${activeBook?.name ?? "…"}»`)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{text("Income", "Доходи")}</p>
              <div className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <ArrowUpRight className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {money(periodStats.income)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {periodLabel(period, locale, now)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{text("Expenses", "Витрати")}</p>
              <div className="flex size-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <ArrowDownRight className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
              {money(periodStats.expense)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {periodLabel(period, locale, now)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="py-4 sm:py-0">
        <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
            <CardTitle>{text("Cash flow dynamics", "Динаміка руху коштів")}</CardTitle>
            <CardDescription>
              {text(
                `Showing ${periodLabel(period, locale, now)}`,
                `Період: ${periodLabel(period, locale, now)}`
              )}
            </CardDescription>
          </div>
          <div className="flex">
            {(["expense", "income"] as const).map((key) => {
              const series = key as NetWorthKey;
              const isActive = activeSeries === series;
              return (
                <button
                  key={series}
                  type="button"
                  data-active={isActive}
                  className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                  onClick={() => setActiveSeries(series)}
                >
                  <span className="text-xs text-muted-foreground">
                    {lineChartConfig[series].label}
                  </span>
                  <span className="text-lg leading-none font-bold sm:text-3xl">
                    {money(seriesTotals[series])}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={lineChartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={lineChartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
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
                    className="w-[150px]"
                    nameKey={activeSeries}
                    labelFormatter={(value) => {
                      return new Date(`${String(value)}T00:00:00`).toLocaleDateString(
                        locale,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      );
                    }}
                  />
                }
              />
              <Line
                dataKey={activeSeries}
                type="monotone"
                stroke={`var(--color-${activeSeries})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <CategoryBreakdownCard
          title={text("Total income", "Загальний дохід")}
          amount={periodStats.income}
          money={money}
          totals={periodStats.incomeByCategory}
          uncategorized={periodStats.uncategorizedIncome}
          kind="income"
          categories={categories}
          emptyLabel={text(
            "No income recorded for this period.",
            "За цей період доходів не було."
          )}
        />
        <CategoryBreakdownCard
          title={text("Total expenses", "Загальні витрати")}
          amount={periodStats.expense}
          money={money}
          totals={periodStats.expenseByCategory}
          uncategorized={periodStats.uncategorizedExpense}
          kind="expense"
          categories={categories}
          emptyLabel={text(
            "No expenses recorded for this period.",
            "За цей період витрат не було."
          )}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text("This month's budgets", "Бюджети цього місяця")}</CardTitle>
          <CardDescription>
            <Link href="/budgets" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              {text("View budgets →", "Перейти до бюджетів →")}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {budgetRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text("This book has no budgets yet.", "У цій книзі ще немає бюджетів.")}
            </p>
          ) : (
            budgetRows.map((b) => {
              const ratio = b.amount_limit > 0
                ? Math.min(100, Math.round((b.spent / b.amount_limit) * 100))
                : 0;
              const over = b.spent > b.amount_limit;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{b.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {money(b.spent)}
                      <span className="text-muted-foreground/60"> / {money(b.amount_limit)}</span>
                    </span>
                  </div>
                  <Progress
                    value={ratio}
                    className={over ? "bg-rose-100 dark:bg-rose-950 [&>div]:bg-rose-500" : undefined}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text("Recent transactions", "Останні транзакції")}</CardTitle>
          <CardDescription>
            <Link href="/transactions" className="text-sm underline-offset-4 hover:underline">
              {text("All transactions →", "Усі транзакції →")}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{text("Date", "Дата")}</TableHead>
                <TableHead>{text("Description", "Опис")}</TableHead>
                <TableHead>{text("Category", "Категорія")}</TableHead>
                <TableHead className="hidden md:table-cell">{text("Account", "Рахунок")}</TableHead>
                <TableHead>{text("Type", "Тип")}</TableHead>
                <TableHead className="text-right">{text("Amount", "Сума")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((tx) => {
                const category = categories.find((c) => c.id === tx.category_id);
                const account = accounts.find((a) => a.id === tx.account_id);
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      }).format(new Date(`${tx.transaction_date}T00:00:00`))}
                    </TableCell>
                    <TableCell className="max-w-48 truncate font-medium">
                      {tx.note}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        {category ? (
                          <CategorySwatch
                            icon={category.icon}
                            color={category.color}
                            className="size-5 rounded"
                          />
                        ) : null}
                        {category?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {account?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={tx.type} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountText type={tx.type} amount={tx.amount} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBreakdownCard({
  title,
  amount,
  money,
  totals,
  uncategorized,
  kind,
  categories,
  emptyLabel,
}: {
  title: string;
  amount: number;
  money: (n: number) => string;
  totals: Map<string, number>;
  uncategorized: { total: number; label: string };
  kind: "income" | "expense";
  categories: { id: string; name: string; icon: string | null; color: string | null }[];
  emptyLabel: string;
}) {
  const rows = React.useMemo(() => {
    const list = Array.from(totals.entries()).map(([id, value]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        id,
        name: cat?.name ?? "—",
        icon: cat?.icon ?? null,
        color: cat?.color ?? null,
        value,
      };
    });
    list.sort((a, b) => b.value - a.value);
    return list;
  }, [totals, categories]);

  const hasAny = rows.length > 0 || uncategorized.total > 0;
  const max = rows[0]?.value ?? 1;
  const Icon = kind === "income" ? TrendingUp : TrendingDown;
  const iconWrap =
    kind === "income"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
      : "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400";
  const barWrap =
    kind === "income"
      ? "[&>div]:bg-emerald-500"
      : "[&>div]:bg-rose-500";
  const trackWrap =
    kind === "income" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-rose-100 dark:bg-rose-950";
  const amountColor =
    kind === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className={`flex size-8 items-center justify-center rounded-md ${iconWrap}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-semibold tracking-tight tabular-nums ${amountColor}`}>
          {money(amount)}
        </p>
        {!hasAny ? (
          <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {rows.map((row) => {
              const ratio = max > 0 ? Math.max(2, Math.round((row.value / max) * 100)) : 0;
              return (
                <li key={row.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      <CategorySwatch
                        icon={row.icon}
                        color={row.color}
                        className="size-5 rounded"
                      />
                      <span className="truncate">{row.name}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {money(row.value)}
                    </span>
                  </div>
                  <Progress value={ratio} className={`${trackWrap} ${barWrap}`} />
                </li>
              );
            })}
            {uncategorized.total > 0 ? (
              <li className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="flex size-5 items-center justify-center rounded bg-muted text-muted-foreground">
                      ?
                    </span>
                    <span className="truncate">{uncategorized.label}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {money(uncategorized.total)}
                  </span>
                </div>
                <Progress
                  value={max > 0 ? Math.max(2, Math.round((uncategorized.total / max) * 100)) : 0}
                  className={`${trackWrap} ${barWrap}`}
                />
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}