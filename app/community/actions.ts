"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setSubscriptionState } from "@/lib/community/subscription";
import { getUser } from "@/lib/supabase/auth";

const ToggleSchema = z.boolean();

/**
 * Dev/preview-only Server Action that flips the mock community subscription
 * cookie. It must NOT be reachable in production — there it would be a paywall
 * self-grant. Real entitlements arrive with Stripe (see ADR 0005), at which
 * point this is replaced by a database-backed check.
 */
export async function toggleSubscriptionAction(next: unknown): Promise<void> {
  // Fail closed in production regardless of any client call.
  if (process.env.VERCEL_ENV === "production") return;
  // Only a signed-in user (community reading is public since 2026-06-11,
  // so the toggle silently no-ops for signed-out visitors).
  const user = await getUser();
  if (!user) return;
  const parsed = ToggleSchema.parse(next);
  await setSubscriptionState(parsed);
  revalidatePath("/community");
}
