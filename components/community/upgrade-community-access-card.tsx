"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function UpgradeCommunityAccessCard({
  variant = "panel",
  message,
  ctaLabel,
  className,
}: {
  variant?: "panel" | "inline" | "input";
  message?: string;
  ctaLabel?: string;
  className?: string;
}) {
  const t = useTranslations("community.upgrade");

  if (variant === "input") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-dashed border-teal-200 bg-gradient-to-r from-teal-50/70 to-white px-4 py-3 text-sm",
          className,
        )}
      >
        <Lock className="size-4 shrink-0 text-teal-600" />
        <p className="flex-1 text-slate-600">
          {message ?? t("inputMessageDefault")}
        </p>
        <Link
          href="/premium"
          className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700"
        >
          <Sparkles className="size-3" />
          {t("goPremium")}
        </Link>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600",
          className,
        )}
      >
        <Lock className="size-3" />
        {message ?? t("inlineMessageDefault")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-teal-100/25 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            {t("panelHeading")}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {message ?? t("panelMessageDefault")}
          </p>
          <ul className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-teal-600">✓</span>
              {t("bullets.messageResponsibles")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-teal-600">✓</span>
              {t("bullets.joinGroupChats")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-teal-600">✓</span>
              {t("bullets.replyDiscussions")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-teal-600">✓</span>
              {t("bullets.detailedInsights")}
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/premium"
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
            >
              {ctaLabel ?? t("ctaDefault")}
            </Link>
            <p className="text-[11px] text-slate-500">
              {t("priceLine")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
