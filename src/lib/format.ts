function getLocale(): string {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("moneyok:language") === "uk" ? "uk-UA" : "en-US";
}

export function formatMoney(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale ?? getLocale(), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoneySigned(amount: number, currency: string): string {
  const formatted = formatMoney(Math.abs(amount), currency);
  return amount < 0 ? `−${formatted}` : `+${formatted}`;
}

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_EN_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_UK = [
  "січ", "лют", "бер", "кві", "тра", "чер",
  "лип", "сер", "вер", "жов", "лис", "гру",
];

const MONTHS_UK_LONG = [
  "січень", "лютий", "березень", "квітень", "травень", "червень",
  "липень", "серпень", "вересень", "жовтень", "листопад", "грудень",
];

function shortMonths(): string[] {
  return getLocale() === "uk-UA" ? MONTHS_UK : MONTHS_EN;
}

function longMonths(): string[] {
  return getLocale() === "uk-UA" ? MONTHS_UK_LONG : MONTHS_EN_LONG;
}

export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(getLocale(), { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

export function monthLabel(date: Date): string {
  return shortMonths()[date.getMonth()];
}

export function monthLabelLong(date: Date): string {
  return `${longMonths()[date.getMonth()]} ${date.getFullYear()}`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(`${iso}T00:00:00`);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function startOfMonth(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1);
}

export function lastNMonths(count: number, ref: Date): Date[] {
  const months: Date[] = [];
  const base = new Date(ref.getFullYear(), ref.getMonth(), 1);
  for (let i = count - 1; i >= 0; i--) {
    months.push(new Date(base.getFullYear(), base.getMonth() - i, 1));
  }
  return months;
}

export function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    UAH: "₴",
    USD: "$",
    EUR: "€",
  };
  return symbols[currency] ?? currency;
}

export function percentRatio(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((spent / limit) * 100));
}
