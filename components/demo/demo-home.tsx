"use client";

import { ArrowRight, Award, Compass, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  MarkerArrow,
  MarkerRoute,
  MarkerSparkles,
  MarkerSquiggle,
  MarkerStar,
} from "@/components/decor/marker";
import { EuropeSkyline } from "@/components/decor/europe-skyline";
import { HeroBackgroundGraphics } from "@/components/decor/hero-background-graphics";
import { Drift, Reveal } from "@/components/motion";
import { TOTAL_STEPS } from "@/lib/quiz/schema";

/**
 * Faithful re-render of the homepage hero for the demo's opening phase. Mirrors
 * app/page.tsx's hero (copy, layout, decor) but with static catalog totals and
 * a Take-the-quiz CTA the orchestrator can target with the fake cursor — so the
 * demo can open on "the main page" and visibly click into the quiz without the
 * homepage's DB dependency.
 */

// Current catalog totals (kept in sync with CLAUDE.md's stated state).
const TOTALS = { universities: 58, programs: 196, countries: 15 };

export function DemoHome({ onStart }: { onStart: () => void }) {
  const t = useTranslations("demo.home");

  return (
    <div className="relative">
        <DecorativeBackdrop />

        <section className="relative overflow-hidden mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pb-24 sm:pt-24">
          <HeroBackgroundGraphics variant="programs" density="medium" />
          <EuropeSkyline className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-24 w-full text-primary/15 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:block" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" />
                {t("badge")}
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t.rich("title", {
                  highlight: (chunks) => (
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/75 bg-clip-text text-transparent">
                        {chunks}
                      </span>
                      <MarkerSquiggle className="absolute -bottom-2 left-0 h-2.5 w-full text-primary/70 sm:-bottom-3 sm:h-3" />
                    </span>
                  ),
                })}
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
                {t.rich("intro", { em: (chunks) => <em>{chunks}</em> })}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button data-demo="start" size="lg" onClick={onStart}>
                  {t("ctaQuiz", { count: TOTAL_STEPS })}
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" onClick={onStart}>
                  <Sparkles />
                  {t("ctaSearch")}
                </Button>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                {t("signInNote")}
              </p>
            </div>

            <aside className="relative">
              <MarkerSparkles
                aria-hidden
                className="absolute -right-3 -top-6 size-10 text-primary/40 sm:-right-6 sm:-top-8 sm:size-12"
              />
              <div className="grid grid-cols-3 gap-3">
                <Stat
                  icon={<GraduationCap className="size-4" />}
                  value={TOTALS.universities}
                  label={t("statUniversities")}
                />
                <Stat
                  icon={<Award className="size-4" />}
                  value={TOTALS.programs}
                  label={t("statPrograms")}
                />
                <Stat
                  icon={<MapPin className="size-4" />}
                  value={TOTALS.countries}
                  label={t("statCountries")}
                />
              </div>

              <div className="relative mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <MarkerArrow
                  aria-hidden
                  className="absolute -left-10 top-2 hidden h-12 w-14 -rotate-12 text-primary/30 sm:block"
                />
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Compass className="size-4 text-primary" />
                  {t("howItWorksTitle")}
                </p>
                <ol className="mt-4 space-y-3 text-sm text-foreground">
                  <Step n={1}>
                    {t("step1", { count: TOTAL_STEPS })}
                  </Step>
                  <Step n={2}>
                    {t("step2", { countries: TOTALS.countries })}
                  </Step>
                  <Step n={3}>{t("step3")}</Step>
                </ol>
              </div>
            </aside>
          </div>
        </section>

        <section className="relative py-12 sm:py-16">
          <Reveal>
            <div className="mx-auto max-w-6xl px-6">
              <div className="flex items-baseline justify-between">
                <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t("universitiesHeading")}
                  <MarkerStar
                    aria-hidden
                    className="absolute -right-7 -top-3 size-5 text-primary/40 sm:-right-9 sm:-top-4 sm:size-6"
                  />
                </h2>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {t("universitiesSubtitle", {
                    universities: TOTALS.universities,
                    countries: TOTALS.countries,
                  })}
                </p>
              </div>
            </div>
          </Reveal>
        </section>
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
        <div className="size-full rounded-full bg-primary/[0.06] opacity-60 blur-3xl" />
      </Drift>
      <Drift
        className="absolute right-1/4 top-40 size-[400px]"
        amplitude={14}
        duration={20}
        delay={1.5}
      >
        <div className="size-full rounded-full bg-secondary/25 blur-3xl" />
      </Drift>
      <MarkerRoute
        className="absolute right-6 top-72 hidden h-24 w-72 text-primary/25 lg:block"
        aria-hidden
      />
    </div>
  );
}
