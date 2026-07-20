"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}
