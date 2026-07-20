import type { Locale } from "@/lib/i18n/config";

/**
 * Tuition formatter with optional EUR equivalent.
 *
 * Programs are priced in the institution's local currency — 7 currencies
 * across the live catalog (EUR, GBP, CHF, SEK, NOK, DKK, CZK, plus we
 * anticipate PLN). Turkish students reading the catalog generally think in
 * euros, so non-EUR amounts are augmented with an approximate "~€NN,NNN"
 * tail. The squiggle is intentional — rates change daily and we don't
 * refresh on every render.
 *
 * Refresh policy: rates are hand-set against ECB / xe.com mid-market
 * snapshots. Bump RATES_AS_OF and the table when they're stale (a 5%
 * drift on a 30k tuition is ±€1.5k, so quarterly is plenty). No runtime
 * FX API — keeps the page render synchronous and removes a dependency.
 */

export const RATES_AS_OF = "2026-01";

// One unit of the listed currency in EUR. Approximate, rounded.
const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  GBP: 1.18,
  CHF: 1.06,
  SEK: 0.087,
  NOK: 0.086,
  DKK: 0.134,
  CZK: 0.041,
  PLN: 0.233,
};

export type TuitionVariant = "long" | "short" | "chip";

/**
 * Format a tuition amount + currency for display.
 *
 * `locale` only swaps the surrounding words ("year"/"yr", the "not listed"
 * fallback) — the number grouping itself stays "en-GB" regardless of locale
 * (pure formatting, not a translated label).
 *
 *   formatTuition(32500, "GBP")            → "GBP 32,500 / year (~€38,300)"
 *   formatTuition(32500, "GBP", "short")   → "GBP 32,500/yr (~€38,300)"
 *   formatTuition(32500, "GBP", "chip")    → "32,500 GBP/yr · ~€38,300"
 *   formatTuition(20000, "EUR")            → "EUR 20,000 / year"
 *   formatTuition(null,  "EUR")            → "Tuition not listed"
 *   formatTuition(null,  "EUR", "chip")    → ""
 *   formatTuition(20000, "EUR", "long", "tr") → "EUR 20,000 / yıl"
 */
export function formatTuition(
  amount: string | number | null,
  currency: string,
  variant: TuitionVariant = "long",
  locale: Locale = "en",
): string {
  const notListed =
    locale === "tr" ? "Öğrenim ücreti belirtilmemiş" : "Tuition not listed";
  if (amount == null) {
    return variant === "chip" ? "" : notListed;
  }
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(num)) {
    return variant === "chip" ? "" : notListed;
  }

  const yr = locale === "tr" ? "yıl" : "yr";
  const year = locale === "tr" ? "yıl" : "year";

  const native =
    variant === "chip"
      ? `${Math.round(num).toLocaleString("en-GB")} ${currency}/${yr}`
      : variant === "short"
      ? `${currency} ${num.toLocaleString("en-GB")}/${yr}`
      : `${currency} ${num.toLocaleString("en-GB")} / ${year}`;

  const eur = eurEquivalent(num, currency);
  if (eur == null) return native;

  const eurLabel = `~€${eur.toLocaleString("en-GB")}`;
  return variant === "chip" ? `${native} · ${eurLabel}` : `${native} (${eurLabel})`;
}

/**
 * EUR equivalent rounded to a sensible step (nearest 100 for ≥10k,
 * nearest 10 for smaller amounts). Returns null when the currency is EUR
 * or has no rate in the table.
 */
export function eurEquivalent(amount: number, currency: string): number | null {
  if (currency === "EUR") return null;
  const rate = FX_TO_EUR[currency];
  if (!rate) return null;
  const raw = amount * rate;
  const step = raw >= 10000 ? 100 : 10;
  return Math.round(raw / step) * step;
}
