"use client";

import { useTranslations } from "next-intl";

import { LOCALES } from "@/lib/i18n/config";
import { useLocaleTransition } from "@/components/i18n/locale-transition";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const t = useTranslations("common.languageSwitcher");
  const { isSwitching, activeLocale, switchLocale } = useLocaleTransition();

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
          onClick={() => switchLocale(code)}
          aria-pressed={activeLocale === code}
          aria-label={t(code)}
          disabled={isSwitching}
          className={cn(
            "rounded-full px-2 py-1 uppercase transition-colors",
            activeLocale === code
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
