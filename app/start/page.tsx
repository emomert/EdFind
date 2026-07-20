import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  ListChecks,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  MarkerArrow,
  MarkerSparkles,
  MarkerSquiggle,
} from "@/components/decor/marker";
import { HeroBackgroundGraphics } from "@/components/decor/hero-background-graphics";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { TOTAL_STEPS } from "@/lib/quiz/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home.start.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type Path = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bullets: string[];
  durationLabel: string;
  cta: string;
  recommended: boolean;
};

export default function StartPage() {
  const t = useTranslations("home.start");

  const PATHS: Path[] = [
    {
      href: "/quiz",
      eyebrow: t("paths.quiz.eyebrow"),
      title: t("paths.quiz.title", { totalSteps: TOTAL_STEPS }),
      description: t("paths.quiz.description", { totalSteps: TOTAL_STEPS }),
      icon: <ListChecks className="size-5" />,
      bullets: t.raw("paths.quiz.bullets") as string[],
      durationLabel: t("paths.quiz.duration"),
      cta: t("paths.quiz.cta"),
      recommended: true,
    },
    {
      href: "/search",
      eyebrow: t("paths.search.eyebrow"),
      title: t("paths.search.title"),
      description: t("paths.search.description"),
      icon: <Wand2 className="size-5" />,
      bullets: t.raw("paths.search.bullets") as string[],
      durationLabel: t("paths.search.duration"),
      cta: t("paths.search.cta"),
      recommended: false,
    },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
      >
        <div className="absolute -top-24 left-1/3 size-[420px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute right-1/4 top-32 size-[320px] rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <section className="relative overflow-hidden mx-auto max-w-5xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <HeroBackgroundGraphics variant="programs" density="low" />
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              {t("badge")}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
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
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              {t("subtitle")}
            </p>
          </div>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:gap-6 md:grid-cols-2">
          {PATHS.map((path) => (
            <StaggerItem key={path.href}>
              <Lift>
                <Link
                  href={path.href}
                  className="group relative flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:p-8"
                >
                  {path.recommended ? (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="size-3" />
                      {t("recommended")}
                    </span>
                  ) : null}

                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {path.icon}
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {path.eyebrow}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-3xl">
                    {path.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {path.description}
                  </p>

                  <ul className="mt-5 space-y-2 text-sm">
                    {path.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between pt-7">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {path.durationLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {path.cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Lift>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <div className="relative mt-14 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground sm:p-8">
            <MarkerSparkles
              aria-hidden
              className="absolute -left-4 -top-4 hidden size-10 text-primary/30 sm:block"
            />
            <MarkerArrow
              aria-hidden
              className="absolute -right-2 -top-6 hidden h-14 w-12 -scale-x-100 rotate-12 text-primary/30 sm:block"
            />
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-14">
                <Sparkles className="size-5 sm:size-6" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  {t("footer.title")}
                </p>
                <p className="mt-1.5 leading-relaxed">
                  {t("footer.description")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/catalog">{t("footer.browseCatalog")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
