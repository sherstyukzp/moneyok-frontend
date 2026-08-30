"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import type { TransactionType } from "@/lib/types";

const TYPE_LABELS: Record<TransactionType, [string, string]> = {
  income: ["Income", "Дохід"],
  expense: ["Expense", "Витрата"],
  transfer: ["Transfer", "Переказ"],
};

const TYPE_STYLES: Record<TransactionType, string> = {
  income:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  expense:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
  transfer:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

export function TypeBadge({
  type,
  className,
}: {
  type: TransactionType;
  className?: string;
}) {
  const { text } = useLanguage();

  return (
    <Badge variant="outline" className={cn(TYPE_STYLES[type], className)}>
      {text(...TYPE_LABELS[type])}
    </Badge>
  );
}

export function AmountText({
  type,
  amount,
  className,
}: {
  type: TransactionType;
  amount: number;
  className?: string;
}) {
  const { language } = useLanguage();
  const locale = language === "uk" ? "uk-UA" : "en-US";

  if (type === "transfer") {
    return (
      <span className={cn("font-medium tabular-nums", className)}>
        ⇄ {amount.toLocaleString(locale)}
      </span>
    );
  }
  const isIncome = type === "income";
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        isIncome
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-foreground",
        className
      )}
    >
      {isIncome ? "+" : "−"}
      {amount.toLocaleString(locale)}
    </span>
  );
}
