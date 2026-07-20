"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  CalendarDays,
  GraduationCap,
  Languages,
  MapPin,
  Scale,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/shortlist/save-button";
import { UniversityLogo } from "@/components/university/university-logo";
import {
  MarkerArrow,
  MarkerBookmark,
  MarkerSparkles,
} from "@/components/decor/marker";
import { Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";
import { formatTuition } from "@/lib/format/currency";
import type { Locale } from "@/lib/i18n/config";
import {
  localizeCity,
  localizeCountry,
  localizeField,
  localizeLanguage,
} from "@/lib/i18n/data-labels";

export type ShortlistItem = {
  id: string;
  program_id: string;
  program: {
    slug: string;
    name: string;
    degree: string;
    field_of_study: string;
    language: string;
    duration_months: number;
    tuition_per_year: string | number | null;
    currency: string;
    application_deadline: string | null;
    qs_subject_rank: number | null;
    qs_subject_area: string | null;
    university: {
      slug: string;
      name: string;
      country: string;
      city: string;
      qs_world_rank: number | null;
      is_partner: boolean;
      logo_url: string | null;
    };
  };
};

const COMPARE_MAX = 3;

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

export function ShortlistClient({ items }: { items: ShortlistItem[] }) {
  const t = useTranslations("results.shortlist");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((programId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
        return next;
      }
      if (next.size >= COMPARE_MAX) return prev;
      next.add(programId);
      return next;
    });
  }, []);

  const canCompare = selected.size >= 2;
  const reachedMax = selected.size >= COMPARE_MAX;

  const goToCompare = useCallback(() => {
    if (!canCompare) return;
    const ids = Array.from(selected).join(",");
    router.push(`/compare?ids=${ids}`);
  }, [canCompare, selected, router]);

  const emptyState = items.length === 0;

  const helperText = useMemo(() => {
    if (emptyState) return null;
    if (selected.size === 0) {
      return t("compareHelperZero", { max: COMPARE_MAX });
    }
    if (selected.size === 1) {
      return t("compareHelperOne");
    }
    return reachedMax
      ? t("selectedCountMax", { count: selected.size })
      : t("selectedCount", { count: selected.size });
  }, [emptyState, selected.size, reachedMax, t]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {emptyState
              ? t("emptyDescription")
              : t("countDescription", { count: items.length })}
          </p>
        </div>
        {!emptyState ? (
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-muted-foreground sm:block">
              {helperText}
            </p>
            <Button
              type="button"
              size="sm"
              onClick={goToCompare}
              disabled={!canCompare}
            >
              <Scale />
              {t("compareButton")} {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        ) : null}
      </div>

      {!emptyState ? (
        <p className="mt-3 text-xs text-muted-foreground sm:hidden">
          {helperText}
        </p>
      ) : null}

      {emptyState ? (
        <div className="relative mt-12 overflow-hidden rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <MarkerSparkles
            aria-hidden
            className="absolute left-8 top-6 size-10 text-primary/25"
          />
          <MarkerSparkles
            aria-hidden
            className="absolute right-10 top-12 size-8 -scale-x-100 text-primary/20"
          />
          <div className="relative mx-auto inline-block">
            <MarkerBookmark
              aria-hidden
              className="mx-auto h-20 w-16 text-primary/70"
            />
            <MarkerArrow
              aria-hidden
              className="absolute -right-16 top-2 hidden h-16 w-20 rotate-12 text-primary/50 sm:block"
            />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            {t("empty.heading")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {t("empty.description")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/quiz">{t("empty.takeQuiz")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/search">{t("empty.searchWithAi")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const isSelected = selected.has(item.program_id);
            const { program: p } = item;
            const u = p.university;
            const checkDisabled = !isSelected && reachedMax;
            return (
              <StaggerItem key={item.id}>
                <article
                  className={cn(
                    "group relative flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <label
                    className={cn(
                      "absolute right-4 top-4 flex cursor-pointer select-none items-center gap-2 text-xs font-medium",
                      checkDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "text-foreground",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border accent-primary"
                      checked={isSelected}
                      disabled={checkDisabled}
                      onChange={() => toggle(item.program_id)}
                      aria-label={t("selectForCompare")}
                    />
                    <span className="hidden sm:inline">{t("compareLabel")}</span>
                  </label>

                  <Link
                    href={`/programs/${u.slug}/${p.slug}`}
                    className="flex flex-1 flex-col"
                  >
                    <div className="flex items-start gap-3">
                      <UniversityLogo
                        name={u.name}
                        slug={u.slug}
                        logoUrl={u.logo_url}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <MapPin
                            className="mr-1 inline size-3"
                            aria-hidden="true"
                          />
                          {localizeCity(u.city, locale)}, {localizeCountry(u.country, locale)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {u.name}
                        </p>
                      </div>
                    </div>
                    <h3 className="mt-3 pr-24 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.degree}
                      {u.qs_world_rank ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {t("qsRank", { rank: u.qs_world_rank })}
                        </span>
                      ) : null}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <Pair
                        icon={<GraduationCap className="size-3.5" />}
                        label={t("fields.field")}
                        value={formatField(p.field_of_study, locale)}
                      />
                      <Pair
                        icon={<Wallet className="size-3.5" />}
                        label={t("fields.tuition")}
                        value={formatTuition(
                          p.tuition_per_year,
                          p.currency,
                          "long",
                          locale,
                        )}
                      />
                      <Pair
                        icon={<CalendarDays className="size-3.5" />}
                        label={t("fields.duration")}
                        value={t("fields.durationValue", { count: p.duration_months })}
                      />
                      <Pair
                        icon={<Languages className="size-3.5" />}
                        label={t("fields.language")}
                        value={formatLanguage(p.language, locale)}
                      />
                      {p.qs_subject_rank && p.qs_subject_area ? (
                        <Pair
                          icon={<Award className="size-3.5" />}
                          label={t("fields.subjectRank")}
                          value={t("fields.subjectRankValue", {
                            rank: p.qs_subject_rank,
                            area: localizeField(p.qs_subject_area, locale),
                          })}
                          span={2}
                        />
                      ) : null}
                    </dl>
                  </Link>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <Link
                      href={`/programs/${u.slug}/${p.slug}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t("seeFullDetails")} →
                    </Link>
                    <SaveButton
                      programId={item.program_id}
                      initiallySaved={true}
                      variant="pill"
                      onToggle={(saved) => {
                        // Removed from the shortlist — re-fetch so the stale
                        // card disappears and the count updates immediately.
                        if (!saved) router.refresh();
                      }}
                    />
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}

function Pair({
  icon,
  label,
  value,
  span,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : undefined}>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}
