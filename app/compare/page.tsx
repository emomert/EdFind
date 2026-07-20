import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  GraduationCap,
  Languages,
  MapPin,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { requirePremium } from "@/lib/premium/premium";
import { UniversityLogo } from "@/components/university/university-logo";
import { formatTuition as formatTuitionWithEur } from "@/lib/format/currency";
import type { Locale } from "@/lib/i18n/config";
import {
  localizeCity,
  localizeCountry,
  localizeField,
  localizeLanguage,
} from "@/lib/i18n/data-labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("results.meta.compare");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type CompareProgram = {
  id: string;
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
  requirements: Requirements | null;
  qs_subject_rank: number | null;
  qs_subject_area: string | null;
  university: {
    slug: string;
    name: string;
    country: string;
    city: string;
    qs_world_rank: number | null;
    is_partner: boolean;
    website: string | null;
    logo_url: string | null;
  };
};

type Requirements = {
  gpa_min?: string;
  language_tests?: string[];
  documents?: string[];
};

const COMPARE_MAX = 3;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Compare table cells are already labelled "Tuition" by the row header, so
// the empty label "Not listed" is preferred over the longer default.
function formatTuition(
  amount: string | number | null,
  currency: string,
  notListedLabel: string,
  locale: Locale,
): string {
  if (amount == null) return notListedLabel;
  return formatTuitionWithEur(amount, currency, "long", locale);
}

function formatDeadline(
  date: string | null,
  rollingLabel: string,
  locale: Locale,
): string {
  if (!date) return rollingLabel;
  return new Date(date).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  await requireUser(
    idsParam ? `/compare?ids=${encodeURIComponent(idsParam)}` : "/compare",
  );
  await requirePremium("/compare");
  const rawIds = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s));
  const uniqueIds = Array.from(new Set(rawIds)).slice(0, COMPARE_MAX);

  if (uniqueIds.length < 2) {
    redirect("/shortlist");
  }

  const t = await getTranslations("results.compare");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const res = await supabase
    .from("programs")
    .select(
      `id, slug, name, degree, field_of_study, language, duration_months,
       tuition_per_year, currency, application_deadline, start_month,
       description, requirements, qs_subject_rank, qs_subject_area,
       university:universities!inner(
         slug, name, country, city, qs_world_rank, is_partner, website, logo_url
       )`,
    )
    .in("id", uniqueIds);

  const programs = (res.data ?? []) as unknown as CompareProgram[];
  // Preserve the order the user picked.
  const ordered = uniqueIds
    .map((id) => programs.find((p) => p.id === id))
    .filter((p): p is CompareProgram => Boolean(p));

  if (ordered.length < 2) {
    redirect("/shortlist");
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <Link
        href="/shortlist"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToShortlist")}
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("countLabel", { count: ordered.length })}
        </p>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div
          className="grid gap-4 min-w-[640px]"
          style={{
            gridTemplateColumns: `repeat(${ordered.length}, minmax(0, 1fr))`,
          }}
        >
          {ordered.map((p) => (
            <ProgramHeader key={p.id} program={p} locale={locale} />
          ))}
        </div>

        <RowGroup title={t("groups.basics")}>
          <Row
            label={t("rows.field")}
            icon={<GraduationCap className="size-4" />}
            values={ordered.map((p) => formatField(p.field_of_study, locale))}
          />
          <Row
            label={t("rows.degree")}
            values={ordered.map((p) => p.degree)}
          />
          <Row
            label={t("rows.language")}
            icon={<Languages className="size-4" />}
            values={ordered.map((p) => formatLanguage(p.language, locale))}
          />
          <Row
            label={t("rows.duration")}
            icon={<CalendarDays className="size-4" />}
            values={ordered.map((p) =>
              t("rows.durationValue", { count: p.duration_months }),
            )}
          />
        </RowGroup>

        <RowGroup title={t("groups.costTiming")}>
          <Row
            label={t("rows.tuition")}
            icon={<Wallet className="size-4" />}
            values={ordered.map((p) =>
              formatTuition(
                p.tuition_per_year,
                p.currency,
                t("values.notListed"),
                locale,
              ),
            )}
          />
          <Row
            label={t("rows.applicationDeadline")}
            icon={<CalendarDays className="size-4" />}
            values={ordered.map((p) =>
              formatDeadline(
                p.application_deadline,
                t("values.rollingNotPosted"),
                locale,
              ),
            )}
          />
          <Row
            label={t("rows.startMonth")}
            values={ordered.map((p) => p.start_month ?? t("values.notPosted"))}
          />
        </RowGroup>

        <RowGroup title={t("groups.rankings")}>
          <Row
            label={t("rows.universityQsWorld")}
            icon={<Award className="size-4" />}
            values={ordered.map((p) =>
              p.university.qs_world_rank
                ? `#${p.university.qs_world_rank}`
                : "—",
            )}
          />
          <Row
            label={t("rows.subjectRanking")}
            values={ordered.map((p) =>
              p.qs_subject_rank && p.qs_subject_area
                ? t("rows.subjectRankingValue", {
                    rank: p.qs_subject_rank,
                    area: localizeField(p.qs_subject_area, locale),
                  })
                : "—",
            )}
          />
        </RowGroup>

        <RowGroup title={t("groups.admissions")}>
          <Row
            label={t("rows.gpaAcademic")}
            values={ordered.map(
              (p) => p.requirements?.gpa_min ?? t("values.notSpecified"),
            )}
          />
          <Row
            label={t("rows.acceptedEnglishTests")}
            values={ordered.map((p) =>
              p.requirements?.language_tests &&
              p.requirements.language_tests.length > 0
                ? p.requirements.language_tests.join(" · ")
                : t("values.notSpecified"),
            )}
          />
          <Row
            label={t("rows.documentsToPrepare")}
            values={ordered.map((p) =>
              p.requirements?.documents && p.requirements.documents.length > 0
                ? p.requirements.documents.join(", ")
                : t("values.notSpecified"),
            )}
          />
        </RowGroup>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/shortlist">
            <ArrowLeft />
            {t("backToShortlist")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ProgramHeader({
  program,
  locale,
}: {
  program: CompareProgram;
  locale: Locale;
}) {
  const u = program.university;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <UniversityLogo
          name={u.name}
          slug={u.slug}
          logoUrl={u.logo_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <MapPin className="mr-1 inline size-3" aria-hidden="true" />
            {localizeCity(u.city, locale)}, {localizeCountry(u.country, locale)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{u.name}</p>
        </div>
      </div>
      <Link
        href={`/programs/${u.slug}/${program.slug}`}
        className="mt-3 block text-base font-semibold leading-snug tracking-tight transition-colors hover:text-primary"
      >
        {program.name}
      </Link>
    </div>
  );
}

function RowGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  icon,
  values,
}: {
  label: string;
  icon?: React.ReactNode;
  values: string[];
}) {
  return (
    <div className="grid border-b border-border last:border-b-0 min-w-[640px]"
      style={{
        gridTemplateColumns: `200px repeat(${values.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="flex items-center gap-2 border-r border-border bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className="border-r border-border px-4 py-3 text-sm last:border-r-0"
        >
          {v}
        </div>
      ))}
    </div>
  );
}
