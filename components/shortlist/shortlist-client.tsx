"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Bookmark,
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
import { cn } from "@/lib/utils";

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

function formatField(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

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

export function ShortlistClient({ items }: { items: ShortlistItem[] }) {
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
      return `Tick at least 2 programs to compare side-by-side (up to ${COMPARE_MAX}).`;
    }
    if (selected.size === 1) {
      return "Select one more to compare.";
    }
    return `${selected.size} selected${reachedMax ? " (max)" : ""}.`;
  }, [emptyState, selected.size, reachedMax]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your shortlist
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {emptyState
              ? "You haven't saved any programs yet."
              : `${items.length} program${items.length === 1 ? "" : "s"} saved.`}
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
              Compare {selected.size > 0 ? `(${selected.size})` : ""}
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
        <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Bookmark
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            Nothing saved yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Hit the save button on any program card or detail page and it&apos;ll
            show up here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/quiz">Take the quiz</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/search">Search with AI</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const isSelected = selected.has(item.program_id);
            const { program: p } = item;
            const u = p.university;
            const checkDisabled = !isSelected && reachedMax;
            return (
              <li key={item.id}>
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
                      aria-label="Select for compare"
                    />
                    <span className="hidden sm:inline">Compare</span>
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
                          {u.city}, {u.country}
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
                          QS #{u.qs_world_rank}
                        </span>
                      ) : null}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <Pair
                        icon={<GraduationCap className="size-3.5" />}
                        label="Field"
                        value={formatField(p.field_of_study)}
                      />
                      <Pair
                        icon={<Wallet className="size-3.5" />}
                        label="Tuition"
                        value={formatTuition(p.tuition_per_year, p.currency)}
                      />
                      <Pair
                        icon={<CalendarDays className="size-3.5" />}
                        label="Duration"
                        value={`${p.duration_months} months`}
                      />
                      <Pair
                        icon={<Languages className="size-3.5" />}
                        label="Language"
                        value={formatLanguage(p.language)}
                      />
                      {p.qs_subject_rank && p.qs_subject_area ? (
                        <Pair
                          icon={<Award className="size-3.5" />}
                          label="Subject rank"
                          value={`#${p.qs_subject_rank} ${p.qs_subject_area}`}
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
                      See full details →
                    </Link>
                    <SaveButton
                      programId={item.program_id}
                      initiallySaved={true}
                      variant="pill"
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
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
