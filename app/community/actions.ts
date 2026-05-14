"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setSubscriptionState } from "@/lib/community/subscription";

const ToggleSchema = z.boolean();

/**
 * Dev-only Server Action that flips the mock community subscription cookie.
 * Replace this when Stripe is wired and entitlements live in the database.
 */
export async function toggleSubscriptionAction(next: unknown): Promise<void> {
  const parsed = ToggleSchema.parse(next);
  await setSubscriptionState(parsed);
  revalidatePath("/community");
}
