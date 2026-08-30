"use client";

import * as React from "react";
import { Wallet2, CircleAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { PageHeading } from "@/components/page-heading";
import { AddBudgetDialog } from "@/components/budget-dialog";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { computeBudgetSpent } from "@/lib/selectors";
import { percentRatio } from "@/lib/format";

export default function BudgetsPage() {
  const { transactions, categories, budgets, activeBookId, activeBook, currency } =
    useData();
  const { language, text } = useLanguage();
  const locale = language === "uk" ? "uk-UA" : "en-US";
  const now = React.useMemo(() => new Date(), []);
  const month = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(now);
  const money = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);

  const categoryName = React.useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? "—",
    [categories]
  );

  const rows = React.useMemo(() => {
    return budgets
      .filter((b) => b.budget_book_id === activeBookId)
      .map((b) => {
        const spent = computeBudgetSpent(transactions, activeBookId, b.category_id, now);
        return {
          ...b,
          spent,
          remaining: b.amount_limit - spent,
          ratio: percentRatio(spent, b.amount_limit),
          over: spent > b.amount_limit,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [budgets, transactions, activeBookId, now]);

  const totals = React.useMemo(() => {
    const limit = rows.reduce((s, r) => s + r.amount_limit, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    return { limit, spent, remaining: limit - spent };
  }, [rows]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={text("Budgets", "Бюджети")}
        description={text(
          `Monthly limits in "${activeBook?.name ?? "..."}" · ${month}`,
          `Місячні ліміти в книзі «${activeBook?.name ?? "…"}» · ${month}`
        )}
        actions={<AddBudgetDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{text("Total limit", "Загальний ліміт")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
              {money(totals.limit)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {text(`${rows.length} budgets`, `${rows.length} бюджетів`)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{text("Spent", "Витрачено")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
              {money(totals.spent)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{text("this month", "цього місяця")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{text("Remaining", "Залишок")}</p>
            <p
              className={
                totals.remaining < 0
                  ? "mt-2 text-2xl font-semibold tracking-tight tabular-nums text-rose-600 dark:text-rose-400"
                  : "mt-2 text-2xl font-semibold tracking-tight tabular-nums"
              }
            >
              {money(totals.remaining)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totals.remaining < 0
                ? text("limit exceeded", "ліміт перевищено")
                : text("until the end of the month", "до кінця місяця")}
            </p>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Wallet2 className="size-5" />
            </div>
            <p className="text-sm font-medium">{text("No budgets yet", "Ще немає бюджетів")}</p>
            <p className="text-sm text-muted-foreground">
              {text(
                "Add a budget for a category to track monthly expenses.",
                "Додайте бюджет на категорію, щоб стежити за місячними витратами."
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{b.name}</CardTitle>
                    <CardDescription className="truncate">
                      {categoryName(b.category_id)}
                    </CardDescription>
                  </div>
                  {b.over ? (
                    <span className="flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                      <CircleAlert className="size-3" />
                      {text("Exceeded", "Перевищено")}
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={b.ratio}
                  className={
                    b.over
                      ? "bg-rose-100 dark:bg-rose-950 [&>div]:bg-rose-500"
                      : undefined
                  }
                />
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>
                    {text("Spent", "Витрачено")}{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {money(b.spent)}
                    </span>{" "}
                    {text("of", "з")}{" "}
                    <span className="tabular-nums">
                      {money(b.amount_limit)}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {b.remaining >= 0
                      ? text("remaining ", "лишилось ")
                      : text("over limit ", "понад ліміт ")}
                    {money(Math.abs(b.remaining))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {text(`${b.ratio}% of monthly limit`, `${b.ratio}% від місячного ліміту`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
