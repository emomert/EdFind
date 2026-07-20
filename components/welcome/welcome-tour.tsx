"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  MessageSquareText,
  MessagesSquare,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APPLICATIONS_ENABLED, COMMUNITY_ENABLED } from "@/lib/feature-flags";

/**
 * First-visit welcome tour (spec: docs/features/welcome-tour.md).
 *
 * A modal carousel that walks new visitors through what EdFind can do,
 * one cute box per ability, with part-by-part progress. Auto-opens once
 * per browser for signed-out visitors on the homepage; ANY dismissal
 * (skip, ✕, backdrop, Esc, finishing) marks it seen so it never nags.
 * The hero's "Take the quick tour" link replays it via a window event.
 */

const STORAGE_KEY = "edfind_welcome_tour_seen_v1";
const OPEN_EVENT = "edfind:welcome-tour:open";

export type WelcomeTourTotals = {
  universities: number;
  programs: number;
  countries: number;
};

type Accent = "teal" | "sky" | "violet" | "amber" | "rose" | "emerald";

/** Static class maps — Tailwind can't see dynamically built class names. */
const ACCENTS: Record<Accent, { box: string; chip: string; badge: string }> = {
  teal: {
    box: "from-teal-50 via-white to-emerald-50/70",
    chip: "bg-teal-100 text-teal-700",
    badge: "border-teal-200 bg-teal-50 text-teal-700",
  },
  sky: {
    box: "from-sky-50 via-white to-cyan-50/70",
    chip: "bg-sky-100 text-sky-700",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
  },
  violet: {
    box: "from-violet-50 via-white to-purple-50/70",
    chip: "bg-violet-100 text-violet-700",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
  },
  amber: {
    box: "from-amber-50 via-white to-orange-50/70",
    chip: "bg-amber-100 text-amber-700",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  rose: {
    box: "from-rose-50 via-white to-pink-50/70",
    chip: "bg-rose-100 text-rose-700",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
  },
  emerald: {
    box: "from-emerald-50 via-white to-teal-50/70",
    chip: "bg-emerald-100 text-emerald-700",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

type TourStep = {
  key: string;
  /** Lucide icon for the step box; `null` renders the brand mark instead. */
  icon: LucideIcon | null;
  accent: Accent;
  badge: string;
  title: string;
  description: string;
};

function markSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Private mode / blocked storage — the tour will simply show again.
  }
}

function hasSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true; // can't remember a dismissal → don't auto-open at all
  }
}

export function WelcomeTour({
  totals,
  isAuthed,
}: {
  totals: WelcomeTourTotals;
  isAuthed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const backdropPointerDown = useRef(false);
  const reduceMotion = useReducedMotion();
  const t = useTranslations("home");

  const steps = useMemo<TourStep[]>(() => {
    const list: TourStep[] = [
      {
        key: "welcome",
        icon: null,
        accent: "teal",
        badge: t("welcomeTour.steps.welcome.badge"),
        title: t("welcomeTour.steps.welcome.title"),
        description: t("welcomeTour.steps.welcome.description"),
      },
      {
        key: "quiz",
        icon: GraduationCap,
        accent: "sky",
        badge: t("welcomeTour.steps.quiz.badge"),
        title: t("welcomeTour.steps.quiz.title"),
        description: t("welcomeTour.steps.quiz.description"),
      },
      {
        key: "search",
        icon: MessageSquareText,
        accent: "violet",
        badge: t("welcomeTour.steps.search.badge"),
        title: t("welcomeTour.steps.search.title"),
        description: t("welcomeTour.steps.search.description"),
      },
      {
        key: "catalog",
        icon: LayoutGrid,
        accent: "amber",
        badge: t("welcomeTour.steps.catalog.badge"),
        title: t("welcomeTour.steps.catalog.title"),
        description: t("welcomeTour.steps.catalog.description"),
      },
      {
        key: "shortlist",
        icon: Bookmark,
        accent: "rose",
        badge: t("welcomeTour.steps.shortlist.badge"),
        title: t("welcomeTour.steps.shortlist.title"),
        description: t("welcomeTour.steps.shortlist.description"),
      },
    ];
    if (APPLICATIONS_ENABLED) {
      list.push({
        key: "applications",
        icon: ClipboardList,
        accent: "emerald",
        badge: t("welcomeTour.steps.applications.badge"),
        title: t("welcomeTour.steps.applications.title"),
        description: t("welcomeTour.steps.applications.description"),
      });
    }
    if (COMMUNITY_ENABLED) {
      list.push({
        key: "community",
        icon: MessagesSquare,
        accent: "teal",
        badge: t("welcomeTour.steps.community.badge"),
        title: t("welcomeTour.steps.community.title"),
        description: t("welcomeTour.steps.community.description"),
      });
    }
    list.push({
      key: "cta",
      icon: Sparkles,
      accent: "sky",
      badge: t("welcomeTour.steps.cta.badge"),
      title: t("welcomeTour.steps.cta.title"),
      description: t("welcomeTour.steps.cta.description"),
    });
    return list;
  }, [t]);

  const dismiss = useCallback(() => {
    markSeen();
    setOpen(false);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex((current) => {
        const clamped = Math.max(0, Math.min(steps.length - 1, next));
        if (clamped !== current) setDirection(clamped > current ? 1 : -1);
        return clamped;
      });
    },
    [steps.length],
  );

  // Auto-open on first visit — signed-out visitors only. Signed-in users
  // already know the product; they can still replay via the hero link.
  useEffect(() => {
    if (isAuthed || hasSeen()) return;
    const timer = window.setTimeout(() => {
      // Re-check at fire time: the user may have replayed + dismissed the
      // tour while this timer was pending (any dismissal calls markSeen()),
      // and another overlay (e.g. the header search palette) may be up —
      // the tour itself isn't open yet, so any [role="dialog"] is not ours.
      if (hasSeen() || document.querySelector('[role="dialog"]')) return;
      setOpen(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isAuthed]);

  // Replay requests from <WelcomeTourReplayLink />.
  useEffect(() => {
    const onOpen = () => {
      setIndex(0);
      setDirection(1);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isLast = index === steps.length - 1;

  // Keyboard, capture phase so the tour (topmost layer, z-60) runs before
  // other global shortcuts like HeaderSearch's bubble-phase Ctrl+K (z-50):
  // Ctrl/Cmd+K is swallowed (the palette would open invisibly behind the
  // backdrop and steal focus), Esc closes only the tour, arrows navigate,
  // and Tab is trapped inside the dialog — aria-modal without a trap would
  // let focus escape under the dim layer.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        dismiss();
      } else if (event.key === "ArrowRight") {
        goTo(index + 1);
      } else if (event.key === "ArrowLeft") {
        goTo(index - 1);
      } else if (event.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([tabindex="-1"]), a[href]',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !root.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (active === last || !root.contains(active))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, index, dismiss, goTo]);

  // Move focus into the dialog on open; restore it on close (APG dialog
  // pattern) so Esc/Skip lands the user back on the replay link, not <body>.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    return () => {
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [open]);

  // Keep the Enter-to-advance flow alive: when "Next" unmounts on the final
  // step, move focus to the CTA so the keyboard journey ends on it.
  useEffect(() => {
    if (open && isLast) ctaRef.current?.focus();
  }, [open, isLast]);

  const step = steps[index];
  const accent = ACCENTS[step.accent];
  const StepIcon = step.icon;

  const slideVariants = {
    enter: (dir: 1 | -1) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 32 },
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -32 },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6"
          // Only dismiss when the pointer went DOWN on the backdrop too — a
          // text-selection drag that ends past the card edge must not
          // permanently mark the tour as seen.
          onPointerDown={(event) => {
            backdropPointerDown.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            if (
              backdropPointerDown.current &&
              event.target === event.currentTarget
            ) {
              dismiss();
            }
            backdropPointerDown.current = false;
          }}
        >
          <motion.div
            initial={
              reduceMotion ? { opacity: 0 } : { y: 24, opacity: 0, scale: 0.97 }
            }
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { y: 16, opacity: 0, scale: 0.98 }
            }
            transition={{ duration: 0.3, ease: [0.21, 0.6, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            ref={dialogRef}
            role="dialog"
            aria-modal
            aria-label={t("welcomeTour.dialogLabel")}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
          >
            {/* Part-by-part progress bar */}
            <div
              className="h-1 w-full bg-slate-100"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={index + 1}
            >
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: `${((index + 1) / steps.length) * 100}%` }}
                transition={{
                  duration: reduceMotion ? 0 : 0.3,
                  ease: "easeOut",
                }}
              />
            </div>

            <div className="flex items-center justify-between px-5 pt-4">
              <Image
                src="/logo.png"
                alt=""
                aria-hidden
                width={301}
                height={329}
                className="h-7 w-auto"
              />
              <button
                ref={closeRef}
                type="button"
                onClick={dismiss}
                aria-label={t("welcomeTour.skipAria")}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
              >
                {t("welcomeTour.skip")}
                <X className="size-3.5" aria-hidden />
              </button>
            </div>

            {/* aria-live persists across step swaps, so each newly mounted
                step's content is announced to screen readers. */}
            <div className="px-5 pb-2 pt-4 sm:px-7" aria-live="polite">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={step.key}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div
                    className={cn(
                      "rounded-3xl border border-border/60 bg-gradient-to-br p-6 text-center sm:p-8",
                      accent.box,
                    )}
                  >
                    {StepIcon ? (
                      <span
                        className={cn(
                          "mx-auto inline-flex size-14 items-center justify-center rounded-2xl",
                          accent.chip,
                        )}
                      >
                        <StepIcon className="size-7" aria-hidden />
                      </span>
                    ) : (
                      <Image
                        src="/logo.png"
                        alt=""
                        aria-hidden
                        width={301}
                        height={329}
                        className="mx-auto h-14 w-auto"
                      />
                    )}

                    <span
                      className={cn(
                        "mt-4 inline-block rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider",
                        accent.badge,
                      )}
                    >
                      {step.badge}
                    </span>

                    <p className="sr-only">
                      {t("welcomeTour.stepOfTotal", {
                        current: index + 1,
                        total: steps.length,
                      })}
                    </p>
                    <h2 className="mt-3 text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {step.title}
                    </h2>
                    <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>

                    {step.key === "welcome" && totals.universities > 0 && (
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <StatChip
                          value={totals.universities}
                          label={t("stats.universities")}
                        />
                        <StatChip
                          value={totals.programs}
                          label={t("stats.programs")}
                        />
                        <StatChip
                          value={totals.countries}
                          label={t("stats.countries")}
                        />
                      </div>
                    )}

                    {step.key === "cta" && (
                      <Link
                        href="/catalog"
                        onClick={dismiss}
                        className="mt-5 inline-block text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        {t("welcomeTour.browseCatalogLink")}
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-3 sm:px-7">
              {/* 24px hit targets (WCAG 2.5.8) around 8px visual dots — a
                  near-miss tap lands on the button, not the dismissing
                  backdrop. */}
              <div className="flex items-center" aria-hidden>
                {steps.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    tabIndex={-1}
                    onClick={() => goTo(i)}
                    className="flex min-h-6 min-w-6 items-center justify-center"
                  >
                    <span
                      className={cn(
                        "h-2 rounded-full transition-all motion-reduce:transition-none",
                        i === index
                          ? "w-5 bg-primary"
                          : "w-2 bg-slate-200 hover:bg-slate-300",
                      )}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => goTo(index - 1)}
                  >
                    <ArrowLeft aria-hidden />
                    {t("welcomeTour.back")}
                  </Button>
                )}
                {isLast ? (
                  <Button asChild size="sm">
                    <Link ref={ctaRef} href="/start" onClick={dismiss}>
                      {t("welcomeTour.cta")}
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => goTo(index + 1)}>
                    {t("welcomeTour.next")}
                    <ArrowRight aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full bg-white/80 px-3 py-1 text-xs ring-1 ring-border">
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

/** Small trigger that replays the tour — lives in the homepage hero. */
export function WelcomeTourReplayLink({ className }: { className?: string }) {
  const t = useTranslations("home");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {t("welcomeTour.replayLink")}
    </button>
  );
}
