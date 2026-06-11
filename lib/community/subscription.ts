import "server-only";

import type { SubscriptionState } from "./types";
import { getPremiumState, setPremiumState } from "@/lib/premium/premium";

/**
 * Community subscription = the Premium tier (unified 2026-06-11; see
 * lib/premium/premium.ts). Kept as a thin delegate so community code can
 * keep asking "is this user subscribed?" without caring what the
 * entitlement is called this quarter.
 */
export async function getSubscriptionState(): Promise<SubscriptionState> {
  const { isPremium } = await getPremiumState();
  return { isSubscribed: isPremium };
}

export async function setSubscriptionState(
  isSubscribed: boolean,
): Promise<void> {
  await setPremiumState(isSubscribed);
}
