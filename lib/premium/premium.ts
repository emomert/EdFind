import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Premium tier mock — the presentation-stage paywall (2026-06-11).
 *
 * Two tiers for now: Free (community; verified writing with an academic
 * email) and Premium at €5/month (AI matching, application tracking +
 * document studio, direct messages to campus responsibles). Stripe isn't
 * wired yet, so a cookie stands in for the entitlement; the /premium page
 * "activates" it via a button that simulates a successful checkout. When
 * billing lands this module becomes a database-backed check
 * (`profiles.tier`) and the cookie disappears.
 *
 * The community subscription helper (`lib/community/subscription.ts`)
 * delegates to this flag — one Premium, not two paid plans.
 */
export const PREMIUM_COOKIE = "edfind_premium";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const PREMIUM_PRICE_LABEL = "€5/month";

export type PremiumState = { isPremium: boolean };

export async function getPremiumState(): Promise<PremiumState> {
  const store = await cookies();
  return { isPremium: store.get(PREMIUM_COOKIE)?.value === "true" };
}

/**
 * Page guard for Premium-gated surfaces (quiz, search, applications,
 * shortlist, compare). Call AFTER requireUser — auth first, then tier.
 * Redirects to the paywall with the original destination preserved.
 */
export async function requirePremium(nextPath: string): Promise<void> {
  const { isPremium } = await getPremiumState();
  if (!isPremium) {
    redirect(`/premium?next=${encodeURIComponent(nextPath)}`);
  }
}

export async function setPremiumState(isPremium: boolean): Promise<void> {
  const store = await cookies();
  store.set(PREMIUM_COOKIE, isPremium ? "true" : "false", {
    httpOnly: false, // readable from client for instant UI sync via dev toggle
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
