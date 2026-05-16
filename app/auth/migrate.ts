import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Attach any anonymous rows for this client_id to the now-signed-in user_id.
 *
 * Delegates to the `attach_anon_rows_to_user` SQL function so all four UPDATEs
 * run in a single transaction — a partial failure now rolls back instead of
 * leaving a half-migrated user.
 *
 * Idempotent: the function only touches rows with null user_id, so a duplicate
 * callback (e.g. the user refreshing during OAuth) is a no-op.
 *
 * Throws on failure. The caller (`app/auth/callback/route.ts`) catches and
 * logs — sign-in should not be blocked by a migration error, but the failure
 * must be visible in logs rather than silently swallowed.
 */
export async function attachAnonymousRowsToUser(
  clientId: string,
  userId: string,
): Promise<void> {
  if (!clientId || !userId) return;

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("attach_anon_rows_to_user", {
    p_client_id: clientId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`attach_anon_rows_to_user failed: ${error.message}`);
  }
}
