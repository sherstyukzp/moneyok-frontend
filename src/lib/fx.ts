export type ExchangeRates = Record<string, Record<string, number>>;

export const SUPPORTED_CURRENCIES = ["UAH", "USD", "EUR", "GBP", "PLN", "CZK"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_RATES: ExchangeRates = {
  UAH: { UAH: 1, USD: 0.024, EUR: 0.022, GBP: 0.019, PLN: 0.097, CZK: 0.55 },
  USD: { USD: 1, UAH: 41.5, EUR: 0.92, GBP: 0.79, PLN: 4.0, CZK: 22.8 },
  EUR: { EUR: 1, UAH: 45.1, USD: 1.09, GBP: 0.86, PLN: 4.35, CZK: 24.8 },
  GBP: { GBP: 1, UAH: 52.5, USD: 1.27, EUR: 1.16, PLN: 5.07, CZK: 28.9 },
  PLN: { PLN: 1, UAH: 10.35, USD: 0.25, EUR: 0.23, GBP: 0.197, CZK: 5.7 },
  CZK: { CZK: 1, UAH: 1.82, USD: 0.044, EUR: 0.04, GBP: 0.035, PLN: 0.175 },
};

export function normalizeRates(raw: unknown): ExchangeRates {
  if (!raw || typeof raw !== "object") return {};
  const result: ExchangeRates = {};
  for (const [from, toMap] of Object.entries(raw as Record<string, unknown>)) {
    if (!toMap || typeof toMap !== "object") continue;
    const inner: Record<string, number> = {};
    for (const [to, rate] of Object.entries(toMap as Record<string, unknown>)) {
      const n = typeof rate === "number" ? rate : Number(rate);
      if (Number.isFinite(n) && n > 0) inner[to.toUpperCase()] = n;
    }
    result[from.toUpperCase()] = inner;
  }
  return result;
}

export function getRate(
  rates: ExchangeRates | null | undefined,
  from: string,
  to: string,
): number | null {
  if (!from || !to) return null;
  if (from.toUpperCase() === to.toUpperCase()) return 1;
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  const direct = rates?.[f]?.[t];
  if (typeof direct === "number" && direct > 0) return direct;
  const inverse = rates?.[t]?.[f];
  if (typeof inverse === "number" && inverse > 0) return 1 / inverse;
  const defaultDirect = DEFAULT_RATES[f]?.[t];
  if (typeof defaultDirect === "number" && defaultDirect > 0) return defaultDirect;
  const defaultInverse = DEFAULT_RATES[t]?.[f];
  if (typeof defaultInverse === "number" && defaultInverse > 0) return 1 / defaultInverse;
  return null;
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates | null | undefined,
): number {
  if (!from || !to) return amount;
  if (from.toUpperCase() === to.toUpperCase()) return amount;
  const rate = getRate(rates, from, to);
  return rate == null ? amount : amount * rate;
}