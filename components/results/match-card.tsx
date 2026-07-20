"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Languages,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/shortlist/save-button";
import { UniversityLogo } from "@/components/university/university-logo";
import {
  MarkerSparkles,
  MarkerStar,
} from "@/components/decor/marker";
import { HeroBackgroundGraphics } from "@/components/decor/hero-background-graphics";
import { formatTuition } from "@/lib/format/currency";
import type { Locale } from "@/lib/i18n/config";
import {
  localizeCity,
  localizeCountry,
  localizeField,
  localizeLanguage,
} from "@/lib/i18n/data-labels";

export type MatchCardProgram = {
  slug: string;
  name: string;
  degree: string;
  field_of_study: string;
  language: string;
  duration_months: number;
  tuition_per_year: string | number | null;
  currency: string;
  application_deadline: string | null;
  start_month: string | null;
  description: string | null;
  qs_subject_rank: number | null;
  qs_subject_area: string | null;
  university: {
    slug: string;
    name: string;
    country: string;
    city: string;
    website: string | null;
    description: string | null;
    is_partner: boolean;
    qs_world_rank: number | null;
    logo_url: string | null;
  };
};

export type MatchCardData = {
  id: string;
  score: number | string | null;
  rationale: string | null;
  program: MatchCardProgram;
  program_id: string;
  is_saved: boolean;
};

const FIELD_LABELS: Record<string, string> = {
  business_management: "Business & Management",
  engineering: "Engineering",
  computer_science_ai: "Computer Science & AI",
  design: "Design",
  architecture_built_environment: "Architecture & Built Environment",
  economics_finance: "Economics & Finance",
  data_science: "Data Science",
  social_sciences: "Social Sciences",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  it: "Italian",
  de: "German",
  nl: "Dutch",
  fr: "French",
};

function formatField(field: string, locale: Locale): string {
  return localizeField(FIELD_LABELS[field] ?? field, locale);
}

function formatLanguage(code: string, locale: Locale): string {
  return localizeLanguage(LANGUAGE_LABELS[code] ?? code.toUpperCase(), locale);
}

function scoreToNumber(score: number | string | null): number | null {
  if (score == null) return null;
  const n = typeof score === "string" ? Number(score) : score;
  return Number.isFinite(n) ? n : null;
}

function ScoreBar({ score }: { score: number }) {
  const t = useTranslations("results.matches");
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">
          {t("score")}
        </span>
        <span className="font-mono text-base font-semibold text-foreground">
          {Math.round(pct)}
          <span className="text-xs text-muted-foreground"> /100</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary"
        />
      </div>
    </div>
  );
}

export function HeroMatchCard({
  match,
  saveSlot,
}: {
  match: MatchCardData;
  /**
   * Optional override for the Save control. Production passes nothing (the real
   * SaveButton renders). The self-playing /demo passes a server-action-free
   * stand-in so its scripted "save" doesn't trigger an auth redirect.
   */
  saveSlot?: React.ReactNode;
}) {
  const t = useTranslations("results.matches");
  const locale = useLocale() as Locale;
  const { program } = match;
  const { university: u } = program;
  const score = scoreToNumber(match.score);
  const tuitionLabel = formatTuition(
    program.tuition_per_year,
    program.currency,
    "long",
    locale,
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-secondary/25 blur-3xl"
      />

      <HeroBackgroundGraphics variant="programs" density="low" />
      <MarkerSparkles
        aria-hidden
        className="pointer-events-none absolute right-6 top-6 size-12 text-primary/30"
      />
      <MarkerStar
        aria-hidden
        className="pointer-events-none absolute left-4 top-20 hidden size-6 text-primary/30 sm:block"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          {t("topMatch")}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <UniversityLogo
            name={u.name}
            slug={u.slug}
            logoUrl={u.logo_url}
            size="md"
          />
          <Link
            href={`/programs/${u.slug}/${program.slug}`}
            className="group inline-block"
          >
            <h1 className="text-3xl font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-4xl">
              {program.name}
            </h1>
          </Link>
        </div>
        <p className="mt-2 text-base text-muted-foreground">
          {program.degree} ·{" "}
          <Link
            href={`/universities/${u.slug}`}
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {u.name}
          </Link>
          {u.qs_world_rank ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {t("qsWorldwide", { rank: u.qs_world_rank })}
            </span>
          ) : null}
          {u.is_partner ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {t("partner")}
            </span>
          ) : null}
        </p>

        {score !== null ? (
          <div className="mt-6 max-w-md">
            <ScoreBar score={score} />
          </div>
        ) : null}

        {match.rationale ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-foreground"
          >
            <span className="block text-xs font-semibold uppercase tracking-wider text-primary">
              {t("whyThisFits")}
            </span>
            <span className="mt-2 block">{match.rationale}</span>
          </motion.p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Stat icon={<MapPin className="size-4" />} label={t("stat.location")}>
            {localizeCity(u.city, locale)}, {localizeCountry(u.country, locale)}
          </Stat>
          <Stat icon={<GraduationCap className="size-4" />} label={t("stat.field")}>
            {formatField(program.field_of_study, locale)}
          </Stat>
          <Stat icon={<Languages className="size-4" />} label={t("stat.language")}>
            {formatLanguage(program.language, locale)}
          </Stat>
          <Stat icon={<CalendarDays className="size-4" />} label={t("stat.duration")}>
            {t("stat.durationValue", { count: program.duration_months })}
          </Stat>
          <Stat icon={<Wallet className="size-4" />} label={t("stat.tuition")}>
            {tuitionLabel}
          </Stat>
          {program.start_month ? (
            <Stat icon={<CalendarDays className="size-4" />} label={t("stat.starts")}>
              {program.start_month}
            </Stat>
          ) : null}
          {program.qs_subject_rank && program.qs_subject_area ? (
            <Stat icon={<Award className="size-4" />} label={t("stat.subjectRanking")}>
              {t("stat.subjectRankingValue", {
                rank: program.qs_subject_rank,
                area: localizeField(program.qs_subject_area, locale),
              })}
            </Stat>
          ) : null}
        </div>

        {program.description ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("aboutProgram")}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {program.description}
            </p>
          </section>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/programs/${u.slug}/${program.slug}`}>
              {t("seeFullProgramDetails")}
            </Link>
          </Button>
          {u.website ? (
            <Button asChild variant="outline">
              <a href={u.website} target="_blank" rel="noreferrer noopener">
                {t("visitUniversitySite")}
                <ExternalLink />
              </a>
            </Button>
          ) : null}
          {saveSlot ?? (
            <SaveButton
              programId={match.program_id}
              initiallySaved={match.is_saved}
            />
          )}
        </div>
      </div>
    </motion.section>
  );
}

export function SiblingMatchCard({
  match,
  index,
}: {
  match: MatchCardData;
  index: number;
}) {
  const t = useTranslations("results.matches");
  const locale = useLocale() as Locale;
  const { program } = match;
  const { university: u } = program;
  const score = scoreToNumber(match.score);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.15 + index * 0.08,
      }}
      whileHover={{ y: -2 }}
      className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:border-primary/40 hover:shadow-md"
    >
      <div className="absolute right-3 top-3 z-10">
        <SaveButton
          programId={match.program_id}
          initiallySaved={match.is_saved}
          variant="icon"
        />
      </div>
      <Link
        href={`/programs/${u.slug}/${program.slug}`}
        className="flex flex-1 flex-col"
      >
        <div className="flex items-start gap-3">
          <UniversityLogo
            name={u.name}
            slug={u.slug}
            logoUrl={u.logo_url}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {localizeCity(u.city, locale)}, {localizeCountry(u.country, locale)}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {u.name}
            </p>
          </div>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {program.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {program.degree}
          {u.qs_world_rank ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {t("qsRank", { rank: u.qs_world_rank })}
            </span>
          ) : null}
        </p>

        {score !== null ? (
          <div className="mt-4">
            <ScoreBar score={score} />
          </div>
        ) : null}

        {match.rationale ? (
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            {match.rationale}
          </p>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground">{t("stat.field")}</dt>
            <dd>{formatField(program.field_of_study, locale)}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{t("stat.tuition")}</dt>
            <dd>
              {formatTuition(
                program.tuition_per_year,
                program.currency,
                "long",
                locale,
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{t("stat.duration")}</dt>
            <dd>{t("stat.durationValue", { count: program.duration_months })}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{t("stat.language")}</dt>
            <dd>{formatLanguage(program.language, locale)}</dd>
          </div>
        </dl>

        <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {t("seeFullDetails")}
          <span aria-hidden="true">→</span>
        </span>
      </Link>
    </motion.article>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-base text-foreground">{children}</div>
    </div>
  );
}
