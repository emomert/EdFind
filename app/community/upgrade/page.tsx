import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

import { requireUser } from "@/lib/supabase/auth";
import { COMMUNITY_ENABLED } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Upgrade — Community",
  description:
    "Full access to EdFind's verified student community is coming soon.",
};

// Honest scope (2026-06-11 feedback): the subscription's one real perk today
// is direct messaging with campus responsibles. Reading the community is open
// to everyone, and writing (chat, reviews, questions) is unlocked by verifying
// a university email — not by paying.
const PERKS = [
  "Message campus responsibles directly — get first-hand answers about the university you're targeting",
];

/**
 * Interim upgrade page. The community subscription is mock-only until Stripe
 * is wired (see ADR 0005). This page replaces the dead /community/upgrade link
 * the previous CTAs pointed at, so the conversion button no longer 404s.
 */
export default async function CommunityUpgradePage() {
  if (!COMMUNITY_ENABLED) notFound();
  await requireUser("/community/upgrade");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Community
      </Link>

      <div className="relative mt-6 overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6 shadow-sm sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-teal-100/25 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 shadow-sm ring-1 ring-inset ring-teal-200">
            <Sparkles className="size-3.5" />
            Coming soon
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Full Community access is on the way
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Paid subscriptions aren&apos;t live just yet. We&apos;re putting the
            finishing touches on billing — once it ships, you&apos;ll be able to
            unlock everything below from{" "}
            <span className="font-semibold text-slate-800">€1.99/month</span>,
            cancellable any time.
          </p>

          <ul className="mt-6 grid gap-2 text-sm text-slate-700">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                {perk}
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-xl text-xs text-slate-500">
            Everything else is already free: anyone can read the community, and
            verifying a university email unlocks writing — chat, reviews, and
            questions.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/community">Explore the free previews</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/catalog">Browse the catalog</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Want to be notified when it launches? Verify your university email on
            the Community page — verified students hear first.
          </p>
        </div>
      </div>
    </div>
  );
}
