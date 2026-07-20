import { useLocale, useTranslations } from "next-intl";
import {
  BedDouble,
  Building2,
  ChevronDown,
  ExternalLink,
  Home,
  Info,
  MapPin,
  Wallet,
} from "lucide-react";

import type { HousingCity, HousingUniversity } from "@/lib/housing/types";
import { eurEquivalent } from "@/lib/format/currency";
import type { Locale } from "@/lib/i18n/config";
import { localizeCity } from "@/lib/i18n/data-labels";

function fmt(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
}

function range(
  min: number | null,
  max: number | null,
  currency: string,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    if (min === max) return fmt(min, currency);
    return `${fmt(min, currency)} – ${fmt(max, currency)}`;
  }
  return fmt((min ?? max) as number, currency);
}

// EUR equivalent of a min/max range. Returns null for EUR-priced data (no
// conversion needed) or unknown currencies. Turkish students budget in euros,
// so every non-EUR figure carries an "≈ €…" tail — same convention as the
// tuition formatter (lib/format/currency.ts).
function eurRange(
  min: number | null,
  max: number | null,
  currency: string,
): string | null {
  if (currency === "EUR") return null;
  const eMin = min != null ? eurEquivalent(min, currency) : null;
  const eMax = max != null ? eurEquivalent(max, currency) : null;
  if (eMin == null && eMax == null) return null;
  return range(eMin, eMax, "EUR");
}

function formatDate(iso: string | null, locale: Locale): string | null {
  if (!iso) return null;
  // iso is a date string (YYYY-MM-DD). Render month + year without timezone math.
  const [y, m] = iso.split("-");
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return null;
  return new Date(Number(y), mi, 1).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-GB",
    { month: "short", year: "numeric" },
  );
}

function MoneyCard({
  icon,
  label,
  value,
  eur,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  eur?: string | null;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {eur ? (
        <p className="text-[11px] font-medium tabular-nums text-primary/80">
          ≈ {eur}
        </p>
      ) : null}
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function HousingSection({
  city,
  university,
  cityName,
}: {
  city: HousingCity | null;
  university: HousingUniversity | null;
  cityName: string;
}) {
  const t = useTranslations("university");
  const locale = useLocale() as Locale;

  if (!city && !university) return null;

  const cur = city?.currency ?? university?.currency ?? "EUR";
  const uniCur = university?.currency ?? cur;

  const roomR = city ? range(city.rent_room_min, city.rent_room_max, cur) : null;
  const studioR = city
    ? range(city.rent_studio_min, city.rent_studio_max, cur)
    : null;
  const sharedR = city
    ? range(city.rent_shared_min, city.rent_shared_max, cur)
    : null;
  const livingR = city
    ? range(city.monthly_living_min, city.monthly_living_max, cur)
    : null;
  const onCampus = university
    ? range(
        university.on_campus_monthly_min,
        university.on_campus_monthly_max,
        uniCur,
      )
    : null;
  const nearCampus = university
    ? range(
        university.near_campus_monthly_min,
        university.near_campus_monthly_max,
        uniCur,
      )
    : null;
  // Computed once and reused below (eurRange does conversion + formatting).
  const onCampusEur = university
    ? eurRange(
        university.on_campus_monthly_min,
        university.on_campus_monthly_max,
        uniCur,
      )
    : null;
  const nearCampusEur = university
    ? eurRange(
        university.near_campus_monthly_min,
        university.near_campus_monthly_max,
        uniCur,
      )
    : null;

  const researched = formatDate(
    city?.researched_on ?? university?.researched_on ?? null,
    locale,
  );

  // Dedupe sources by url across city + university.
  const sourceMap = new Map<string, string>();
  for (const s of [...(city?.sources ?? []), ...(university?.sources ?? [])]) {
    if (s?.url && !sourceMap.has(s.url)) sourceMap.set(s.url, s.title || s.url);
  }
  const sources = Array.from(sourceMap, ([url, title]) => ({ url, title }));

  const neighborhoods = city?.student_neighborhoods ?? [];
  const portals = (city?.how_to_find ?? []).filter((p) => p.name);

  const hasUniBlock =
    university != null &&
    (university.has_dorms != null ||
      onCampus ||
      nearCampus ||
      university.housing_office_url ||
      university.dorm_note);

  // Everything below the headline rent figures is tucked into an expander so
  // the section reads as a quick cost summary first, detail on demand.
  const hasMore =
    neighborhoods.length > 0 ||
    hasUniBlock ||
    Boolean(city?.deposit_norms || city?.tips || university?.tips) ||
    portals.length > 0 ||
    sources.length > 0;

  return (
    <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Home className="size-5 text-primary" />
          {t("housing.heading")}
        </h2>
        {researched ? (
          <span className="text-[11px] text-muted-foreground">
            {t("housing.researched", { date: researched })}
          </span>
        ) : null}
      </div>

      {/* SUMMARY — the headline monthly figures, always visible. */}
      {(roomR || studioR || sharedR || livingR) && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">
            {t("housing.rentingIn", { city: localizeCity(cityName, locale) })}
            {cur !== "EUR" ? (
              <span className="ml-1 font-normal text-muted-foreground">
                {t("housing.localPricesNote")}
              </span>
            ) : null}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {roomR ? (
              <MoneyCard
                icon={<BedDouble className="size-3.5" />}
                label={t("housing.room")}
                value={roomR}
                eur={eurRange(city!.rent_room_min, city!.rent_room_max, cur)}
                sub={t("housing.perMonth")}
              />
            ) : null}
            {studioR ? (
              <MoneyCard
                icon={<Home className="size-3.5" />}
                label={t("housing.studio")}
                value={studioR}
                eur={eurRange(city!.rent_studio_min, city!.rent_studio_max, cur)}
                sub={t("housing.perMonth")}
              />
            ) : null}
            {sharedR ? (
              <MoneyCard
                icon={<Building2 className="size-3.5" />}
                label={t("housing.studentHousing")}
                value={sharedR}
                eur={eurRange(city!.rent_shared_min, city!.rent_shared_max, cur)}
                sub={t("housing.perMonth")}
              />
            ) : null}
            {livingR ? (
              <MoneyCard
                icon={<Wallet className="size-3.5" />}
                label={t("housing.livingExRent")}
                value={livingR}
                eur={eurRange(
                  city!.monthly_living_min,
                  city!.monthly_living_max,
                  cur,
                )}
                sub={t("housing.perMonth")}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* DETAIL — neighborhoods, university housing, tips, sources. Collapsed
          by default (native <details> so it works without client JS). */}
      {hasMore && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            {t("housing.seeFullBreakdown", { city: localizeCity(cityName, locale) })}
          </summary>

          <div className="mt-4 space-y-4">
            {/* Neighborhoods */}
            {neighborhoods.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <MapPin className="size-4 text-primary" />
                  {t("housing.whereStudentsLive")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {neighborhoods.map((n) => (
                    <li
                      key={n.name}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-foreground">
                        {n.name}
                      </span>
                      {n.note ? (
                        <span className="text-muted-foreground"> — {n.note}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* University accommodation */}
            {hasUniBlock && university && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  {t("housing.universityAccommodation")}
                </p>
                <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {university.has_dorms != null ? (
                    <p>
                      <span className="font-medium text-foreground">
                        {university.has_dorms
                          ? t("housing.offersHousing")
                          : t("housing.noHousing")}
                      </span>
                      {university.dorm_note ? ` — ${university.dorm_note}` : ""}
                    </p>
                  ) : university.dorm_note ? (
                    <p>{university.dorm_note}</p>
                  ) : null}
                  {onCampus ? (
                    <p>
                      {t("housing.onCampus")}{" "}
                      <span className="font-medium text-foreground">
                        {onCampus}
                      </span>
                      {t("housing.perMonthSuffix")}
                      {onCampusEur ? (
                        <span className="text-primary/80">
                          {" "}
                          (≈ {onCampusEur}
                          {t("housing.perMonthSuffix")})
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {nearCampus ? (
                    <p>
                      {t("housing.nearCampus")}{" "}
                      <span className="font-medium text-foreground">
                        {nearCampus}
                      </span>
                      {t("housing.perMonthSuffix")}
                      {nearCampusEur ? (
                        <span className="text-primary/80">
                          {" "}
                          (≈ {nearCampusEur}
                          {t("housing.perMonthSuffix")})
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {university.commute_note ? (
                    <p>{university.commute_note}</p>
                  ) : null}
                </div>
                {university.housing_office_url ? (
                  <a
                    href={university.housing_office_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t("housing.housingOfficeLink")}
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            )}

            {/* Deposit + tips */}
            {(city?.deposit_norms || city?.tips || university?.tips) && (
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {city?.deposit_norms ? (
                  <p>
                    <span className="font-medium text-foreground">
                      {t("housing.deposits")}
                    </span>{" "}
                    {city.deposit_norms}
                  </p>
                ) : null}
                {city?.tips ? <p>{city.tips}</p> : null}
                {university?.tips ? <p>{university.tips}</p> : null}
              </div>
            )}

            {/* How to find */}
            {portals.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("housing.whereToLook")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {portals.map((p) =>
                    p.url ? (
                      <li key={`${p.name}-${p.url ?? ""}`}>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary hover:underline"
                        >
                          {p.name}
                          <ExternalLink className="size-3" />
                        </a>
                      </li>
                    ) : (
                      <li
                        key={`${p.name}-${p.url ?? ""}`}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                      >
                        {p.name}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Sources + disclaimer */}
            <div className="border-t border-border pt-3">
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {t("housing.disclaimer")}
              </p>
              {sources.length > 0 ? (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {t("housing.sourcesLabel")}{" "}
                  {sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 ? " · " : ""}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary hover:underline"
                      >
                        {s.title}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </div>
        </details>
      )}
    </section>
  );
}
