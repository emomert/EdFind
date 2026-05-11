import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Attach any anonymous rows for this client_id to the now-signed-in user_id.
 *
 * Runs on every successful OAuth callback. Idempotent: if a callback fires
 * twice, the second run finds no rows with null user_id and is a no-op.
 *
 * Scope: profiles, matches, saved_programs, applications. Only rows with
 * `user_id IS NULL` are touched — never overwrites existing user_id
 * assignments (defence in depth against a user impersonating someone
 * else's client_id).
 */
export async function attachAnonymousRowsToUser(
  clientId: string,
  userId: string,
): Promise<void> {
  if (!clientId || !userId) return;

  const supabase = createServiceClient();

  await supabase
    .from("profiles")
    .update({ user_id: userId })
    .eq("client_id", clientId)
    .is("user_id", null);

  await supabase
    .from("saved_programs")
    .update({ user_id: userId })
    .eq("client_id", clientId)
    .is("user_id", null);

  await supabase
    .from("applications")
    .update({ user_id: userId })
    .eq("client_id", clientId)
    .is("user_id", null);

  // matches doesn't have its own client_id — its user_id mirrors the parent
  // profile, so update by profile_id IN (profiles for this client_id).
  const profileIdsRes = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", clientId);
  const profileIds = (profileIdsRes.data ?? []).map((r) => r.id as string);
  if (profileIds.length > 0) {
    await supabase
      .from("matches")
      .update({ user_id: userId })
      .in("profile_id", profileIds)
      .is("user_id", null);
  }
}
