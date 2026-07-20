export const LOCALES = ["en", "tr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

// Locale preference is a cookie, not a URL segment — see ADR 0007.
export const LOCALE_COOKIE = "edfind_locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
