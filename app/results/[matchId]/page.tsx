import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
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

  const matchRes = await supabase
    .from("matches")
    .select("id, profile_id, program_id, score, rationale")
    .eq("id", matchId)
    .maybeSingle();
  if (matchRes.error || !matchRes.data) notFound();

  const profileRes = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", matchRes.data.profile_id)
    .maybeSingle();
  if (profileRes.error || !profileRes.data) notFound();

  // Authorization check: cookie must match the profile that owns this match.
  if (profileRes.data.client_id !== cookieClientId) notFound();

  const programRes = await supabase
    .from("programs")
    .select(
      "id, slug, name, degree, field_of_study, language, duration_months, tuition_per_year, currency, application_deadline, start_month, description, university_id",
    )
    .eq("id", matchRes.data.program_id)
    .maybeSingle();
  if (programRes.error || !programRes.data) notFound();

  const universityRes = await supabase
    .from("universities")
    .select("name, country, city, website, description, is_partner")
    .eq("id", programRes.data.university_id)
    .maybeSingle();
  if (universityRes.error || !universityRes.data) notFound();

  const program = programRes.data;
  const university = universityRes.data;

  const tuitionLabel =
    program.tuition_per_year != null
      ? `${program.currency} ${Number(program.tuition_per_year).toLocaleString("en-GB")} / year`
      : "Tuition not listed";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-primary">Top match</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {program.name}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {program.degree} · {university.name}
        {university.is_partner ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            Partner university
          </span>
        ) : null}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat icon={<MapPin className="size-4" />} label="Location">
          {university.city}, {university.country}
        </Stat>
        <Stat icon={<GraduationCap className="size-4" />} label="Field">
          {formatField(program.field_of_study)}
        </Stat>
        <Stat icon={<Languages className="size-4" />} label="Language">
          {formatLanguage(program.language)}
        </Stat>
        <Stat icon={<CalendarDays className="size-4" />} label="Duration">
          {program.duration_months} months
        </Stat>
        <Stat icon={<Wallet className="size-4" />} label="Tuition">
          {tuitionLabel}
        </Stat>
        {program.start_month ? (
          <Stat icon={<CalendarDays className="size-4" />} label="Starts">
            {program.start_month}
          </Stat>
        ) : null}
      </div>

      {program.description ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">About the program</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{program.description}</p>
        </section>
      ) : null}

      {university.description ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            About {university.name}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {university.description}
          </p>
        </section>
      ) : null}

      <p className="mt-12 text-sm text-muted-foreground">
        For MVP, the matcher returns the seeded program for everyone. Once we have more
        universities loaded, this page will rank multiple matches.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {university.website ? (
          <Button asChild>
            <a href={university.website} target="_blank" rel="noreferrer noopener">
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
