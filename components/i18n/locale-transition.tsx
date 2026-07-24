"use client";

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";

import { type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

/**
 * Shared state for the language switch, so the header pill and the page-body
 * fade react to the *same* transition. The locale is still server-authoritative
 * (cookie + full re-render — see ADR 0007); this only makes the ~1s re-render
 * feel deliberate instead of laggy.
 *
 * `switchLocale` runs the cookie-setting Server Action inside a transition, so
 * `isSwitching` stays true for exactly the window Next.js takes to re-render
 * the current route in the new locale. No `router.refresh()` needed — invoking
 * the action already revalidates the route.
 */
type LocaleTransitionValue = {
  isSwitching: boolean;
  /** Locale to reflect in the control now — the target while switching. */
  activeLocale: Locale;
  switchLocale: (next: Locale) => void;
};

const LocaleTransitionContext = createContext<LocaleTransitionValue | null>(null);

export function LocaleTransitionProvider({ children }: { children: ReactNode }) {
  const locale = useLocale() as Locale;
  const [isSwitching, startTransition] = useTransition();
  // Optimistic locale: shows the target during the transition, then reverts to
  // `locale` — which by then the server has re-rendered to the new value.
  const [activeLocale, setOptimisticLocale] = useOptimistic(locale);

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale || isSwitching) return;
      startTransition(async () => {
        setOptimisticLocale(next); // instant — drives the pill without waiting
        await setLocale(next);
      });
    },
    [locale, isSwitching, setOptimisticLocale],
  );

  return (
    <LocaleTransitionContext.Provider
      value={{ isSwitching, activeLocale, switchLocale }}
    >
      {children}
    </LocaleTransitionContext.Provider>
  );
}

export function useLocaleTransition(): LocaleTransitionValue {
  const value = useContext(LocaleTransitionContext);
  if (!value) {
    throw new Error(
      "useLocaleTransition must be used within a LocaleTransitionProvider",
    );
  }
  return value;
}

/**
 * Renders `<main>` and gently dims it while a language switch is in flight, so
 * the swap reads as a soft crossfade rather than a stall. Reduced-motion users
 * get the content update with no fade.
 */
export function LocaleFadeMain({ children }: { children: ReactNode }) {
  const { isSwitching } = useLocaleTransition();
  return (
    <main
      className={cn(
        "flex-1 transition-opacity duration-300 ease-out motion-reduce:transition-none",
        isSwitching ? "opacity-50" : "opacity-100",
      )}
      aria-busy={isSwitching}
    >
      {children}
    </main>
  );
}
