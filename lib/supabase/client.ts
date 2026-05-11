"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client (anon key). Use only when a Client Component
 * genuinely needs direct DB access (e.g. realtime subscriptions). Anything
 * involving secrets, writes to `profiles`/`matches`, or AI calls must go
 * through a Server Action that uses `lib/supabase/server.ts`.
 *
 * Env vars are referenced via direct property access (not a helper that uses
 * `process.env[name]`) because Next.js / Turbopack only inline NEXT_PUBLIC_*
 * variables into the client bundle when the access is statically analyzable.
 * Dynamic access reads `undefined` on the browser.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set both in Vercel project env vars (all environments) and redeploy.",
    );
  }
  return createBrowserClient(url, anonKey);
}
