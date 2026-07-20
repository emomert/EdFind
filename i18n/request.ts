import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import en from "@/messages/en";
import tr from "@/messages/tr";

// Static imports (not a dynamic `import(locale)`) so Turbopack bundles both
// locales without special casing. Two locales × UI strings is small.
const MESSAGES = { en, tr } as const;

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return { locale, messages: MESSAGES[locale] };
});
