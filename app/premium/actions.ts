"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { setPremiumState } from "@/lib/premium/premium";
import { getUser } from "@/lib/supabase/auth";

// Only allow same-site relative destinations — never an absolute URL.
const NextPathSchema = z
  .string()
  .regex(/^\/(?!\/)[\w\-/?=&%.]*$/)
  .catch("/quiz");

/**
 * Demo checkout: flips the Premium cookie and continues to the destination.
 * Deliberately reachable in production — the paywall is a presentation dummy
 * and this button stands in for a successful Stripe checkout (it says so in
 * the UI). When real billing lands, this action becomes "create checkout
 * session and redirect to Stripe".
 */
export async function activatePremiumDemo(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) redirect("/login?next=/premium");

  const next = NextPathSchema.parse(formData.get("next") ?? "/quiz");
  await setPremiumState(true);
  redirect(next);
}
