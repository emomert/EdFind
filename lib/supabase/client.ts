"use client";

import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY_ENV, SUPABASE_URL_ENV, requireEnv } from "./env";

/**
 * Browser-side Supabase client (anon key). Use only when a Client Component
 * genuinely needs direct DB access (e.g. realtime subscriptions). Anything
 * involving secrets, writes to `profiles`/`matches`, or AI calls must go
 * through a Server Action that uses `lib/supabase/server.ts`.
 */
export function createClient() {
  return createBrowserClient(
    requireEnv(SUPABASE_URL_ENV),
    requireEnv(SUPABASE_ANON_KEY_ENV),
  );
}
