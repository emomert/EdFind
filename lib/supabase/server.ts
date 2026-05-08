import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  SUPABASE_ANON_KEY_ENV,
  SUPABASE_SERVICE_ROLE_KEY_ENV,
  SUPABASE_URL_ENV,
  requireEnv,
} from "./env";

/**
 * Cookie-bound Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the anon key — RLS applies. Auth state (when we add it)
 * flows through Next's cookie store.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv(SUPABASE_URL_ENV),
    requireEnv(SUPABASE_ANON_KEY_ENV),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't mutate cookies. The auth refresh happens
            // via middleware in a later phase — safe to ignore here.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for privileged server-side work: inserting profiles,
 * running matchers, seed scripts. **Never** import this from a Client
 * Component — `import "server-only"` will throw at bundle time if you do.
 */
export function createServiceClient() {
  return createSupabaseClient(
    requireEnv(SUPABASE_URL_ENV),
    requireEnv(SUPABASE_SERVICE_ROLE_KEY_ENV),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
