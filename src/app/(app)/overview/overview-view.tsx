"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { PageHeading } from "@/components/page-heading";
import { TypeBadge, AmountText } from "@/components/type-badge";
import { CategorySwatch } from "@/components/category-looks";
import { parsePeriodParam } from "@/components/period-selector";
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

const PERIOD_LABELS: Record<PeriodKey, [string, string]> = {
  "7d": ["Last 7 days", "Останні 7 днів"],
  "30d": ["Last 30 days", "Останні 30 днів"],
  "90d": ["Last 90 days", "Останні 90 днів"],
  year: ["This year", "Цей рік"],
};

type FlowChartKey = "income" | "expense";
type FlowChartPoint = {
  key: string;
  label: string;
  tooltipLabel: string;
  income: number;
  expense: number;
};

function flowBucketStart(date: Date, period: PeriodKey) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  if (period === "year") {
    return new Date(start.getFullYear(), start.getMonth(), 1);
  }
  if (period === "90d") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  }
  return start;
}

function flowBucketLabel(date: Date, period: PeriodKey, locale: string) {
  if (period === "year") {
    return date.toLocaleDateString(locale, { month: "short" });
  }
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function flowBucketTooltipLabel(date: Date, period: PeriodKey, locale: string) {
  if (period === "year") {
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }
  if (period === "90d") {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
    for (const tx of periodTransactions) {
      const amount = convertAmount(tx.amount, tx.currency, currency, exchangeRates);
      if (tx.type === "income") {
        income += amount;
      } else if (tx.type === "expense") {
        expense += amount;
      }
    }
    return { income, expense };
  }, [periodTransactions, currency, exchangeRates]);

  const flowChartData = React.useMemo<FlowChartPoint[]>(() => {
    const bucketStarts =
      period === "year"
        ? Array.from(
            { length: rangeEnd.getMonth() + 1 },
            (_, index) => new Date(rangeStart.getFullYear(), index, 1)
          )
        : eachDay(rangeStart, rangeEnd).filter((day, index) => {
            if (period !== "90d") return true;
            return index === 0 || day.getDay() === 1;
          });
    const totals = new Map<string, FlowChartPoint>();
    for (const date of bucketStarts) {
      const key = toISODate(flowBucketStart(date, period));
      totals.set(key, {
        key,
        label: flowBucketLabel(date, period, locale),
        tooltipLabel: flowBucketTooltipLabel(date, period, locale),
        income: 0,
        expense: 0,
      });
    }
    for (const tx of periodTransactions) {
      if (tx.type !== "income" && tx.type !== "expense") continue;
      const date = new Date(`${tx.transaction_date}T00:00:00`);
      const key = toISODate(flowBucketStart(date, period));
      const bucket = totals.get(key);
      if (!bucket) continue;
      const amount = convertAmount(tx.amount, tx.currency, currency, exchangeRates);
      if (tx.type === "income") bucket.income += amount;
      else bucket.expense += amount;
    }
    return Array.from(totals.values());
  }, [
    period,
    periodTransactions,
    rangeStart,
    rangeEnd,
    locale,
    currency,
    exchangeRates,
  ]);

  const lineChartConfig = {
    income: { label: text("Income", "Доходи"), color: "var(--chart-1)" },
    expense: { label: text("Expenses", "Витрати"), color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const budgetRows = React.useMemo(() => {
    return budgets
      .filter((b) => b.budget_book_id === activeBookId)
      .map((b) => {
        const spent = computeBudgetSpent(transactions, activeBookId, b.category_id, now);
        return { ...b, spent };
      })
      .sort((a, b) => b.spent / b.amount_limit - a.spent / a.amount_limit);
  }, [budgets, transactions, activeBookId, now]);

  const budgetChartData = React.useMemo(
    () =>
      budgetRows.slice(0, 6).map((budget) => ({
        name: budget.name,
        spent: budget.spent,
        limit: budget.amount_limit,
        used:
          budget.amount_limit > 0
            ? Math.min(100, Math.round((budget.spent / budget.amount_limit) * 100))
            : 0,
        usedLabel:
          budget.amount_limit > 0
            ? Math.round((budget.spent / budget.amount_limit) * 100)
            : 0,
      })),
    [budgetRows]
  );
  const budgetTotals = React.useMemo(
    () =>
      budgetRows.reduce(
        (totals, budget) => ({
          spent: totals.spent + budget.spent,
          limit: totals.limit + budget.amount_limit,
        }),
        { spent: 0, limit: 0 }
      ),
    [budgetRows]
  );

  const budgetChartConfig = {
    used: {
      label: text("Used", "Використано"),
      color: "var(--chart-2)",
    },
    label: {
      color: "var(--background)",
    },
  } satisfies ChartConfig;

  const [activeFlowChart, setActiveFlowChart] =
    React.useState<FlowChartKey>("expense");

  const flowChartConfig = {
    totals: {
      label: text("Total", "Разом"),
    },
    income: {
      label: text("Income", "Доходи"),
      color: "var(--chart-1)",
    },
    expense: {
      label: text("Expenses", "Витрати"),
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  const flowChartTotals = React.useMemo(
    () => ({
      income: periodStats.income,
      expense: periodStats.expense,
    }),
    [periodStats.income, periodStats.expense]
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
        title={text("Overview", "Огляд")}
        description={text(
          `Activity for ${periodLabel(period, locale, now)}`,
          `Операції за ${periodLabel(period, locale, now)}`
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{text("Current balance", "Поточний баланс")}</CardTitle>
            <CardDescription>
              {text("in", "у книзі")} {text(`"${activeBook?.name ?? "..."}"`, `«${activeBook?.name ?? "…"}»`)}
            </CardDescription>
            <CardAction>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Wallet />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {money(currentBalance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{text("Income", "Доходи")}</CardTitle>
            <CardDescription>{periodLabel(period, locale, now)}</CardDescription>
            <CardAction>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ArrowUpRight />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {money(periodStats.income)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{text("Expenses", "Витрати")}</CardTitle>
            <CardDescription>{periodLabel(period, locale, now)}</CardDescription>
            <CardAction>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ArrowDownRight />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {money(periodStats.expense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>{text("Cash flow dynamics", "Динаміка руху коштів")}</CardTitle>
            <CardDescription>
              {text(
                `Income and expenses for ${periodLabel(period, locale, now)}`,
                `Доходи та витрати за ${periodLabel(period, locale, now)}`
              )}
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
            <SelectTrigger
              className="w-full rounded-lg sm:ml-auto sm:w-[160px]"
              aria-label={text("Select period", "Оберіть період")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectGroup>
                {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
                  <SelectItem key={key} value={key} className="rounded-lg">
                    {text(...PERIOD_LABELS[key])}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={lineChartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart accessibilityLayer data={flowChartData}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-expense)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-expense)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_value, payload) =>
                      payload[0]?.payload?.tooltipLabel ?? ""
                    }
                    formatter={(value, name, item) => {
                      const key = String(name) as keyof typeof lineChartConfig;
                      const numeric = Number(value);
                      return (
                        <>
                          <div
                            className="size-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">
                            {lineChartConfig[key]?.label ?? key}
                          </span>
                          <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                            {money(numeric)}
                          </span>
                        </>
                      );
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="expense"
                type="natural"
                fill="url(#fillExpense)"
                stroke="var(--color-expense)"
                stackId="cash-flow"
              />
              <Area
                dataKey="income"
                type="natural"
                fill="url(#fillIncome)"
                stroke="var(--color-income)"
                stackId="cash-flow"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
            <CardTitle>{text("Total income and expenses", "Загальний дохід та загальні витрати")}</CardTitle>
            <CardDescription>
              {text(
                `Daily totals for ${periodLabel(period, locale, now)}`,
                `Денні підсумки за ${periodLabel(period, locale, now)}`
              )}
            </CardDescription>
          </div>
          <div className="flex">
            {(["expense", "income"] as const).map((key) => (
              <button
                key={key}
                type="button"
                data-active={activeFlowChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveFlowChart(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {flowChartConfig[key].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {money(flowChartTotals[key])}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          {flowChartTotals.income === 0 && flowChartTotals.expense === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {text("No income or expenses recorded for this period.", "За цей період доходів або витрат не було.")}
            </p>
          ) : (
            <ChartContainer
              config={flowChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={flowChartData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="totals"
                      labelFormatter={(_value, payload) =>
                        payload[0]?.payload?.tooltipLabel ?? ""
                      }
                      formatter={(value) => money(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey={activeFlowChart}
                  fill={`var(--color-${activeFlowChart})`}
                  radius={4}
                  maxBarSize={44}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{text("This month's budgets", "Бюджети цього місяця")}</CardTitle>
          <CardDescription>
            <Link href="/budgets" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              {text("View budgets →", "Перейти до бюджетів →")}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {text("This book has no budgets yet.", "У цій книзі ще немає бюджетів.")}
            </p>
          ) : (
            <ChartContainer
              config={budgetChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={budgetChartData}
                layout="vertical"
                margin={{ right: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => String(value).slice(0, 3)}
                  hide
                />
                <XAxis dataKey="used" type="number" domain={[0, 100]} hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value, name, _item, _index, payload) => {
                        const key = String(name);
                        const label = key === "used" ? budgetChartConfig.used.label : key;
                        const usedLabel =
                          payload && typeof payload === "object" && "usedLabel" in payload
                            ? Number(payload.usedLabel)
                            : Number(value);
                        return (
                          <>
                            <span className="text-muted-foreground">{label}</span>
                            <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                              {usedLabel}%
                            </span>
                          </>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="used" fill="var(--color-used)" radius={4}>
                  <LabelList
                    dataKey="name"
                    position="insideLeft"
                    offset={8}
                    className="fill-(--color-label)"
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="usedLabel"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value) => `${Number(value)}%`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
        {budgetRows.length > 0 ? (
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              {text("Spent this month", "Витрачено цього місяця")} {money(budgetTotals.spent)}
            </div>
            <div className="leading-none text-muted-foreground">
              {text(
                `Across ${budgetRows.length} budgets of ${money(budgetTotals.limit)}`,
                `По ${budgetRows.length} бюджетах із ${money(budgetTotals.limit)}`
              )}
            </div>
          </CardFooter>
        ) : null}
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
