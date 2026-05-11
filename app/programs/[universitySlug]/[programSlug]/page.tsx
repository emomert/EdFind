import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
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

import { createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/auth";
import { SaveButton } from "@/components/shortlist/save-button";
import { APPLICATIONS_ENABLED } from "@/lib/feature-flags";
import { TrackButton } from "@/components/applications/track-button";

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
  const supabase = createServiceClient();
  const uniRes = await supabase
    .from("universities")
    .select("id, name")
    .eq("slug", universitySlug)
    .maybeSingle();
  if (!uniRes.data) return { title: "Program not found" };

  const progRes = await supabase
    .from("programs")
    .select("name, description")
    .eq("university_id", uniRes.data.id)
    .eq("slug", programSlug)
    .maybeSingle();

  if (!progRes.data) return { title: "Program not found" };

  return {
    title: `${progRes.data.name} — ${uniRes.data.name}`,
    description:
      progRes.data.description?.slice(0, 160) ??
      `${progRes.data.name} at ${uniRes.data.name}.`,
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, programSlug } = await params;
  const supabase = createServiceClient();

  const uniRes = await supabase
    .from("universities")
    .select(
      "id, slug, name, country, city, institution_type, website, description, qs_world_rank, is_partner",
    )
    .eq("slug", universitySlug)
    .maybeSingle();
  if (uniRes.error || !uniRes.data) notFound();

  const u = uniRes.data;

  const progRes = await supabase
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

  const user = await getUser();
  let isSaved = false;
  let isTracked = false;
  if (user) {
    const savedRes = await supabase
      .from("saved_programs")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", p.id)
      .maybeSingle();
    isSaved = Boolean(savedRes.data);

    if (APPLICATIONS_ENABLED) {
      const trackedRes = await supabase
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("program_id", p.id)
        .maybeSingle();
      isTracked = Boolean(trackedRes.data);
    }
  }

  const peersRes = await supabase
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
    ? deadlineDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Rolling / not posted";

  const tuitionLabel =
    p.tuition_per_year != null
      ? `${p.currency} ${Number(p.tuition_per_year).toLocaleString("en-GB")} / year`
      : "Tuition not listed";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <Link
        href={`/universities/${u.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {u.name}
      </Link>

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <GraduationCap className="size-3.5" />
            {formatField(p.field_of_study)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <Building2 className="size-3.5" />
            {u.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <MapPin className="size-3.5" />
            {u.city}, {u.country}
          </span>
          {u.is_partner ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              <Sparkles className="size-3.5" />
              Partner
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
              QS #{p.qs_subject_rank} in {p.qs_subject_area}
            </span>
          ) : null}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat icon={<Wallet className="size-4" />} label="Tuition">
          {tuitionLabel}
        </Stat>
        <Stat icon={<CalendarDays className="size-4" />} label="Duration">
          {p.duration_months} months
        </Stat>
        <Stat icon={<Languages className="size-4" />} label="Language">
          {formatLanguage(p.language)}
        </Stat>
        <Stat icon={<CalendarDays className="size-4" />} label="Deadline">
          {deadlineLabel}
        </Stat>
        {p.start_month ? (
          <Stat icon={<CalendarDays className="size-4" />} label="Starts">
            {p.start_month}
          </Stat>
        ) : null}
        {u.qs_world_rank ? (
          <Stat icon={<Award className="size-4" />} label="University rank">
            QS #{u.qs_world_rank} worldwide
          </Stat>
        ) : null}
      </div>

      {p.description ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">
            About this program
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
              Admission requirements
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {requirements.gpa_min ? (
                <div>
                  <dt className="font-medium text-foreground">GPA / academic background</dt>
                  <dd className="mt-1 text-muted-foreground">{requirements.gpa_min}</dd>
                </div>
              ) : null}
              {requirements.language_tests &&
              requirements.language_tests.length > 0 ? (
                <div>
                  <dt className="font-medium text-foreground">Accepted English tests</dt>
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
                Documents to prepare
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
              Apply on {u.name}&apos;s site
              <ExternalLink />
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href={`/universities/${u.slug}`}>
            See all programs at {u.name}
          </Link>
        </Button>
        <SaveButton programId={p.id} initiallySaved={isSaved} />
        {APPLICATIONS_ENABLED ? (
          <TrackButton programId={p.id} initiallyTracked={isTracked} />
        ) : null}
      </div>

      {peers.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Other programs at {u.name}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {peers.map((peer) => (
              <Link
                key={peer.slug}
                href={`/programs/${u.slug}/${peer.slug}`}
                className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-accent/30"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatField(peer.field_of_study)}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug group-hover:text-primary">
                  {peer.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {peer.degree} · {peer.duration_months} months
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
