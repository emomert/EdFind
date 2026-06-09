import {
  BedDouble,
  Building2,
  ExternalLink,
  Home,
  Info,
  MapPin,
  Wallet,
} from "lucide-react";

import type { HousingCity, HousingUniversity } from "@/lib/housing/types";

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

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  // iso is a date string (YYYY-MM-DD). Render month + year without timezone math.
  const [y, m] = iso.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return null;
  return `${months[mi]} ${y}`;
}

function MoneyCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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
  if (!city && !university) return null;

  const cur = city?.currency ?? university?.currency ?? "EUR";
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
        university.currency,
      )
    : null;
  const nearCampus = university
    ? range(
        university.near_campus_monthly_min,
        university.near_campus_monthly_max,
        university.currency,
      )
    : null;

  const researched = formatDate(
    city?.researched_on ?? university?.researched_on ?? null,
  );

  // Dedupe sources by url across city + university.
  const sourceMap = new Map<string, string>();
  for (const s of [...(city?.sources ?? []), ...(university?.sources ?? [])]) {
    if (s?.url && !sourceMap.has(s.url)) sourceMap.set(s.url, s.title || s.url);
  }
  const sources = Array.from(sourceMap, ([url, title]) => ({ url, title }));

  const neighborhoods = city?.student_neighborhoods ?? [];
  const portals = (city?.how_to_find ?? []).filter((p) => p.name);

  return (
    <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Home className="size-5 text-primary" />
          Housing &amp; cost of living
        </h2>
        {researched ? (
          <span className="text-[11px] text-muted-foreground">
            Researched {researched} · estimates, not quotes
          </span>
        ) : null}
      </div>

      {/* City rents + living */}
      {(roomR || studioR || sharedR || livingR) && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">
            Renting in {cityName}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {roomR ? (
              <MoneyCard
                icon={<BedDouble className="size-3.5" />}
                label="Room (shared flat)"
                value={roomR}
                sub="per month"
              />
            ) : null}
            {studioR ? (
              <MoneyCard
                icon={<Home className="size-3.5" />}
                label="Studio"
                value={studioR}
                sub="per month"
              />
            ) : null}
            {sharedR ? (
              <MoneyCard
                icon={<Building2 className="size-3.5" />}
                label="Student housing"
                value={sharedR}
                sub="per month"
              />
            ) : null}
            {livingR ? (
              <MoneyCard
                icon={<Wallet className="size-3.5" />}
                label="Living (ex-rent)"
                value={livingR}
                sub="per month"
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Neighborhoods */}
      {neighborhoods.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MapPin className="size-4 text-primary" />
            Where students live
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {neighborhoods.map((n) => (
              <li
                key={n.name}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-foreground">{n.name}</span>
                {n.note ? (
                  <span className="text-muted-foreground"> — {n.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* University accommodation */}
      {university &&
        (university.has_dorms != null ||
          onCampus ||
          nearCampus ||
          university.housing_office_url ||
          university.dorm_note) && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">
              University accommodation
            </p>
            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {university.has_dorms != null ? (
                <p>
                  <span className="font-medium text-foreground">
                    {university.has_dorms
                      ? "Offers university housing"
                      : "No university housing"}
                  </span>
                  {university.dorm_note ? ` — ${university.dorm_note}` : ""}
                </p>
              ) : university.dorm_note ? (
                <p>{university.dorm_note}</p>
              ) : null}
              {onCampus ? (
                <p>
                  On-campus / managed:{" "}
                  <span className="font-medium text-foreground">{onCampus}</span>
                  /mo
                </p>
              ) : null}
              {nearCampus ? (
                <p>
                  Private near campus:{" "}
                  <span className="font-medium text-foreground">
                    {nearCampus}
                  </span>
                  /mo
                </p>
              ) : null}
              {university.commute_note ? <p>{university.commute_note}</p> : null}
            </div>
            {university.housing_office_url ? (
              <a
                href={university.housing_office_url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                University housing office
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        )}

      {/* Deposit + tips */}
      {(city?.deposit_norms || city?.tips || university?.tips) && (
        <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {city?.deposit_norms ? (
            <p>
              <span className="font-medium text-foreground">Deposits:</span>{" "}
              {city.deposit_norms}
            </p>
          ) : null}
          {city?.tips ? <p>{city.tips}</p> : null}
          {university?.tips ? <p>{university.tips}</p> : null}
        </div>
      )}

      {/* How to find */}
      {portals.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Where to look</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {portals.map((p) =>
              p.url ? (
                <li key={p.name}>
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
                  key={p.name}
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
      <div className="mt-5 border-t border-border pt-3">
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          AI-researched estimates — actual prices vary by year, timing, and
          luck. Always verify current figures before budgeting.
        </p>
        {sources.length > 0 ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Sources:{" "}
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
    </section>
  );
}
