import Link from "next/link";
import { getLocale } from "next-intl/server";

import { UniversityLogo } from "@/components/university/university-logo";
import { COUNTRY_NAMES } from "@/components/applications/types";
import { localizeCountry, localizeCity } from "@/lib/i18n/data-labels";
import type { Locale } from "@/lib/i18n/config";

export type MarqueeUniversity = {
  slug: string;
  name: string;
  country: string;
  city: string;
  logo_url: string | null;
  qs_world_rank: number | null;
};

function MarqueeRow({
  items,
  reverse = false,
  locale,
}: {
  items: MarqueeUniversity[];
  reverse?: boolean;
  locale: Locale;
}) {
  // Two copies so the -50% slide loops seamlessly. The second copy is a visual
  // clone — hidden from assistive tech and removed from the tab order.
  const loop = [...items, ...items];
  return (
    <div className="edfind-marquee-wrap relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <ul
        className={`edfind-marquee-track flex items-stretch gap-3 py-1${
          reverse ? " is-reverse" : ""
        }`}
      >
        {loop.map((u, i) => {
          const isClone = i >= items.length;
          const countryName = localizeCountry(
            COUNTRY_NAMES[u.country] || u.country,
            locale,
          );
          const cityName = localizeCity(u.city, locale);
          return (
            <li key={`${u.slug}-${i}`} aria-hidden={isClone || undefined}>
              <Link
                href={`/universities/${u.slug}`}
                tabIndex={isClone ? -1 : undefined}
                className="group flex h-full w-64 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <UniversityLogo
                  name={u.name}
                  slug={u.slug}
                  logoUrl={u.logo_url}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {u.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {cityName}, {countryName}
                    {u.qs_world_rank ? ` · QS #${u.qs_world_rank}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Two rows of university cards that continuously flow in opposite directions.
 * Pure-CSS (no JS), pauses on hover, and respects prefers-reduced-motion.
 */
export async function UniversityMarquee({
  universities,
}: {
  universities: MarqueeUniversity[];
}) {
  if (universities.length === 0) return null;
  const locale = await getLocale();
  const mid = Math.ceil(universities.length / 2);
  const rowA = universities.slice(0, mid);
  const rowB = universities.length >= 8 ? universities.slice(mid) : universities;
  return (
    <div className="space-y-3">
      <MarqueeRow items={rowA} locale={locale as Locale} />
      <MarqueeRow items={rowB} reverse locale={locale as Locale} />
    </div>
  );
}
