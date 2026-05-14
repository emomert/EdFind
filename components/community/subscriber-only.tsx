"use client";

import { useSubscription } from "./subscription-context";

/**
 * Wraps content that's only accessible to paid users. Free users see the
 * fallback. The same shape will work when we wire real entitlements via
 * Stripe + profiles.tier: this component reads from context, the context's
 * value comes from the server (cookie now, DB later).
 */
export function SubscriberOnly({
  fallback,
  children,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isSubscribed } = useSubscription();
  return <>{isSubscribed ? children : fallback}</>;
}
