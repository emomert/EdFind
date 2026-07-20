"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles, GraduationCap, Target, Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { localizeCountry, localizeField } from "@/lib/i18n/data-labels";
import type { ApplicationItem, ProfileSummary } from "./types";
import { COUNTRY_NAMES, FIELD_LABELS, STATUS_PROGRESS_WEIGHT } from "./types";

function deriveTargetCountries(
  apps: ApplicationItem[],
  profile: ProfileSummary,
): string[] {
  const fromProfile = profile.destinations.filter((d) => d !== "ANY");
  if (fromProfile.length > 0) return fromProfile.slice(0, 5);
  const fromApps = Array.from(
    new Set(apps.map((a) => a.program.university.country)),
  );
  return fromApps.slice(0, 5);
}

type FieldOfInterest =
  | { kind: "field"; value: string }
  | { kind: "degree"; value: string };

function deriveFieldOfInterest(
  apps: ApplicationItem[],
  profile: ProfileSummary,
): FieldOfInterest | null {
  if (profile.fieldOfStudy) {
    const label = FIELD_LABELS[profile.fieldOfStudy];
    return label ? { kind: "field", value: label } : null;
  }
  // Fallback: most common degree word across applications.
  if (apps.length === 0) return null;
  const degrees = apps.map((a) => a.program.degree).filter(Boolean);
  if (degrees.length === 0) return null;
  return { kind: "degree", value: degrees[0] };
}

export function StudentProgressCard({
  email,
  displayName,
  applications,
  profile,
}: {
  email: string | null | undefined;
  displayName: string | null | undefined;
  applications: ApplicationItem[];
  profile: ProfileSummary;
}) {
  const t = useTranslations("applications.progressCard");
  const locale = useLocale() as Locale;
  // Title-case the first token only. We avoid /\b\w/ here: in JS regex (no /u
  // flag with \w), `\w` is [A-Za-z0-9_], so Turkish letters like ğ/ş/ç/ı/ü/ö
  // are not word chars — that creates a fake word boundary inside names like
  // "Erdoğan" and uppercases the letter after ğ (→ "ErdoğAn"). Locale-aware
  // uppercase on the leading character handles Turkish casing correctly
  // (notably i → İ).
  const firstName = (displayName || (email ?? "").split("@")[0] || "there")
    .split(/\s+/)[0]
    .replace(/[._-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");

  const targetCountries = useMemo(
    () => deriveTargetCountries(applications, profile),
    [applications, profile],
  );
  const fieldOfInterest = useMemo(
    () => deriveFieldOfInterest(applications, profile),
    [applications, profile],
  );

  const progress = useMemo(() => {
    if (applications.length === 0) return 0;
    const total = applications.reduce(
      (sum, a) => sum + STATUS_PROGRESS_WEIGHT[a.status],
      0,
    );
    return total / applications.length;
  }, [applications]);
  const progressPct = Math.round(progress * 100);

  const badge = useMemo(() => {
    if (applications.length === 0) {
      return { label: t("status.dreaming"), tone: "bg-white/15 text-white" };
    }
    if (progress >= 0.9) {
      return {
        label: t("status.finishLine"),
        tone: "bg-emerald-300/20 text-emerald-50",
      };
    }
    if (progress >= 0.6) {
      return { label: t("status.closingIn"), tone: "bg-sky-300/20 text-sky-50" };
    }
    if (progress >= 0.3) {
      return {
        label: t("status.momentum"),
        tone: "bg-amber-200/25 text-amber-50",
      };
    }
    return { label: t("status.starting"), tone: "bg-white/15 text-white" };
  }, [progress, applications.length, t]);

  const destinationsPhrase =
    targetCountries.length > 0
      ? t("destinationsCount", { count: targetCountries.length })
      : t("destinationsYours");

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.6, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-primary/85 p-6 text-white shadow-[0_18px_60px_-30px_rgba(8,145,178,0.45)] sm:p-8"
    >
      {/* decorative orbs */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-60 rounded-full bg-white/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/30 backdrop-blur-sm sm:size-20 sm:text-4xl"
            aria-hidden
          >
            🧑‍🎓
          </motion.div>
          <div className="min-w-0">
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={cn(
                "mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ring-1 ring-white/25",
                badge.tone,
              )}
            >
              <Sparkles className="size-3" />
              {badge.label}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
            >
              {t("greeting", { name: firstName })}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5 }}
              className="mt-1.5 max-w-xl text-sm text-white/85"
            >
              {applications.length === 0
                ? t("subtitleEmpty")
                : t("subtitleWithApps", {
                    applications: t("applicationsCount", {
                      count: applications.length,
                    }),
                    destinations: destinationsPhrase,
                  })}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
              }}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              {fieldOfInterest && (
                <Chip icon={<GraduationCap className="size-3.5" />}>
                  {fieldOfInterest.kind === "field"
                    ? localizeField(fieldOfInterest.value, locale)
                    : t("degreePrograms", { degree: fieldOfInterest.value })}
                </Chip>
              )}
              {targetCountries.length > 0 ? (
                <Chip icon={<Target className="size-3.5" />}>
                  {targetCountries
                    .map((c) =>
                      c === "ANY"
                        ? t("anyDestination")
                        : localizeCountry(COUNTRY_NAMES[c] || c, locale),
                    )
                    .join(" · ")}
                </Chip>
              ) : (
                <Chip icon={<Compass className="size-3.5" />}>
                  {t("exploringDestinations")}
                </Chip>
              )}
            </motion.div>
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0 lg:w-72">
          <div className="flex items-baseline justify-between text-sm text-white/90">
            <span className="font-medium">{t("overallProgress")}</span>
            <motion.span
              key={progressPct}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-base font-semibold tabular-nums text-white"
            >
              {progressPct}%
            </motion.span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.21, 0.6, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-100 via-white to-emerald-100"
            />
          </div>
          <p className="mt-2 text-xs text-white/75">
            {applications.length === 0
              ? t("progressHintEmpty")
              : t("progressHint")}
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.span
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0 },
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm"
    >
      {icon}
      <span className="truncate">{children}</span>
    </motion.span>
  );
}
