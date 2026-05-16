import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import { attachAnonymousRowsToUser } from "@/app/auth/migrate";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

/**
 * Supabase Auth OAuth callback. Exchanges the auth code in the URL for a
 * session, then attaches any pre-existing anonymous rows tied to the user's
 * cookie client_id to the new user_id. Finally redirects to ?next= (validated)
 * or `/`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchange failed", error);
    return NextResponse.redirect(new URL("/login?error=exchange_failed", url));
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (userId) {
    const cookieStore = await cookies();
    const clientId = cookieStore.get(CLIENT_ID_COOKIE)?.value;
    if (clientId) {
      try {
        await attachAnonymousRowsToUser(clientId, userId);
      } catch (err) {
        // Migration failure shouldn't block sign-in — log and continue.
        console.error("[auth/callback] attach failed", err);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
