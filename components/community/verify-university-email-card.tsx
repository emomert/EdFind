"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

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

// Maps the API's error codes to keys under community.verify.errors.
const ERROR_KEYS: Record<string, string> = {
  "invalid-email": "invalidEmail",
  "free-mail": "freeMail",
  "not-academic": "notAcademic",
  "already-verified": "alreadyVerified",
  cooldown: "cooldown",
  "send-failed": "sendFailed",
  "storage-failed": "storageFailed",
  unauthorized: "unauthorized",
  network: "network",
};

export function VerifyUniversityEmailCard({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "input";
}) {
  const { verification } = useVerification();
  const t = useTranslations("community.verify");
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
            {t("verifiedHeading")}
          </h3>
        </div>
        <p className="mt-2 break-all text-xs text-slate-600">
          {verification.email}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {t("verifiedBody")}
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
            {t.rich("sentBody", {
              email: sentState.email,
              strong: (chunks) => (
                <strong className="break-all">{chunks}</strong>
              ),
            })}
          </p>
        </div>
      ) : phase.kind === "dev-link" ? (
        <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-700">
            {t("devModeLabel")}
          </p>
          <p className="mt-1 text-xs text-amber-900">
            {t.rich("devLinkFor", {
              email: phase.email,
              strong: (chunks) => (
                <strong className="break-all">{chunks}</strong>
              ),
            })}
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
            placeholder={t("emailPlaceholder")}
            aria-label={t("emailAriaLabel")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          {phase.kind === "error" && (
            <p role="alert" className="text-xs text-rose-600">
              {t(`errors.${ERROR_KEYS[phase.code] ?? "network"}`)}
            </p>
          )}
          {verification.status === "expired" && phase.kind === "idle" && (
            <p className="text-xs text-amber-700">
              {t("expiredNotice")}
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
            {phase.kind === "submitting" ? t("sending") : t("sendButton")}
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
          {t("resend")}
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
            {t("inputVariantNotice")}
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
          {t("sidebarHeading")}
        </h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {t("sidebarBody")}
      </p>
      {body}
    </motion.section>
  );
}
