import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import { createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/auth";
import { SaveButton } from "@/components/shortlist/save-button";

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
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("universities")
    .select("name, country, city, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return { title: "University not found" };
  }
  return {
    title: `${data.name} — EdFind`,
    description:
      data.description?.slice(0, 160) ??
      `Master's programs at ${data.name}, ${data.city}, ${data.country}.`,
  };
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const uniRes = await supabase
    .from("universities")
    .select(
      "id, slug, name, country, city, institution_type, website, description, established_year, student_count, qs_world_rank, is_partner",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (uniRes.error || !uniRes.data) notFound();

  const u = uniRes.data;

  const programsRes = await supabase
    .from("programs")
    .select(
      "id, slug, name, degree, field_of_study, language, duration_months, tuition_per_year, currency, qs_subject_rank, qs_subject_area",
    )
    .eq("university_id", u.id)
    .order("qs_subject_rank", { ascending: true, nullsFirst: false });

  const programs: ProgramSummary[] = programsRes.data ?? [];

  const user = await getUser();
  let savedSet = new Set<string>();
  if (user && programs.length > 0) {
    const savedRes = await supabase
      .from("saved_programs")
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
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <MapPin className="size-3.5" />
              {u.city}, {u.country}
            </span>
            {u.institution_type ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 capitalize">
                <Building2 className="size-3.5" />
                {u.institution_type}
              </span>
            ) : null}
            {u.is_partner ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                <Sparkles className="size-3.5" />
                Partner university
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {u.name}
          </h1>

          {u.qs_world_rank ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Award className="size-3.5" />
              QS World University Rankings: #{u.qs_world_rank}
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
                  Visit official site
                  <ExternalLink />
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/quiz">Take the quiz to match</Link>
            </Button>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-muted/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            At a glance
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            {u.established_year ? (
              <Row label="Founded" value={String(u.established_year)} />
            ) : null}
            {u.student_count ? (
              <Row
                icon={<Users className="size-3.5" />}
                label="Students"
                value={Number(u.student_count).toLocaleString("en-GB")}
              />
            ) : null}
            <Row
              icon={<GraduationCap className="size-3.5" />}
              label="Programs on EdFind"
              value={String(programs.length)}
            />
            {u.qs_world_rank ? (
              <Row
                icon={<Award className="size-3.5" />}
                label="QS World rank"
                value={`#${u.qs_world_rank}`}
              />
            ) : null}
          </dl>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Master&apos;s programs at {u.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {programs.length === 0
            ? "We haven't catalogued programs from this university yet — check back soon."
            : `${programs.length} program${programs.length === 1 ? "" : "s"} in our catalog. Click through for details and application info.`}
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
                    {formatField(p.field_of_study)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-snug tracking-tight group-hover:text-primary">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.degree} · {p.duration_months} months ·{" "}
                    {formatLanguage(p.language)}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-1">
                      {formatTuition(p.tuition_per_year, p.currency)}
                    </span>
                    {p.qs_subject_rank ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                        <Award className="size-3" />
                        QS #{p.qs_subject_rank} {p.qs_subject_area ?? ""}
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

function formatField(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  it: "Italian",
  de: "German",
  nl: "Dutch",
  fr: "French",
};

function formatLanguage(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

function formatTuition(
  amount: string | number | null,
  currency: string,
): string {
  if (amount == null) return "Tuition not listed";
  const num = typeof amount === "string" ? Number(amount) : amount;
  return `${currency} ${num.toLocaleString("en-GB")}/yr`;
}
