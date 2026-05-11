import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current authenticated user, or null if the request is
 * unauthenticated. Use this when a page renders different content for guests
 * and signed-in users.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

/**
 * Returns the current authenticated user, or redirects to /login if none.
 * Use this in Server Components and Server Actions that require auth.
 * The destination is preserved as `?next=...` so the login flow can bring
 * the user back where they tried to go.
 */
export async function requireUser(currentPath: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }
  return user;
}
