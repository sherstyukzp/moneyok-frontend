"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Briefcase,
  Building,
  Building2,
  ChartLine,
  CircleAlert,
  CircleDollarSign,
  Coins,
  CreditCard,
  FileChartLine,
  Gift,
  Landmark,
  Lock,
  PiggyBank,
  Repeat,
  Send,
  Shield,
  ShieldCheck,
  Store,
  TrendingUp,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AccountType } from "@/lib/types";

export type AccountIconName =
  | "wallet"
  | "piggy-bank"
  | "credit-card"
  | "building-2"
  | "landmark"
  | "banknote"
  | "coins"
  | "trending-up"
  | "line-chart"
  | "shield"
  | "shield-check"
  | "lock"
  | "alert-circle"
  | "alert-triangle"
  | "file-warning"
  | "briefcase"
  | "building"
  | "store"
  | "gift"
  | "repeat"
  | "send"
  | "arrow-down-left"
  | "arrow-up-right"
  | "circle-dollar-sign";

export const ACCOUNT_ICON_OPTIONS: ReadonlyArray<{
  name: AccountIconName;
  Icon: LucideIcon;
}> = [
  { name: "wallet", Icon: Wallet },
  { name: "piggy-bank", Icon: PiggyBank },
  { name: "credit-card", Icon: CreditCard },
  { name: "building-2", Icon: Building2 },
  { name: "landmark", Icon: Landmark },
  { name: "banknote", Icon: Banknote },
  { name: "coins", Icon: Coins },
  { name: "trending-up", Icon: TrendingUp },
  { name: "line-chart", Icon: ChartLine },
  { name: "shield", Icon: Shield },
  { name: "shield-check", Icon: ShieldCheck },
  { name: "lock", Icon: Lock },
  { name: "alert-circle", Icon: CircleAlert },
  { name: "alert-triangle", Icon: TriangleAlert },
  { name: "file-warning", Icon: FileChartLine },
  { name: "briefcase", Icon: Briefcase },
  { name: "building", Icon: Building },
  { name: "store", Icon: Store },
  { name: "gift", Icon: Gift },
  { name: "repeat", Icon: Repeat },
  { name: "send", Icon: Send },
  { name: "arrow-down-left", Icon: ArrowDownLeft },
  { name: "arrow-up-right", Icon: ArrowUpRight },
  { name: "circle-dollar-sign", Icon: CircleDollarSign },
];

const ACCOUNT_ICON_LOOKUP: Record<string, LucideIcon> = Object.fromEntries(
  ACCOUNT_ICON_OPTIONS.map(({ name, Icon }) => [name, Icon])
);

export function isAccountIconName(value: string): value is AccountIconName {
  return value in ACCOUNT_ICON_LOOKUP;
}

export const ACCOUNT_COLOR_OPTIONS: ReadonlyArray<string> = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
];

export const ACCOUNT_DEFAULT_LOOKS: Record<
  AccountType,
  { icon: AccountIconName; color: string; label: [string, string] }
> = {
  payment: { icon: "building-2", color: "#3b82f6", label: ["Payment account", "Платіжний рахунок"] },
  savings: { icon: "piggy-bank", color: "#10b981", label: ["Savings account", "Ощадний рахунок"] },
  credit_card: { icon: "credit-card", color: "#ef4444", label: ["Credit card", "Кредитна картка"] },
  investment: { icon: "trending-up", color: "#8b5cf6", label: ["Investment", "Інвестиція"] },
  reserve: { icon: "shield", color: "#14b8a6", label: ["Reserve", "Застереження"] },
  liability: { icon: "alert-circle", color: "#f97316", label: ["Liability", "Зобов'язання"] },
  business: { icon: "briefcase", color: "#6366f1", label: ["Business account", "Бізнес-рахунок"] },
  cash: { icon: "wallet", color: "#22c55e", label: ["Cash", "Готівка"] },
};

export function AccountIcon({
  name,
  className,
  style,
}: {
  name: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = (name && ACCOUNT_ICON_LOOKUP[name]) || AlertCircle;
  return <Icon className={className} style={style} />;
}

export function AccountSwatch({
  icon,
  color,
  className,
  iconClassName,
  bare = false,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  className?: string;
  iconClassName?: string;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <AccountIcon
        name={icon}
        className={cn("shrink-0", iconClassName ?? "size-4")}
        style={color ? { color } : undefined}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        className ?? "size-6"
      )}
      style={color ? { backgroundColor: `${color}1f`, color } : undefined}
    >
      <AccountIcon name={icon} className={iconClassName ?? "size-4"} />
    </span>
  );
}

export function AccountIconPreview({
  icon,
  color,
}: {
  icon: string;
  color: string;
}) {
  const Icon = (icon && ACCOUNT_ICON_LOOKUP[icon]) || AlertCircle;
  return (
    <span
      className="flex size-14 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: color }}
    >
      <Icon className="size-7 text-white" />
    </span>
  );
}
