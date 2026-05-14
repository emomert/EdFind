import "server-only";

import { cookies } from "next/headers";

import type { SubscriptionState } from "./types";

/**
 * Community subscription mock — Stripe isn't wired yet, so we use a cookie
 * as a stand-in for "this user is on the paid community plan". Read on the
 * server, flipped via the `toggleSubscription` Server Action. When real
 * billing arrives, replace this module with the actual entitlement check
 * (likely `profiles.tier IN ('partner', 'full')`).
 */
export const SUBSCRIPTION_COOKIE = "edfind_community_subscribed";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getSubscriptionState(): Promise<SubscriptionState> {
  const store = await cookies();
  const value = store.get(SUBSCRIPTION_COOKIE)?.value;
  return { isSubscribed: value === "true" };
}

export async function setSubscriptionState(isSubscribed: boolean): Promise<void> {
  const store = await cookies();
  store.set(SUBSCRIPTION_COOKIE, isSubscribed ? "true" : "false", {
    httpOnly: false, // readable from client for instant UI sync via toggle
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
