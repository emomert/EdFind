import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Languages,
  MapPin,
  Wallet,
} from "lucide-react";

import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_ID_COOKIE } from "@/lib/quiz/client-id";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your matches",
  description: "Master's programs matched to your profile.",
};

type Params = { matchId: string };

type ProgramRow = {
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
  qs_subject_rank: number | null;
  qs_subject_area: string | null;
};

type UniversityRow = {
  name: string;
  country: string;
  city: string;
  website: string | null;
  description: string | null;
  is_partner: boolean;
  qs_world_rank: number | null;
};

type MatchRow = {
  id: string;
  score: number | string | null;
  rationale: string | null;
  program: (ProgramRow & { university: UniversityRow }) | null;
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { matchId } = await params;
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(CLIENT_ID_COOKIE)?.value;
  if (!cookieClientId) notFound();

  const supabase = createServiceClient();

  // 1. Auth check: load the requested match, then verify the cookie matches
  //    the profile that owns it.
  const matchRes = await supabase
    .from("matches")
    .select("id, profile_id")
    .eq("id", matchId)
    .maybeSingle();
  if (matchRes.error || !matchRes.data) notFound();

  const profileRes = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", matchRes.data.profile_id)
    .maybeSingle();
  if (profileRes.error || !profileRes.data) notFound();
  if (profileRes.data.client_id !== cookieClientId) notFound();

  // 2. Load every match for this profile, with program + university embedded,
  //    ordered by score (highest first).
  const allMatchesRes = await supabase
    .from("matches")
    .select(
      `id, score, rationale,
       program:programs(
         id, slug, name, degree, field_of_study, language, duration_months,
         tuition_per_year, currency, application_deadline, start_month,
         description, qs_subject_rank, qs_subject_area,
         university:universities(
           name, country, city, website, description, is_partner, qs_world_rank
         )
       )`,
    )
    .eq("profile_id", matchRes.data.profile_id)
    .order("score", { ascending: false, nullsFirst: false });

  if (
    allMatchesRes.error ||
    !allMatchesRes.data ||
    allMatchesRes.data.length === 0
  ) {
    notFound();
  }

  const matches = allMatchesRes.data as unknown as MatchRow[];
  const valid = matches.filter(
    (m): m is MatchRow & { program: ProgramRow & { university: UniversityRow } } =>
      m.program !== null,
  );
  if (valid.length === 0) notFound();

  const top = valid[0];
  const others = valid.slice(1);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-primary">Your top match</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {top.program.name}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {top.program.degree} · {top.program.university.name}
        {top.program.university.qs_world_rank ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            QS #{top.program.university.qs_world_rank} worldwide
          </span>
        ) : null}
        {top.program.university.is_partner ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            Partner university
          </span>
        ) : null}
      </p>

      {top.rationale ? (
        <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
          <span className="font-medium">Why this fits you:</span> {top.rationale}
        </p>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat icon={<MapPin className="size-4" />} label="Location">
          {top.program.university.city}, {top.program.university.country}
        </Stat>
        <Stat icon={<GraduationCap className="size-4" />} label="Field">
          {formatField(top.program.field_of_study)}
        </Stat>
        <Stat icon={<Languages className="size-4" />} label="Language">
          {formatLanguage(top.program.language)}
        </Stat>
        <Stat icon={<CalendarDays className="size-4" />} label="Duration">
          {top.program.duration_months} months
        </Stat>
        <Stat icon={<Wallet className="size-4" />} label="Tuition">
          {formatTuition(top.program.tuition_per_year, top.program.currency)}
        </Stat>
        {top.program.start_month ? (
          <Stat icon={<CalendarDays className="size-4" />} label="Starts">
            {top.program.start_month}
          </Stat>
        ) : null}
        {top.program.qs_subject_rank && top.program.qs_subject_area ? (
          <Stat icon={<Award className="size-4" />} label="Subject ranking">
            #{top.program.qs_subject_rank} in {top.program.qs_subject_area}
          </Stat>
        ) : null}
      </div>

      {top.program.description ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            About the program
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {top.program.description}
          </p>
        </section>
      ) : null}

      {top.program.university.description ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            About {top.program.university.name}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {top.program.university.description}
          </p>
        </section>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {top.program.university.website ? (
          <Button asChild>
            <a
              href={top.program.university.website}
              target="_blank"
              rel="noreferrer noopener"
            >
              Visit university site
              <ExternalLink />
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft />
            Back to home
          </Link>
        </Button>
      </div>

      {others.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Other strong matches
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ranked by overall fit to your profile.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((m) => (
              <article
                key={m.id}
                className="rounded-2xl border border-border bg-muted/30 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {m.program.university.city}, {m.program.university.country}
                </p>
                <h3 className="mt-1 text-lg font-semibold leading-snug tracking-tight">
                  {m.program.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {m.program.degree} · {m.program.university.name}
                  {m.program.university.qs_world_rank ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      QS #{m.program.university.qs_world_rank}
                    </span>
                  ) : null}
                </p>
                {m.rationale ? (
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {m.rationale}
                  </p>
                ) : null}
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div>
                    <dt className="font-medium text-foreground">Field</dt>
                    <dd>{formatField(m.program.field_of_study)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Tuition</dt>
                    <dd>
                      {formatTuition(
                        m.program.tuition_per_year,
                        m.program.currency,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Duration</dt>
                    <dd>{m.program.duration_months} months</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Language</dt>
                    <dd>{formatLanguage(m.program.language)}</dd>
                  </div>
                </dl>
              </article>
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
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
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
  return `${currency} ${num.toLocaleString("en-GB")} / year`;
}
