import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Award,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Sparkles,
  Users,
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

type Params = { slug: string };

type ProgramSummary = {
  id: string;
  slug: string;
  name: string;
  degree: string;
  field_of_study: string;
  language: string;
  duration_months: number;
  tuition_per_year: string | number | null;
  currency: string;
  qs_subject_rank: number | null;
  qs_subject_area: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data }, t, locale] = await Promise.all([
    supabase
      .from("universities")
      .select("name, country, city, description")
      .eq("slug", slug)
      .maybeSingle(),
    getTranslations("university"),
    getLocale(),
  ]);

  if (!data) {
    return { title: t("universityPage.meta.notFound") };
  }
  return {
    title: t("universityPage.meta.title", { name: data.name }),
    description:
      data.description?.slice(0, 160) ??
      t("universityPage.meta.descriptionFallback", {
        name: data.name,
        city: localizeCity(data.city, locale as Locale),
        country: localizeCountry(
          COUNTRY_NAMES[data.country] || data.country,
          locale as Locale,
        ),
      }),
  };
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const publicDb = await createClient();
  const t = await getTranslations("university");
  const locale = (await getLocale()) as Locale;

  const uniRes = await publicDb
    .from("universities")
    .select(
      "id, slug, name, country, city, institution_type, website, description, established_year, student_count, qs_world_rank, is_partner, logo_url, hero_image_url, hero_image_credit, hero_image_source_url",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (uniRes.error || !uniRes.data) notFound();

  const u = uniRes.data;

  const programsRes = await publicDb
    .from("programs")
    .select(
      "id, slug, name, degree, field_of_study, language, duration_months, tuition_per_year, currency, qs_subject_rank, qs_subject_area",
    )
    .eq("university_id", u.id)
    .order("qs_subject_rank", { ascending: true, nullsFirst: false });

  const programs: ProgramSummary[] = programsRes.data ?? [];

  const housing = HOUSING_ENABLED
    ? await getHousing({ universityId: u.id, city: u.city, country: u.country })
    : { city: null, university: null };

  const user = await getUser();
  let savedSet = new Set<string>();
  if (user && programs.length > 0) {
    const userDb = createServiceClient();
    // "Saved" == the program is in the user's applications (shortlist merged
    // into the tracker, 2026-06-09).
    const savedRes = await userDb
      .from("applications")
      .select("program_id")
      .eq("user_id", user.id)
      .in(
        "program_id",
        programs.map((p) => p.id),
      );
    savedSet = new Set(
      (savedRes.data ?? []).map((r) => r.program_id as string),
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { href: "/", label: t("breadcrumbs.home") },
          { href: "/catalog", label: t("breadcrumbs.catalog") },
          { label: u.name },
        ]}
      />

      <UniversityHero
        imageUrl={u.hero_image_url}
        credit={u.hero_image_credit}
        sourceUrl={u.hero_image_source_url}
        alt={u.name}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-4">
            <UniversityLogo
              name={u.name}
              slug={u.slug}
              logoUrl={u.logo_url}
              size="lg"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <MapPin className="size-3.5" />
              {localizeCity(u.city, locale)},{" "}
              {localizeCountry(COUNTRY_NAMES[u.country] || u.country, locale)}
            </span>
            {u.institution_type ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 capitalize">
                <Building2 className="size-3.5" />
                {t.has(`institutionType.${u.institution_type}`)
                  ? t(`institutionType.${u.institution_type}`)
                  : u.institution_type}
              </span>
            ) : null}
            {u.is_partner ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                <Sparkles className="size-3.5" />
                {t("universityPage.partnerBadge")}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {u.name}
          </h1>

          {u.qs_world_rank ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Award className="size-3.5" />
              {t("universityPage.qsWorldRank", { rank: u.qs_world_rank })}
            </p>
          ) : null}

          {u.description ? (
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {u.description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {u.website ? (
              <Button asChild>
                <a href={u.website} target="_blank" rel="noreferrer noopener">
                  {t("universityPage.visitOfficialSite")}
                  <ExternalLink />
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/quiz">{t("universityPage.takeQuizToMatch")}</Link>
            </Button>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-muted/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("universityPage.atAGlance")}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            {u.established_year ? (
              <Row
                label={t("universityPage.founded")}
                value={String(u.established_year)}
              />
            ) : null}
            {u.student_count ? (
              <Row
                icon={<Users className="size-3.5" />}
                label={t("universityPage.students")}
                value={Number(u.student_count).toLocaleString(
                  locale === "tr" ? "tr-TR" : "en-GB",
                )}
              />
            ) : null}
            <Row
              icon={<GraduationCap className="size-3.5" />}
              label={t("universityPage.programsOnEdFind")}
              value={String(programs.length)}
            />
          </dl>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("universityPage.programsHeading", { name: u.name })}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {programs.length === 0
            ? t("universityPage.noProgramsYet")
            : t("universityPage.programsCount", { count: programs.length })}
        </p>

        {programs.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {programs.map((p) => (
              <div key={p.slug} className="relative">
                <Link
                  href={`/programs/${u.slug}/${p.slug}`}
                  className="group block rounded-2xl border border-border bg-card p-5 pr-14 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatField(p.field_of_study, locale)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-snug tracking-tight group-hover:text-primary">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.degree} · {t("duration.months", { months: p.duration_months })} ·{" "}
                    {formatLanguage(p.language, locale)}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-1">
                      {formatTuition(p.tuition_per_year, p.currency, "short", locale)}
                    </span>
                    {p.qs_subject_rank ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                        <Award className="size-3" />
                        QS #{p.qs_subject_rank}{" "}
                        {p.qs_subject_area ? localizeField(p.qs_subject_area, locale) : ""}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="absolute right-3 top-3">
                  <SaveButton
                    programId={p.id}
                    initiallySaved={savedSet.has(p.id)}
                    variant="icon"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {HOUSING_ENABLED ? (
        <Reveal>
          <HousingSection
            city={housing.city}
            university={housing.university}
            cityName={u.city}
          />
        </Reveal>
      ) : null}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-foreground">{value}</dd>
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

