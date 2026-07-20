"use client";

import { motion } from "framer-motion";
import { GraduationCap, MessagesSquare, PenSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import { VerifiedWriterOnly } from "./verified-writer-only";

/**
 * "What can I do here?" cards shown at the top of /community (moved up from
 * the old sidebar, 2026-06-11 — new visitors should learn the page's two
 * write actions before scrolling the feed).
 */

/** Shared fallback for write CTAs when the account isn't verified yet. */
function VerifyToWriteNote({ action }: { action: string }) {
  const t = useTranslations("community.actionCards");
  return (
    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-center text-[11px] leading-relaxed text-slate-500">
      {t("verifyNote", { action })}
    </p>
  );
}

export function AskCommunityCard() {
  const t = useTranslations("community.actionCards");
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/60 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <MessagesSquare className="size-4 text-teal-600" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          {t("ask.heading")}
        </h3>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {t("ask.body")}
      </p>
      <VerifiedWriterOnly fallback={<VerifyToWriteNote action={t("askAction")} />}>
        <button
          type="button"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700"
        >
          <PenSquare className="size-3.5" />
          {t("ask.button")}
        </button>
      </VerifiedWriterOnly>
    </motion.section>
  );
}

export function ShareExperienceCard() {
  const t = useTranslations("community.actionCards");
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="size-4 text-emerald-600" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          {t("share.heading")}
        </h3>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {t("share.body")}
      </p>
      <VerifiedWriterOnly fallback={<VerifyToWriteNote action={t("shareAction")} />}>
        <button
          type="button"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
        >
          <PenSquare className="size-3.5" />
          {t("share.button")}
        </button>
      </VerifiedWriterOnly>
    </motion.section>
  );
}
