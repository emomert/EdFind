import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  SUPABASE_ANON_KEY_ENV,
  SUPABASE_URL_ENV,
} from "@/lib/supabase/env";

/**
 * Edge middleware.
 *
 * Two jobs:
 *
 *   1. Refresh the Supabase auth session cookie. Server Components can read
 *      cookies but cannot mutate them, so without this middleware the access
 *      token would never get refreshed for navigation-only sessions — the
 *      user would silently lose their session after the token expires.
 *
 *   2. Attach a baseline set of security headers (CSP, frame-options,
 *      referrer-policy, content-type-options, permissions-policy). CSP is
 *      intentionally permissive enough for Tailwind/Next inline styles and
 *      Supabase + DeepSeek API calls; tighten further if you add a nonce.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env[SUPABASE_URL_ENV];
  const supabaseAnonKey = process.env[SUPABASE_ANON_KEY_ENV];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // Triggers a refresh if the access token is close to expiry — the new
    // cookie ends up on `response` via the setAll handler above.
    await supabase.auth.getUser();
  }

  const headers = response.headers;
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  // CSP — permissive enough for Next/Tailwind/shadcn, locked enough to block
  // arbitrary remote scripts. img-src includes data: for inline favicons/SVGs
  // and https: for university logos. connect-src includes Supabase + DeepSeek
  // because some server-action error envelopes route fetch retries client-side.
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' https://*.supabase.co https://api.deepseek.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
  headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static assets)
     * - _next/image (image optimisation)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public folder files (anything with a file extension)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
