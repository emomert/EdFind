import { NextResponse } from "next/server";
import { z } from "zod";

import { getUser } from "@/lib/supabase/auth";
import {
  getUniversityVerification,
  requestUniversityVerification,
} from "@/lib/verification/server";

/**
 * University email verification API.
 *
 *   GET  → current verification state for the signed-in user
 *   POST → request a verification email for { email }
 *
 * Confirmation happens on /verify-university-email (link in the email).
 */

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

/** Map domain-logic errors to HTTP statuses. */
const ERROR_STATUS: Record<string, number> = {
  "invalid-email": 422,
  "free-mail": 422,
  "not-academic": 422,
  "already-verified": 409,
  cooldown: 429,
  "send-failed": 502, // upstream mailer failure
  "storage-failed": 500, // our DB write failed
};

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const verification = await getUniversityVerification(user.id);
  return NextResponse.json({ verification });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // Unparseable body → same "invalid-email" contract (422) as a failed
    // schema check, so the client sees one consistent validation status.
    return NextResponse.json({ error: "invalid-email" }, { status: 422 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-email" }, { status: 422 });
  }

  const origin = new URL(request.url).origin;
  const result = await requestUniversityVerification(
    user.id,
    parsed.data.email,
    origin,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: ERROR_STATUS[result.error] ?? 400 },
    );
  }

  if (result.delivery === "dev-link") {
    return NextResponse.json({
      status: "dev-link",
      email: result.email,
      confirmUrl: result.confirmUrl,
    });
  }
  return NextResponse.json({ status: "sent", email: result.email });
}
