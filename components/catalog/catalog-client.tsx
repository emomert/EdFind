"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  COUNTRY_NAMES,
  FIELD_LABELS,
} from "@/components/applications/types";
import { UniversityLogo } from "@/components/university/university-logo";
import { HeroBackgroundGraphics } from "@/components/decor/hero-background-graphics";

export type CatalogUniversity = {
  slug: string;
  name: string;
  country: string;
  city: string;
  institution_type: string | null;
  established_year: number | null;
  student_count: number | null;
  qs_world_rank: number | null;
  is_partner: boolean;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  program_count: number;
};

export type CatalogProgram = {
  slug: string;
  name: string;
  degree: string;
  field_of_study: string;
  language: string;
  duration_months: number;
  tuition_per_year: number | null;
  currency: string;
  application_deadline: string | null;
  start_month: string | null;
  university_slug: string;
  university_name: string;
  university_country: string;
  university_city: string;
  university_logo_url: string | null;
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
  it: "Italian",
  fr: "French",
  es: "Spanish",
  nl: "Dutch",
};

type Tab = "universities" | "programs";
type UniSort = "name" | "rank" | "country";
type ProgSort = "name" | "tuition_asc" | "tuition_desc" | "duration";

export function CatalogClient({
  universities,
  programs,
}: {
  universities: CatalogUniversity[];
  programs: CatalogProgram[];
}) {
  const [tab, setTab] = useState<Tab>("universities");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [field, setField] = useState("");
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState("");
  const [partnerOnly, setPartnerOnly] = useState(false);
  const [uniSort, setUniSort] = useState<UniSort>("rank");
  const [progSort, setProgSort] = useState<ProgSort>("name");

  // ─── Derive country / field / language lists from data ──────────────
  const countries = useMemo(() => {
    const codes = new Set<string>();
    universities.forEach((u) => codes.add(u.country));
    return Array.from(codes)
      .map((code) => ({ code, name: COUNTRY_NAMES[code] || code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [universities]);

  const fields = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => p.field_of_study && set.add(p.field_of_study));
    return Array.from(set)
      .map((value) => ({ value, label: FIELD_LABELS[value] || value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [programs]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => p.language && set.add(p.language));
    return Array.from(set)
      .map((value) => ({ value, label: LANG_NAMES[value] || value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [programs]);

  // ─── Filter passes ──────────────────────────────────────────────────
  const filteredUniversities = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = universities.filter((u) => {
      if (country && u.country !== country) return false;
      if (partnerOnly && !u.is_partner) return false;
      if (q) {
        const hay = `${u.name} ${u.city} ${COUNTRY_NAMES[u.country] || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (uniSort) {
      case "name":
        rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "country":
        rows = [...rows].sort(
          (a, b) =>
            a.country.localeCompare(b.country) || a.name.localeCompare(b.name),
        );
        break;
      case "rank":
      default:
        rows = [...rows].sort((a, b) => {
          const ar = a.qs_world_rank ?? 99999;
          const br = b.qs_world_rank ?? 99999;
          if (ar !== br) return ar - br;
          return a.name.localeCompare(b.name);
        });
    }
    return rows;
  }, [universities, query, country, partnerOnly, uniSort]);

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = programs.filter((p) => {
      if (country && p.university_country !== country) return false;
      if (field && p.field_of_study !== field) return false;
      if (language && p.language !== language) return false;
      if (duration && String(p.duration_months) !== duration) return false;
      if (q) {
        const hay = `${p.name} ${p.university_name} ${p.degree}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (progSort) {
      case "tuition_asc":
        rows = [...rows].sort(
          (a, b) =>
            (a.tuition_per_year ?? Infinity) - (b.tuition_per_year ?? Infinity),
        );
        break;
      case "tuition_desc":
        rows = [...rows].sort(
          (a, b) =>
            (b.tuition_per_year ?? -Infinity) -
            (a.tuition_per_year ?? -Infinity),
        );
        break;
      case "duration":
        rows = [...rows].sort((a, b) => a.duration_months - b.duration_months);
        break;
      case "name":
      default:
        rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    }
    return rows;
  }, [programs, query, country, field, language, duration, progSort]);

  const showProgramFilters = tab === "programs";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
    >
      {/* Hero — borderless and very lightly tinted so the surrounding page
          background flows through it. The HeroBackgroundGraphics blobs bleed
          past the rounded edges and carry that gradient outward. */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50/40 via-transparent to-emerald-50/40 p-6 sm:p-10">
        <HeroBackgroundGraphics variant="programs" density="medium" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.5fr,auto] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 shadow-sm ring-1 ring-inset ring-teal-200">
              <Sparkles className="size-3.5" />
              EdFind Catalog
            </span>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Browse every university and master&apos;s program{" "}
              <span className="text-teal-700">we&apos;ve verified.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Filter by country, field, language, or tuition — or jump straight
              to a university you already have in mind. Every entry links to a
              detailed program page.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <Stat n={universities.length} label="Universities" />
            <Stat n={programs.length} label="Programs" />
            <Stat n={countries.length} label="Countries" />
          </dl>
        </div>
      </header>

      {/* Tabs */}
      <div className="mt-6 overflow-x-auto" role="tablist">
        <div className="flex min-w-fit gap-1 border-b border-slate-200">
          {(
            [
              {
                key: "universities",
                label: "Universities",
                icon: <Building2 className="size-3.5" />,
                count: filteredUniversities.length,
              },
              {
                key: "programs",
                label: "Programs",
                icon: <GraduationCap className="size-3.5" />,
                count: filteredPrograms.length,
              },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-teal-700" : "text-slate-500 hover:text-slate-800",
                )}
              >
                <span className={active ? "text-teal-600" : "text-slate-400"}>
                  {t.icon}
                </span>
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {t.count}
                </span>
                {active && (
                  <motion.span
                    layoutId="catalog-tab-underline"
                    className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-teal-500"
                    transition={{ duration: 0.25 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                tab === "universities"
                  ? "Search universities or cities…"
                  : "Search programs by name…"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          {showProgramFilters && (
            <>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All fields</option>
                {fields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All languages</option>
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="">Any duration</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
              </select>
            </>
          )}

          {tab === "universities" && (
            <button
              type="button"
              onClick={() => setPartnerOnly((p) => !p)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                partnerOnly
                  ? "border-teal-300 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
              aria-pressed={partnerOnly}
            >
              <Star
                className={cn(
                  "size-3.5",
                  partnerOnly ? "fill-teal-500 text-teal-500" : "text-slate-400",
                )}
              />
              Partner only
            </button>
          )}

          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1 text-xs text-slate-600">
            <SlidersHorizontal className="ml-1 size-3 text-slate-400" />
            {tab === "universities" ? (
              <select
                value={uniSort}
                onChange={(e) => setUniSort(e.target.value as UniSort)}
                className="rounded-full bg-transparent px-2 py-1 text-xs focus:outline-none"
              >
                <option value="rank">Sort: QS rank</option>
                <option value="name">Sort: Name (A→Z)</option>
                <option value="country">Sort: Country</option>
              </select>
            ) : (
              <select
                value={progSort}
                onChange={(e) => setProgSort(e.target.value as ProgSort)}
                className="rounded-full bg-transparent px-2 py-1 text-xs focus:outline-none"
              >
                <option value="name">Sort: Name (A→Z)</option>
                <option value="tuition_asc">Sort: Tuition (low→high)</option>
                <option value="tuition_desc">Sort: Tuition (high→low)</option>
                <option value="duration">Sort: Duration</option>
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mt-6">
        {tab === "universities" ? (
          filteredUniversities.length === 0 ? (
            <EmptyState message="No universities match these filters." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUniversities.map((u) => (
                <UniversityCard key={u.slug} uni={u} />
              ))}
            </div>
          )
        ) : filteredPrograms.length === 0 ? (
          <EmptyState message="No programs match these filters." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredPrograms.map((p) => (
              <ProgramCard key={`${p.university_slug}/${p.slug}`} prog={p} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-inset ring-teal-100">
      <p className="font-mono text-2xl font-semibold tabular-nums text-teal-700">
        {n}
      </p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function UniversityCard({ uni }: { uni: CatalogUniversity }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <Link
        href={`/universities/${uni.slug}`}
        className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:border-teal-200 hover:shadow-[0_12px_30px_-20px_rgba(13,148,136,0.35)] sm:p-5"
      >
        <div className="flex items-start gap-3">
          <UniversityLogo
            name={uni.name}
            slug={uni.slug}
            logoUrl={uni.logo_url}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold tracking-tight text-slate-900 group-hover:text-teal-700">
              {uni.name}
            </h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="size-3 text-slate-400" />
              {uni.city}, {COUNTRY_NAMES[uni.country] || uni.country}
            </p>
          </div>
          {uni.is_partner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              <Star className="size-2.5 fill-amber-400 text-amber-500" />
              Partner
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {uni.qs_world_rank != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
              QS #{uni.qs_world_rank}
            </span>
          )}
          {uni.institution_type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600 ring-1 ring-inset ring-slate-200 capitalize">
              {uni.institution_type}
            </span>
          )}
          {uni.established_year != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              Est. {uni.established_year}
            </span>
          )}
        </div>

        {uni.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
            {uni.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="size-3.5 text-slate-400" />
            {uni.program_count} {uni.program_count === 1 ? "program" : "programs"}
          </span>
          <span className="inline-flex items-center gap-1 text-teal-700 group-hover:underline">
            View university
            <ExternalLink className="size-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function ProgramCard({ prog }: { prog: CatalogProgram }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/programs/${prog.university_slug}/${prog.slug}`}
        className="group flex h-full flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:border-teal-200 hover:shadow-[0_10px_28px_-18px_rgba(13,148,136,0.3)] sm:p-5"
      >
        <div className="flex items-start gap-3">
          <UniversityLogo
            name={prog.university_name}
            slug={prog.university_slug}
            logoUrl={prog.university_logo_url}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 ring-1 ring-inset ring-violet-200">
                <GraduationCap className="size-2.5" />
                {prog.degree}
              </span>
            </p>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight text-slate-900 group-hover:text-teal-700">
              {prog.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              ↳ <span className="font-medium text-slate-600">{prog.university_name}</span>
              <span> · {prog.university_city}, {COUNTRY_NAMES[prog.university_country] || prog.university_country}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
            {FIELD_LABELS[prog.field_of_study] || prog.field_of_study}
          </span>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700 ring-1 ring-inset ring-teal-200 uppercase">
            {prog.language}
          </span>
          <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
            {prog.duration_months} mo
          </span>
          {prog.tuition_per_year != null && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              {Math.round(prog.tuition_per_year).toLocaleString()} {prog.currency}/yr
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
          {prog.application_deadline ? (
            <span>
              Apply by{" "}
              {new Date(prog.application_deadline).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ) : (
            <span>{prog.start_month ? `Starts ${prog.start_month}` : "Year-round intake"}</span>
          )}
          <span className="inline-flex items-center gap-1 text-teal-700 group-hover:underline">
            View program
            <ExternalLink className="size-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
