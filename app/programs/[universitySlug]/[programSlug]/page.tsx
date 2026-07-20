import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Award,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  GraduationCap,
  Languages,
  ListChecks,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/auth";
import { SaveButton } from "@/components/shortlist/save-button";
import { UniversityLogo } from "@/components/university/university-logo";
import { UniversityHero } from "@/components/university/university-hero";
import { formatTuition } from "@/lib/format/currency";
import { HOUSING_ENABLED } from "@/lib/feature-flags";
import { getHousing } from "@/lib/housing/server";
import { HousingSection } from "@/components/housing/housing-section";
import { Reveal } from "@/components/motion";
import type { Locale } from "@/lib/i18n/config";
import {
  localizeCity,
  localizeCountry,
  localizeField,
  localizeLanguage,
} from "@/lib/i18n/data-labels";
import { COUNTRY_NAMES } from "@/components/applications/types";

type Params = { universitySlug: string; programSlug: string };

type Requirements = {
  gpa_min?: string;
  language_tests?: string[];
  documents?: string[];
};

type PeerProgram = {
  slug: string;
  name: string;
  degree: string;
  field_of_study: string;
  duration_months: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug, programSlug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("university");
  const uniRes = await supabase
    .from("universities")
    .select("id, name")
    .eq("slug", universitySlug)
    .maybeSingle();
  if (!uniRes.data) return { title: t("programPage.meta.notFound") };

  const progRes = await supabase
    .from("programs")
    .select("name, description")
    .eq("university_id", uniRes.data.id)
    .eq("slug", programSlug)
    .maybeSingle();

  if (!progRes.data) return { title: t("programPage.meta.notFound") };

  return {
    title: t("programPage.meta.title", {
      program: progRes.data.name,
      university: uniRes.data.name,
    }),
    description:
      progRes.data.description?.slice(0, 160) ??
      t("programPage.meta.descriptionFallback", {
        program: progRes.data.name,
        university: uniRes.data.name,
      }),
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, programSlug } = await params;
  const publicDb = await createClient();
  const t = await getTranslations("university");
  const locale = (await getLocale()) as Locale;

  const uniRes = await publicDb
    .from("universities")
    .select(
      "id, slug, name, country, city, institution_type, website, description, qs_world_rank, is_partner, logo_url, hero_image_url, hero_image_credit, hero_image_source_url",
    )
    .eq("slug", universitySlug)
    .maybeSingle();
  if (uniRes.error || !uniRes.data) notFound();

  const u = uniRes.data;

  const progRes = await publicDb
    .from("programs")
    .select(
      "id, slug, name, degree, field_of_study, language, duration_months, tuition_per_year, currency, application_deadline, start_month, description, requirements, qs_subject_rank, qs_subject_area",
    )
    .eq("university_id", u.id)
    .eq("slug", programSlug)
    .maybeSingle();
  if (progRes.error || !progRes.data) notFound();

  const p = progRes.data;
  const requirements: Requirements = (p.requirements as Requirements) ?? {};

  // Program pages inherit their university's city + university housing.
  const housing = HOUSING_ENABLED
    ? await getHousing({ universityId: u.id, city: u.city, country: u.country })
    : { city: null, university: null };

  const user = await getUser();
  let isSaved = false;
  if (user) {
    const userDb = createServiceClient();
    // "Saved" == the program is in the user's applications (the shortlist was
    // merged into the tracker, 2026-06-09 — one Save action, one list).
    const savedRes = await userDb
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", p.id)
      .maybeSingle();
    isSaved = Boolean(savedRes.data);
  }

  const peersRes = await publicDb
    .from("programs")
    .select("slug, name, degree, field_of_study, duration_months")
    .eq("university_id", u.id)
    .neq("slug", programSlug)
    .order("qs_subject_rank", { ascending: true, nullsFirst: false })
    .limit(4);
  const peers: PeerProgram[] = peersRes.data ?? [];

  const deadlineDate = p.application_deadline
    ? new Date(p.application_deadline)
    : null;
  const deadlineLabel = deadlineDate
    ? deadlineDate.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : t("programPage.deadlineNotPosted");

  const tuitionLabel = formatTuition(
    p.tuition_per_year,
    p.currency,
    "long",
    locale,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { href: "/", label: t("breadcrumbs.home") },
          { href: "/catalog", label: t("breadcrumbs.catalog") },
          { href: `/universities/${u.slug}`, label: u.name },
          { label: p.name },
        ]}
      />

      <UniversityHero
        imageUrl={u.hero_image_url}
        credit={u.hero_image_credit}
        sourceUrl={u.hero_image_source_url}
        alt={u.name}
      />

      <div className="mt-8 flex items-start gap-4">
        <UniversityLogo
          name={u.name}
          slug={u.slug}
          logoUrl={u.logo_url}
          size="md"
        />
        <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <GraduationCap className="size-3.5" />
            {formatField(p.field_of_study, locale)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <Building2 className="size-3.5" />
            {u.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <MapPin className="size-3.5" />
            {localizeCity(u.city, locale)},{" "}
            {localizeCountry(COUNTRY_NAMES[u.country] || u.country, locale)}
          </span>
          {u.is_partner ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              <Sparkles className="size-3.5" />
              {t("programPage.partnerBadge")}
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.name}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {p.degree}
          {p.qs_subject_rank && p.qs_subject_area ? (
            <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Award className="size-3" />
              {t("programPage.qsSubjectRank", {
                rank: p.qs_subject_rank,
                area: localizeField(p.qs_subject_area ?? "", locale),
              })}
            </span>
          ) : null}
        </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat icon={<Wallet className="size-4" />} label={t("programPage.stats.tuition")}>
          {tuitionLabel}
        </Stat>
        <Stat icon={<CalendarDays className="size-4" />} label={t("programPage.stats.duration")}>
          {t("duration.months", { months: p.duration_months })}
        </Stat>
        <Stat icon={<Languages className="size-4" />} label={t("programPage.stats.language")}>
          {formatLanguage(p.language, locale)}
        </Stat>
        <Stat icon={<CalendarDays className="size-4" />} label={t("programPage.stats.deadline")}>
          {deadlineLabel}
        </Stat>
        {p.start_month ? (
          <Stat icon={<CalendarDays className="size-4" />} label={t("programPage.stats.starts")}>
            {p.start_month}
          </Stat>
        ) : null}
        {u.qs_world_rank ? (
          <Stat icon={<Award className="size-4" />} label={t("programPage.stats.universityRank")}>
            {t("programPage.universityRankWorldwide", { rank: u.qs_world_rank })}
          </Stat>
        ) : null}
      </div>

      {p.description ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("programPage.aboutHeading")}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {p.description}
          </p>
        </section>
      ) : null}

      {(requirements.gpa_min || requirements.language_tests || requirements.documents) ? (
        <section className="mt-10 grid gap-6 rounded-2xl border border-border bg-muted/30 p-6 sm:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ListChecks className="size-4" />
              {t("programPage.requirements.heading")}
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {requirements.gpa_min ? (
                <div>
                  <dt className="font-medium text-foreground">{t("programPage.requirements.gpaLabel")}</dt>
                  <dd className="mt-1 text-muted-foreground">{requirements.gpa_min}</dd>
                </div>
              ) : null}
              {requirements.language_tests &&
              requirements.language_tests.length > 0 ? (
                <div>
                  <dt className="font-medium text-foreground">{t("programPage.requirements.englishTestsLabel")}</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {requirements.language_tests.join(" · ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
          {requirements.documents && requirements.documents.length > 0 ? (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="size-4" />
                {t("programPage.requirements.documentsHeading")}
              </h3>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {requirements.documents.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/60" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        {u.website ? (
          <Button asChild>
            <a href={u.website} target="_blank" rel="noreferrer noopener">
              {t("programPage.applyOnSite", { university: u.name })}
              <ExternalLink />
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href={`/universities/${u.slug}`}>
            {t("programPage.seeAllPrograms", { university: u.name })}
          </Link>
        </Button>
        <SaveButton programId={p.id} initiallySaved={isSaved} />
      </div>

      {HOUSING_ENABLED ? (
        <Reveal>
          <HousingSection
            city={housing.city}
            university={housing.university}
            cityName={u.city}
          />
        </Reveal>
      ) : null}

      {peers.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("programPage.otherProgramsHeading", { university: u.name })}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {peers.map((peer) => (
              <Link
                key={peer.slug}
                href={`/programs/${u.slug}/${peer.slug}`}
                className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-accent/30"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatField(peer.field_of_study, locale)}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug group-hover:text-primary">
                  {peer.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {peer.degree} ·{" "}
                  {t("duration.months", { months: peer.duration_months })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
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
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-base text-foreground">{children}</div>
    </div>
  );
}

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

function formatField(field: string, locale: Locale): string {
  return localizeField(FIELD_LABELS[field] ?? field, locale);
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  it: "Italian",
  de: "German",
  nl: "Dutch",
  fr: "French",
};

function formatLanguage(code: string, locale: Locale): string {
  return localizeLanguage(LANGUAGE_LABELS[code] ?? code.toUpperCase(), locale);
}
