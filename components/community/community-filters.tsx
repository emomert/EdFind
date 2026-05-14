"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

export type CommunityFilterValues = {
  query: string;
  country: string;
  universitySlug: string;
  field: string;
  verifiedOnly: boolean;
  groupType: "all" | "university" | "program";
  sort: "most_helpful" | "most_active" | "most_recent" | "most_members" | "highest_rated";
};

export const SORT_LABELS: Record<CommunityFilterValues["sort"], string> = {
  most_helpful: "Most helpful",
  most_active: "Most active",
  most_recent: "Most recent",
  most_members: "Most members",
  highest_rated: "Highest rated",
};

export function CommunityFilters({
  values,
  onChange,
  countries,
  universities,
  fields,
}: {
  values: CommunityFilterValues;
  onChange: (next: CommunityFilterValues) => void;
  countries: { code: string; name: string }[];
  universities: { slug: string; name: string }[];
  fields: { value: string; label: string }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews, groups, questions…"
            value={values.query}
            onChange={(e) => onChange({ ...values, query: e.target.value })}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <select
          value={values.country}
          onChange={(e) => onChange({ ...values, country: e.target.value })}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={values.universitySlug}
          onChange={(e) => onChange({ ...values, universitySlug: e.target.value })}
          className="max-w-[260px] rounded-full border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          <option value="">All universities</option>
          {universities.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={values.field}
          onChange={(e) => onChange({ ...values, field: e.target.value })}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          <option value="">All fields</option>
          {fields.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onChange({ ...values, verifiedOnly: !values.verifiedOnly })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
            values.verifiedOnly
              ? "border-teal-300 bg-teal-50 text-teal-800"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          )}
          aria-pressed={values.verifiedOnly}
        >
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              values.verifiedOnly ? "bg-teal-500" : "bg-slate-300",
            )}
          />
          Verified only
        </button>

        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1 text-xs text-slate-600">
          <SlidersHorizontal className="ml-1 size-3 text-slate-400" />
          <select
            value={values.sort}
            onChange={(e) =>
              onChange({
                ...values,
                sort: e.target.value as CommunityFilterValues["sort"],
              })
            }
            className="rounded-full bg-transparent px-2 py-1 text-xs focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).map(
              (k) => (
                <option key={k} value={k}>
                  Sort: {SORT_LABELS[k]}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
    </section>
  );
}
