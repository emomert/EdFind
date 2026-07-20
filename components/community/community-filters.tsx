"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { SelectPill } from "@/components/ui/select-pill";

export type CommunityFilterValues = {
  query: string;
  country: string;
  universitySlug: string;
  field: string;
  verifiedOnly: boolean;
  groupType: "all" | "university" | "program";
  sort: "most_helpful" | "most_active" | "most_recent" | "most_members" | "highest_rated";
};

// Maps each sort value to its translation key under community.filters.sort.
const SORT_LABEL_KEYS: Record<CommunityFilterValues["sort"], string> = {
  most_helpful: "mostHelpful",
  most_active: "mostActive",
  most_recent: "mostRecent",
  most_members: "mostMembers",
  highest_rated: "highestRated",
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
  const t = useTranslations("community.filters");
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={values.query}
            onChange={(e) => onChange({ ...values, query: e.target.value })}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <SelectPill
          ariaLabel={t("countryAriaLabel")}
          value={values.country}
          onChange={(country) => onChange({ ...values, country })}
          options={[
            { value: "", label: t("allCountries") },
            ...countries.map((c) => ({ value: c.code, label: c.name })),
          ]}
        />

        <SelectPill
          ariaLabel={t("universityAriaLabel")}
          className="max-w-[260px]"
          panelClassName="w-[300px]"
          value={values.universitySlug}
          onChange={(universitySlug) => onChange({ ...values, universitySlug })}
          options={[
            { value: "", label: t("allUniversities") },
            ...universities.map((u) => ({ value: u.slug, label: u.name })),
          ]}
        />

        <SelectPill
          ariaLabel={t("fieldAriaLabel")}
          value={values.field}
          onChange={(field) => onChange({ ...values, field })}
          options={[
            { value: "", label: t("allFields") },
            ...fields.map((f) => ({ value: f.value, label: f.label })),
          ]}
        />

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
          {t("verifiedOnly")}
        </button>

        <SelectPill
          ariaLabel={t("sortAriaLabel")}
          prefix={t("sortPrefix")}
          value={values.sort}
          onChange={(sort) =>
            onChange({ ...values, sort: sort as CommunityFilterValues["sort"] })
          }
          options={(
            Object.keys(SORT_LABEL_KEYS) as Array<keyof typeof SORT_LABEL_KEYS>
          ).map((k) => ({ value: k, label: t(`sort.${SORT_LABEL_KEYS[k]}`) }))}
        />
      </div>
    </section>
  );
}
