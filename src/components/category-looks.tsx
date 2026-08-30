"use client";

import * as React from "react";
import {
  Baby,
  BookOpen,
  Briefcase,
  Building,
  Bus,
  Car,
  CircleDollarSign,
  Clapperboard,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  Music,
  Phone,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  TrainFront,
  Tv,
  Utensils,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export const ICON_OPTIONS: Array<{ name: string; Icon: LucideIcon }> = [
  { name: "cart", Icon: ShoppingCart },
  { name: "utensils", Icon: Utensils },
  { name: "coffee", Icon: Coffee },
  { name: "shopping-bag", Icon: ShoppingBag },
  { name: "receipt", Icon: Receipt },
  { name: "fuel", Icon: Fuel },
  { name: "car", Icon: Car },
  { name: "wrench", Icon: Wrench },
  { name: "bus", Icon: Bus },
  { name: "train-front", Icon: TrainFront },
  { name: "home", Icon: Home },
  { name: "zap", Icon: Zap },
  { name: "wifi", Icon: Wifi },
  { name: "clapperboard", Icon: Clapperboard },
  { name: "gamepad-2", Icon: Gamepad2 },
  { name: "book-open", Icon: BookOpen },
  { name: "film", Icon: Film },
  { name: "music", Icon: Music },
  { name: "tv", Icon: Tv },
  { name: "briefcase", Icon: Briefcase },
  { name: "laptop", Icon: Laptop },
  { name: "gift", Icon: Gift },
  { name: "dumbbell", Icon: Dumbbell },
  { name: "heart-pulse", Icon: HeartPulse },
  { name: "shirt", Icon: Shirt },
  { name: "plane", Icon: Plane },
  { name: "baby", Icon: Baby },
  { name: "phone", Icon: Phone },
  { name: "piggy-bank", Icon: PiggyBank },
  { name: "building", Icon: Building },
];

const ICON_LOOKUP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map(({ name, Icon }) => [name, Icon])
);

export const COLOR_OPTIONS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#16a34a",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#71717a",
];

export function CategoryIcon({
  name,
  className,
  style,
}: {
  name: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = (name && ICON_LOOKUP[name]) || CircleDollarSign;
  return <Icon className={className} style={style} />;
}

export function CategorySwatch({
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
      <CategoryIcon
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
      style={
        color
          ? { backgroundColor: `${color}1f`, color }
          : undefined
      }
    >
      <CategoryIcon name={icon} className={iconClassName ?? "size-4"} />
    </span>
  );
}

export function IconColorPicker({
  icon,
  color,
  onChange,
}: {
  icon: string;
  color: string;
  onChange: (icon: string, color: string) => void;
}) {
  const { text } = useLanguage();

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-sm font-medium">{text("Icon", "Іконка")}</p>
        <div className="grid grid-cols-8 gap-1">
          {ICON_OPTIONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name, color)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                icon === name
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{text("Color", "Колір")}</p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => onChange(icon, c)}
              className={cn(
                "size-6 rounded-full border border-black/10 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring",
                color === c
                  ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "hover:scale-110"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
