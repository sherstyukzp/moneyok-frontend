"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
import { TypeBadge } from "@/components/type-badge";
import { useData } from "@/lib/store";
import { computeBudgetSpent } from "@/lib/selectors";
import {
  formatDateShort,
  formatMoney,
  isSameMonth,
  lastNMonths,
  monthLabel,
  monthLabelLong,
  percentRatio,
} from "@/lib/format";

const chartConfig = {
  income: { label: "Доходи", color: "var(--chart-1)" },
  expense: { label: "Витрати", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function OverviewPage() {
  const {
    transactions,
    accounts,
    categories,
    budgets,
    activeBookId,
    activeBook,
    currency,
  } = useData();

  const now = React.useMemo(() => new Date(), []);
  const nowMonth = monthLabelLong(now);

  const stats = React.useMemo(() => {
    const monthTx = transactions.filter(
      (tx) => tx.budget_book_id === activeBookId && isSameMonth(tx.transaction_date, now)
    );
    let income = 0;
    let expense = 0;
    for (const tx of monthTx) {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    }
    return {
      income,
      expense,
      balance: accounts
        .filter((a) => a.budget_book_id === activeBookId)
        .reduce((sum, a) => sum + a.current_balance, 0),
    };
  }, [transactions, accounts, activeBookId, now]);

  const chartData = React.useMemo(() => {
    return lastNMonths(6, now).map((m) => {
      let income = 0;
      let expense = 0;
      for (const tx of transactions) {
        if (tx.budget_book_id !== activeBookId || !isSameMonth(tx.transaction_date, m)) continue;
        if (tx.type === "income") income += tx.amount;
        else if (tx.type === "expense") expense += tx.amount;
      }
      return { month: monthLabel(m), income, expense };
    });
  }, [transactions, activeBookId, now]);

  const budgetRows = React.useMemo(() => {
    return budgets
      .filter((b) => b.budget_book_id === activeBookId)
      .map((b) => {
        const spent = computeBudgetSpent(transactions, activeBookId, b.category_id, now);
        return { ...b, spent };
      })
      .sort((a, b) => percentRatio(b.spent, b.amount_limit) - percentRatio(a.spent, a.amount_limit));
  }, [budgets, transactions, activeBookId, now]);

  const categoryName = React.useCallback(
    (id?: string | null) => categories.find((c) => c.id === id)?.name ?? "—",
    [categories]
  );
  const accountName = React.useCallback(
    (id: string) => accounts.find((a) => a.id === id)?.name ?? "—",
    [accounts]
  );

  const recent = React.useMemo(() => {
    return [...transactions]
      .filter((tx) => tx.budget_book_id === activeBookId)
      .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : a.transaction_date > b.transaction_date ? -1 : 0))
      .slice(0, 6);
  }, [transactions, activeBookId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Огляд"
        description={`Операції за ${nowMonth}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Поточний баланс</p>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Wallet className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
              {formatMoney(stats.balance, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              у книзі «{activeBook?.name ?? "…"}»
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Доходи за місяць</p>
              <div className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <ArrowUpRight className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(stats.income, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">за весь місяць</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Витрати за місяць</p>
              <div className="flex size-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <ArrowDownRight className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
              {formatMoney(stats.expense, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">за весь місяць</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Доходи та витрати</CardTitle>
            <CardDescription>Останні 6 місяців</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="income"
                  fill="var(--color-income)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Бюджети цього місяця</CardTitle>
            <CardDescription>
              <Link href="/budgets" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                Перейти до бюджетів →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {budgetRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                У цій книзі ще немає бюджетів.
              </p>
            ) : (
              budgetRows.map((b) => {
                const ratio = percentRatio(b.spent, b.amount_limit);
                const over = b.spent > b.amount_limit;
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{b.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatMoney(b.spent, currency)}
                        <span className="text-muted-foreground/60"> / {formatMoney(b.amount_limit, currency)}</span>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Останні транзакції</CardTitle>
          <CardDescription>
            <Link href="/transactions" className="text-sm underline-offset-4 hover:underline">
              Усі транзакції →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Опис</TableHead>
                <TableHead>Категорія</TableHead>
                <TableHead className="hidden md:table-cell">Рахунок</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Сума</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateShort(tx.transaction_date)}
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium">
                    {tx.note}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {categoryName(tx.category_id)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {accountName(tx.account_id)}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={tx.type} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountCell type={tx.type} amount={tx.amount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AmountCell({
  type,
  amount,
}: {
  type: "income" | "expense" | "transfer";
  amount: number;
}) {
  return (
    <span
      className={
        type === "income"
          ? "font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
          : "font-medium tabular-nums"
      }
    >
      {type === "income" ? "+" : "−"}
      {amount.toLocaleString("uk-UA")}
      {type === "transfer" ? " ⇄" : ""}
    </span>
  );
}