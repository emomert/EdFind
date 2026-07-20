"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.languageSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
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
          aria-pressed={locale === code}
          aria-label={t(code)}
          disabled={isPending}
          className={cn(
            "rounded-full px-2 py-1 uppercase transition-colors",
            locale === code
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
