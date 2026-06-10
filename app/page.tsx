import Link from "next/link";
import {
  ArrowRight,
  Award,
  Compass,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import {
  MarkerArrow,
  MarkerRoute,
  MarkerSparkles,
  MarkerSquiggle,
  MarkerStar,
} from "@/components/decor/marker";
import { HeroBackgroundGraphics } from "@/components/decor/hero-background-graphics";
import { Drift, Reveal } from "@/components/motion";
import { TOTAL_STEPS } from "@/lib/quiz/schema";
import { UniversityMarquee } from "@/components/home/university-marquee";
import {
  WelcomeTour,
  WelcomeTourReplayLink,
} from "@/components/welcome/welcome-tour";

type FeaturedUniversity = {
  slug: string;
  name: string;
  country: string;
  city: string;
  qs_world_rank: number | null;
  description: string | null;
  logo_url: string | null;
  program_count: number;
};

async function loadFeatured(): Promise<{
  universities: FeaturedUniversity[];
  totals: { universities: number; programs: number; countries: number };
}> {
  // Anon client: universities + programs have public_read RLS policies.
  const supabase = await createClient();

  const [uniRes, progRes, countriesRes] = await Promise.all([
    supabase
      .from("universities")
      .select("slug, name, country, city, qs_world_rank, description, logo_url")
      .order("qs_world_rank", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("universities").select("country"),
  ]);

  const featuredSlugs = (uniRes.data ?? []).map((u) => u.slug);
  const counts: Record<string, number> = {};

  if (featuredSlugs.length > 0) {
    const { data: progs } = await supabase
      .from("programs")
      .select("university_id, university:universities!inner(slug)")
      .in("university.slug", featuredSlugs);
    for (const row of progs ?? []) {
      const slug = (row as unknown as { university: { slug: string } })
        .university.slug;
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }

  const universities: FeaturedUniversity[] = (uniRes.data ?? []).map((u) => ({
    slug: u.slug,
    name: u.name,
    country: u.country,
    city: u.city,
    qs_world_rank: u.qs_world_rank,
    description: u.description,
    logo_url: u.logo_url,
    program_count: counts[u.slug] ?? 0,
  }));

  const uniqueCountries = new Set(
    (countriesRes.data ?? []).map((row) => row.country),
  );

  return {
    universities,
    totals: {
      universities: countriesRes.data?.length ?? 0,
      programs: progRes.count ?? 0,
      countries: uniqueCountries.size,
    },
  };
}

export default async function HomePage() {
  const [{ universities, totals }, user] = await Promise.all([
    loadFeatured(),
    getUser(),
  ]);
  const isAuthed = Boolean(user);

  return (
    <div className="relative">
      <DecorativeBackdrop />

      <section className="relative overflow-hidden mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <HeroBackgroundGraphics variant="programs" density="medium" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              AI-curated, neutral guidance
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find the right{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  master&apos;s in Europe
                </span>
                <MarkerSquiggle
                  className="absolute -bottom-2 left-0 h-2.5 w-full text-primary/70 sm:-bottom-3 sm:h-3"
                />
              </span>{" "}
              for you.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              EdFind matches Turkish students to vetted European master&apos;s programs
              using a short quiz, your priorities, and an AI that explains{" "}
              <em>why</em> each program fits — not just which ones rank highest.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {isAuthed ? (
                <>
                  <Button asChild size="lg">
                    <Link href="/quiz">
                      Take the {TOTAL_STEPS}-question quiz
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/search">
                      <Sparkles />
                      Search with AI
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/login?next=/quiz">
                      Sign in to get started
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/catalog">Browse universities</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              {isAuthed
                ? "Signed in — your matches travel with you across devices."
                : "Sign in with Google · Takes about 2 minutes · We never silently boost partner universities"}
            </p>
            <WelcomeTourReplayLink className="mt-3" />
          </div>

          <aside className="relative">
            <MarkerSparkles
              aria-hidden
              className="absolute -right-3 -top-6 size-10 text-primary/40 sm:-right-6 sm:-top-8 sm:size-12"
            />
            <div className="grid grid-cols-3 gap-3">
              <Stat
                icon={<GraduationCap className="size-4" />}
                value={totals.universities}
                label="universities"
              />
              <Stat
                icon={<Award className="size-4" />}
                value={totals.programs}
                label="programs"
              />
              <Stat
                icon={<MapPin className="size-4" />}
                value={totals.countries}
                label="countries"
              />
            </div>

            <div className="relative mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <MarkerArrow
                aria-hidden
                className="absolute -left-10 top-2 hidden h-12 w-14 -rotate-12 text-primary/30 sm:block"
              />
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Compass className="size-4 text-primary" />
                How it works
              </p>
              <ol className="mt-4 space-y-3 text-sm text-foreground">
                <Step n={1}>
                  Answer {TOTAL_STEPS} quick questions — where you&apos;re headed,
                  what you studied, budget, goals — plus an optional note about
                  anything we&apos;d miss.
                </Step>
                <Step n={2}>
                  Our matcher (DeepSeek V4) ranks programs across all{" "}
                  {totals.countries} countries we cover.
                </Step>
                <Step n={3}>
                  See your top 3 matches with a personal rationale for each.
                </Step>
              </ol>
            </div>
          </aside>
        </div>
      </section>

      <section id="featured" className="relative py-12 sm:py-16">
        <Reveal>
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-baseline justify-between">
              <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl">
                Universities from across Europe
                <MarkerStar
                  aria-hidden
                  className="absolute -right-7 -top-3 size-5 text-primary/40 sm:-right-9 sm:-top-4 sm:size-6"
                />
              </h2>
              <p className="hidden text-sm text-muted-foreground sm:block">
                {totals.universities} institutions across {totals.countries}{" "}
                countries — and growing
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-8">
          <UniversityMarquee universities={universities} />
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/catalog">
              Browse the full catalog
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <WelcomeTour totals={totals} isAuthed={isAuthed} />
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <span className="leading-relaxed text-foreground">{children}</span>
    </li>
  );
}

function DecorativeBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden"
    >
      <Drift className="absolute -top-20 left-1/4 size-[500px]" amplitude={18} duration={16}>
        <div className="size-full rounded-full bg-primary/10 opacity-60 blur-3xl" />
      </Drift>
      <Drift
        className="absolute right-1/4 top-40 size-[400px]"
        amplitude={14}
        duration={20}
        delay={1.5}
      >
        <div className="size-full rounded-full bg-secondary/40 blur-3xl" />
      </Drift>
      <svg
        className="absolute inset-x-0 top-0 -z-10 h-64 w-full text-border/40 [mask-image:linear-gradient(to_bottom,white,transparent)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hero-grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
      <MarkerRoute
        className="absolute right-6 top-72 hidden h-24 w-72 text-primary/25 lg:block"
        aria-hidden
      />
    </div>
  );
}
