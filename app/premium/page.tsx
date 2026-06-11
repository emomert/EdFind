import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Crown,
  FileText,
  Kanban,
  MessageCircle,
  Sparkles,
  Wand2,
} from "lucide-react";

import { requireUser } from "@/lib/supabase/auth";
import { getPremiumState, PREMIUM_PRICE_LABEL } from "@/lib/premium/premium";
import { activatePremiumDemo } from "./actions";

export const metadata: Metadata = {
  title: "Go Premium — EdFind",
  description:
    "AI matching, application tracking, and direct access to campus responsibles — EdFind Premium.",
};

const FREE_FEATURES = [
  "Browse the full catalog — 58 universities, 196 programs",
  "University & program detail pages, housing costs, campus photos",
  "Read every community review, group, and question",
  "Write in the community with a verified university email",
];

const PREMIUM_FEATURES: Array<{
  icon: React.ReactNode;
  label: string;
}> = [
  {
    icon: <Wand2 className="size-4" />,
    label: "AI matching — the guided quiz and free-text AI search, with personalised rationales",
  },
  {
    icon: <Kanban className="size-4" />,
    label: "Application tracking — shortlist, compare, deadlines, and the task board",
  },
  {
    icon: <FileText className="size-4" />,
    label: "AI document studio — tailored CV and cover-letter drafts",
  },
  {
    icon: <MessageCircle className="size-4" />,
    label: "Message campus responsibles directly",
  },
];

/**
 * Presentation-stage paywall (see lib/premium/premium.ts). Premium-gated
 * pages redirect here with ?next=<path>; the activate button simulates a
 * successful checkout and continues to that destination.
 */
export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireUser("/premium");

  const { next: rawNext } = await searchParams;
  const next =
    rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : "/quiz";

  // Already premium? Straight through to where they were headed.
  const { isPremium } = await getPremiumState();
  if (isPremium) redirect(next);

  return (
    <div className="relative mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20">
          <Crown className="size-3.5" />
          EdFind Premium
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Unlock your matches
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
          AI matching, application tracking, and direct lines to students on
          campus — everything you need to go from &ldquo;somewhere in
          Europe&rdquo; to a submitted application.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {/* Free */}
        <section className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">Free</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore everything, decide later.
          </p>
          <p className="mt-4 text-3xl font-bold">€0</p>
          <ul className="mt-5 space-y-2.5 text-sm text-foreground/90">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-slate-400" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6">
            <Link
              href="/catalog"
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
            >
              Keep exploring on Free
            </Link>
          </div>
        </section>

        {/* Premium */}
        <section className="relative flex flex-col overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/60 p-6 shadow-lg sm:p-7">
          <div className="pointer-events-none absolute -right-14 -top-14 size-44 rounded-full bg-teal-100/40 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Premium</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <Sparkles className="size-3" />
                Recommended
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything in Free, plus the tools that get you admitted.
            </p>
            <p className="mt-4 text-3xl font-bold">
              {PREMIUM_PRICE_LABEL.split("/")[0]}
              <span className="text-base font-medium text-muted-foreground">
                /month · cancel any time
              </span>
            </p>
            <ul className="mt-5 space-y-3 text-sm text-foreground/90">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    {f.icon}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
            <form action={activatePremiumDemo} className="mt-7">
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                <BadgeCheck className="size-4" />
                Activate Premium &amp; continue
              </button>
            </form>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Demo mode: this button simulates a successful checkout. In the
              full version this is where secure payment happens.
            </p>
          </div>
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        The community stays open to everyone — reading needs no account, and a
        verified university email (not a subscription) unlocks writing.
      </p>
    </div>
  );
}
