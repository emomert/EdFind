import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import type { UniversityVerification } from "./types";
import {
  checkAcademicDomain,
  emailDomain,
  websiteToDomain,
} from "./academic-domains";

/**
 * University email verification — server-side core.
 *
 * All writes to `university_email_verifications` happen here with the
 * service-role client (the table has no client write policies; see the
 * migration). Spec: docs/features/university-verification.md.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // confirmation links last 24h
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // min gap per requester
const DAY_MS = 24 * 60 * 60 * 1000;
const PER_EMAIL_COOLDOWN_MS = 10 * 60 * 1000; // min gap to one inbox
const PER_EMAIL_DAILY_CAP = 3; // max sends to one inbox / 24h (any requester)

const TABLE = "university_email_verifications";
const SEND_LOG = "verification_email_sends";

type VerificationRow = {
  email: string;
  domain: string;
  status: "pending" | "verified";
  created_at: string;
  expires_at: string;
  verified_at: string | null;
};

export type { UniversityVerification } from "./types";

export type RequestVerificationResult =
  | { ok: true; delivery: "email"; email: string }
  | { ok: true; delivery: "dev-link"; email: string; confirmUrl: string }
  | {
      ok: false;
      error:
        | "invalid-email"
        | "free-mail"
        | "not-academic"
        | "already-verified"
        | "cooldown"
        | "send-failed"
        | "storage-failed";
    };

export type ConfirmVerificationResult =
  | { ok: true; email: string; alreadyVerified: boolean }
  | { ok: false; error: "invalid" | "expired" | "conflict" };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Canonical public origin for emailed links. Prefers an explicit env var,
 * then Vercel's production URL, and only falls back to the request origin in
 * local dev — so security-sensitive links never depend on an attacker-
 * controllable Host header on a deployed environment.
 */
function resolveSiteUrl(requestOrigin: string): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return requestOrigin;
}

/** Current verification state for a user — verified beats pending. */
export async function getUniversityVerification(
  userId: string,
): Promise<UniversityVerification> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("email, domain, status, created_at, expires_at, verified_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return { status: "none" };

  const rows = data as VerificationRow[];
  const verified = rows.find((row) => row.status === "verified");
  if (verified) {
    return {
      status: "verified",
      email: verified.email,
      domain: verified.domain,
      verifiedAt: verified.verified_at,
    };
  }

  const pending = rows[0];
  if (new Date(pending.expires_at).getTime() < Date.now()) {
    return { status: "expired", email: pending.email, domain: pending.domain };
  }
  return {
    status: "pending",
    email: pending.email,
    domain: pending.domain,
    requestedAt: pending.created_at,
  };
}

/** Academic domains of every university in the catalog (live, not baked). */
async function getCatalogDomains(): Promise<Set<string>> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("universities").select("website");
  const domains = new Set<string>();
  for (const row of data ?? []) {
    const domain = websiteToDomain((row as { website: string | null }).website);
    if (domain) domains.add(domain);
  }
  return domains;
}

/** Per-recipient throttle: cap unsolicited mail to any one inbox. */
async function recipientThrottled(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
): Promise<boolean> {
  const dayAgo = new Date(Date.now() - DAY_MS).toISOString();
  const { data } = await supabase
    .from(SEND_LOG)
    .select("sent_at")
    .eq("email_lower", email)
    .gte("sent_at", dayAgo)
    .order("sent_at", { ascending: false });
  const recent = data ?? [];
  if (recent.length >= PER_EMAIL_DAILY_CAP) return true;
  const last = recent[0]?.sent_at;
  return Boolean(
    last && Date.now() - new Date(last).getTime() < PER_EMAIL_COOLDOWN_MS,
  );
}

export async function requestUniversityVerification(
  userId: string,
  rawEmail: string,
  requestOrigin: string,
): Promise<RequestVerificationResult> {
  const email = rawEmail.trim().toLowerCase();
  const domain = emailDomain(email);
  if (!domain) return { ok: false, error: "invalid-email" };

  const academic = checkAcademicDomain(domain, await getCatalogDomains());
  if (!academic.ok) {
    return {
      ok: false,
      error: academic.reason === "free-mail" ? "free-mail" : "not-academic",
    };
  }

  const supabase = createServiceClient();

  // One verified email per user.
  const { data: existing } = await supabase
    .from(TABLE)
    .select("status, created_at, email")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = (existing ?? []) as Pick<
    VerificationRow,
    "status" | "created_at" | "email"
  >[];
  if (rows.some((row) => row.status === "verified")) {
    return { ok: false, error: "already-verified" };
  }

  // A university email can only ever verify a single account. Exact match on
  // the already-lower-cased address — NOT .ilike(): `%` and `_` are valid
  // email local-part characters and would otherwise act as LIKE wildcards.
  const { data: taken } = await supabase
    .from(TABLE)
    .select("id")
    .eq("status", "verified")
    .eq("email", email)
    .limit(1);
  if (taken && taken.length > 0) {
    // Privacy: never disclose that this address already belongs to ANOTHER
    // account (cross-user enumeration), and never email the third party.
    // Return the same shape as a normal send. The partial unique index on
    // lower(email) where status='verified' still prevents double
    // verification at confirm time (surfaces as a 'conflict' there).
    return { ok: true, delivery: "email", email };
  }

  // Per-requester cooldown — don't let a stuck user hammer the mailer.
  const newestPending = rows.find((row) => row.status === "pending");
  if (
    newestPending &&
    Date.now() - new Date(newestPending.created_at).getTime() <
      RESEND_COOLDOWN_MS
  ) {
    return { ok: false, error: "cooldown" };
  }

  // Per-recipient throttle — independent of the requester, so spinning up
  // extra accounts can't email-bomb a victim's inbox.
  if (await recipientThrottled(supabase, email)) {
    return { ok: false, error: "cooldown" };
  }

  // Invalidate any previous pending links — the newest request wins. The
  // partial unique index on (user_id) where status='pending' keeps this to
  // a single row even under a concurrent double-submit (the loser's insert
  // fails and is reported as storage-failed).
  await supabase
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("status", "pending");

  const token = randomBytes(32).toString("base64url");
  const confirmUrl = `${resolveSiteUrl(requestOrigin)}/verify-university-email?token=${token}`;
  const { error: insertError } = await supabase.from(TABLE).insert({
    user_id: userId,
    email,
    domain,
    token_hash: hashToken(token),
    status: "pending",
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  if (insertError) {
    return { ok: false, error: "storage-failed" };
  }

  const result = await sendEmail(buildConfirmationEmail(email, confirmUrl));

  if (result.sent) {
    // Best-effort throttle bookkeeping (append-only; never deleted).
    await supabase.from(SEND_LOG).insert({ email_lower: email });
    return { ok: true, delivery: "email", email };
  }

  // Dev/local fallback: surface the confirm link directly so the flow is
  // testable when the mailer is unconfigured OR when Resend's testing mode
  // rejects a recipient that isn't the account owner. This must NEVER run in
  // production — handing the confirm link back to the requester would let
  // anyone verify an email they don't own (see ADR 0004). `next dev` has
  // NODE_ENV !== "production"; every Vercel deploy (preview + prod) sets
  // NODE_ENV=production, so deployed environments always require real email.
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, delivery: "dev-link", email, confirmUrl };
  }

  // Hard failure in production: undo the pending row we just wrote so the
  // user isn't stranded behind the cooldown with a link that was never sent.
  await supabase
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("status", "pending");
  return { ok: false, error: "send-failed" };
}

export async function confirmUniversityVerification(
  token: string,
): Promise<ConfirmVerificationResult> {
  if (!token || token.length > 128) return { ok: false, error: "invalid" };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from(TABLE)
    .select("id, email, status, expires_at")
    .eq("token_hash", hashToken(token))
    .limit(1);

  const row = (data ?? [])[0] as
    | { id: string; email: string; status: string; expires_at: string }
    | undefined;
  if (!row) return { ok: false, error: "invalid" };

  if (row.status === "verified") {
    return { ok: true, email: row.email, alreadyVerified: true };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    // Unique-index race: this email or user got verified elsewhere first.
    return { ok: false, error: "conflict" };
  }
  if (!updated || updated.length === 0) {
    // The pending row was replaced by a newer request (or already consumed)
    // between the SELECT and the UPDATE — nothing was verified.
    return { ok: false, error: "invalid" };
  }
  return { ok: true, email: row.email, alreadyVerified: false };
}

function buildConfirmationEmail(email: string, confirmUrl: string) {
  const subject = "Confirm your university email — EdFind";
  const text = [
    "Hi,",
    "",
    `You asked to link ${email} to your EdFind account as your university email.`,
    "Open this link to confirm (valid for 24 hours):",
    "",
    confirmUrl,
    "",
    "Once confirmed you can write in the EdFind community — chat, reviews, and questions.",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");

  const html = `
  <div style="font-family: Inter, -apple-system, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Confirm your university email</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      You asked to link <strong style="color:#0f172a;">${email}</strong> to your
      EdFind account as your university email. Confirming unlocks writing in the
      EdFind community — chat, reviews, and questions.
    </p>
    <p style="margin: 24px 0;">
      <a href="${confirmUrl}"
         style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px;">
        Confirm university email
      </a>
    </p>
    <p style="font-size: 12px; line-height: 1.6; color: #94a3b8;">
      The link is valid for 24 hours. If the button doesn't work, copy this URL:
      <br />
      <a href="${confirmUrl}" style="color: #0d9488; word-break: break-all;">${confirmUrl}</a>
      <br /><br />
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;

  return { to: email, subject, html, text };
}
