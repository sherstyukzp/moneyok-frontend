export type PeriodKey = "7d" | "30d" | "90d" | "year";

export const PERIOD_KEYS: PeriodKey[] = ["7d", "30d", "90d", "year"];

export const DEFAULT_PERIOD: PeriodKey = "30d";

export function isPeriodKey(value: string | null | undefined): value is PeriodKey {
  return value === "7d" || value === "30d" || value === "90d" || value === "year";
}

export function periodStart(period: PeriodKey, ref: Date = new Date()): Date {
  const end = endOfDay(ref);
  if (period === "7d") {
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "30d") {
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "90d") {
    const start = new Date(end);
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(ref.getFullYear(), 0, 1);
}

export function periodEnd(period: PeriodKey, ref: Date = new Date()): Date {
  return endOfDay(ref);
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function periodLabel(period: PeriodKey, locale: string, ref: Date = new Date()): string {
  const start = periodStart(period, ref);
  const end = periodEnd(period, ref);
  const startFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(start);
  const endFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(end);
  if (start.toDateString() === end.toDateString()) return endFmt;
  return `${startFmt} — ${endFmt}`;
}