"use client";

import { useOptimistic, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const [optimisticLocale, setOptimisticLocale] = useOptimistic(locale);
  const t = useTranslations("common.languageSwitcher");
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      setOptimisticLocale(next);
      await setLocale(next);
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5 text-xs font-medium"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          aria-pressed={optimisticLocale === code}
          aria-label={t(code)}
          disabled={isPending}
          className={cn(
            "rounded-full px-2 py-1 uppercase transition-colors",
            optimisticLocale === code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
