"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Loader2, MailCheck, ShieldCheck } from "lucide-react";

import { useVerification } from "./verification-context";

/**
 * Request-a-verification-link card. Two variants:
 *   - "sidebar": full card in the community sidebar
 *   - "input":   compact strip replacing the chat composer for unverified
 *                subscribers (mirrors UpgradeCommunityAccessCard's role)
 *
 * Talks to POST /api/university-email. When no mail provider is configured
 * the API returns the confirmation link directly ("dev-link") and we render
 * it inline — same dev-first spirit as the subscription toggle (ADR 0004).
 */

type Phase =
  | { kind: "idle" }
  | { kind: "form" } // user explicitly reopened the form from the sent state
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "dev-link"; email: string; confirmUrl: string }
  | { kind: "error"; code: string };

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-email": "That doesn't look like a valid email address.",
  "free-mail":
    "Personal providers (Gmail, Outlook, …) don't count — use your university address.",
  "not-academic":
    "We couldn't recognise this as a university domain. Double-check the address.",
  "already-verified": "Your account already has a verified university email.",
  cooldown:
    "We just sent you a link — wait a couple of minutes before requesting another.",
  "send-failed": "We couldn't send the email right now. Please try again.",
  "storage-failed": "Something went wrong saving your request. Please try again.",
  unauthorized: "Please sign in again, then retry.",
  network: "Network error — please try again.",
};

export function VerifyUniversityEmailCard({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "input";
}) {
  const { verification } = useVerification();
  const [email, setEmail] = useState(
    verification.status === "expired" ? verification.email : "",
  );
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const submit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setPhase({ kind: "submitting" });
    try {
      const response = await fetch("/api/university-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as {
        status?: string;
        email?: string;
        confirmUrl?: string;
        error?: string;
      };
      if (!response.ok) {
        setPhase({ kind: "error", code: data.error ?? "network" });
        return;
      }
      if (data.status === "dev-link" && data.confirmUrl) {
        setPhase({
          kind: "dev-link",
          email: data.email ?? trimmed,
          confirmUrl: data.confirmUrl,
        });
        return;
      }
      setPhase({ kind: "sent", email: data.email ?? trimmed });
    } catch {
      setPhase({ kind: "error", code: "network" });
    }
  };

  // Verified accounts only see the badge (the sidebar keeps it as a status
  // card; the input variant is never rendered for them — the composer is).
  if (verification.status === "verified") {
    if (variant === "input") return null;
    return (
      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-4 text-emerald-600" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">
            Verified student
          </h3>
        </div>
        <p className="mt-2 break-all text-xs text-slate-600">
          {verification.email}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          You can chat, review, and ask questions across the community.
        </p>
      </section>
    );
  }

  const sentState =
    phase.kind === "sent"
      ? { email: phase.email }
      : phase.kind === "idle" && verification.status === "pending"
      ? { email: verification.email }
      : null;

  const body = (
    <>
      {sentState ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-teal-50 px-3 py-2.5">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
          <p className="text-xs leading-relaxed text-teal-900">
            We emailed a confirmation link to{" "}
            <strong className="break-all">{sentState.email}</strong>. It&apos;s
            valid for 24 hours — check your inbox (and spam).
          </p>
        </div>
      ) : phase.kind === "dev-link" ? (
        <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-700">
            Dev mode — email sending not configured
          </p>
          <p className="mt-1 text-xs text-amber-900">
            Confirmation link for{" "}
            <strong className="break-all">{phase.email}</strong>:
          </p>
          <a
            href={phase.confirmUrl}
            className="mt-1 inline-block break-all text-xs font-medium text-teal-700 underline underline-offset-2"
          >
            {phase.confirmUrl}
          </a>
        </div>
      ) : (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(email);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@university.edu"
            aria-label="University email address"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          {phase.kind === "error" && (
            <p role="alert" className="text-xs text-rose-600">
              {ERROR_MESSAGES[phase.code] ?? ERROR_MESSAGES.network}
            </p>
          )}
          {verification.status === "expired" && phase.kind === "idle" && (
            <p className="text-xs text-amber-700">
              Your previous link expired — request a new one.
            </p>
          )}
          <button
            type="submit"
            disabled={phase.kind === "submitting"}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            {phase.kind === "submitting" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="size-3.5" aria-hidden />
            )}
            {phase.kind === "submitting"
              ? "Sending link…"
              : "Send confirmation link"}
          </button>
        </form>
      )}
      {sentState && (
        <button
          type="button"
          onClick={() => {
            // Reopen the form prefilled — resend (after the cooldown) or
            // switch to a different address.
            setEmail(sentState.email);
            setPhase({ kind: "form" });
          }}
          className="mt-2 text-[11px] font-medium text-teal-700 underline-offset-2 hover:underline"
        >
          Resend or use a different address
        </button>
      )}
    </>
  );

  if (variant === "input") {
    return (
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/60 p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-teal-600" aria-hidden />
          <p className="text-xs font-medium text-slate-800">
            Only verified students can send messages — confirm your university
            email to join the conversation.
          </p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/60 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-teal-600" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Become a verified student
        </h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Everyone can read the community. To write — chat, reviews, questions —
        confirm a university email address linked to your account.
      </p>
      {body}
    </motion.section>
  );
}
