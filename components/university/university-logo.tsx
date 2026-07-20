import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * UniversityLogo — visual identity for a university card or header.
 *
 * Renders the official logo from `logo_url` when present, otherwise falls
 * back to a deterministically coloured tile with the university's initials.
 * The fallback also kicks in if the image errors at runtime (network blip,
 * deleted bucket object) — handled in the wrapping client component
 * `UniversityLogoImage` so the SSR shell stays a Server Component.
 *
 * `size` covers the common visual sizes; use the `xs` variant for inline
 * pills (header search, compare table cells) and `lg` for the university
 * detail page hero.
 */

export type UniversityLogoSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<UniversityLogoSize, number> = {
  xs: 24,
  sm: 40,
  md: 64,
  lg: 96,
};

const SIZE_TEXT: Record<UniversityLogoSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

export function UniversityLogo({
  name,
  slug,
  logoUrl,
  size = "sm",
  className,
}: {
  name: string;
  slug: string;
  logoUrl: string | null | undefined;
  size?: UniversityLogoSize;
  className?: string;
}) {
  const t = useTranslations("university");
  const px = SIZE_PX[size];
  const baseClass = [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white shadow-sm",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (logoUrl) {
    return (
      <span
        className={baseClass}
        style={{ width: px, height: px }}
        aria-label={t("logo.altLabel", { name })}
        role="img"
      >
        <Image
          src={logoUrl}
          alt=""
          width={px}
          height={px}
          className="size-full object-contain p-1"
          unoptimized={logoUrl.endsWith(".svg")}
        />
      </span>
    );
  }

  return (
    <InitialsTile name={name} slug={slug} size={size} className={baseClass} />
  );
}

function InitialsTile({
  name,
  slug,
  size,
  className,
}: {
  name: string;
  slug: string;
  size: UniversityLogoSize;
  className: string;
}) {
  const t = useTranslations("university");
  const px = SIZE_PX[size];
  const initials = computeInitials(name);
  const palette = pickPalette(slug);
  return (
    <span
      className={`${className} text-foreground`}
      style={{
        width: px,
        height: px,
        background: palette.bg,
        color: palette.fg,
      }}
      aria-label={t("logo.altLabel", { name })}
      role="img"
    >
      <span
        className={`font-semibold tracking-tight ${SIZE_TEXT[size]}`}
        aria-hidden="true"
      >
        {initials}
      </span>
    </span>
  );
}

function computeInitials(name: string): string {
  // Drop noise words so "The University of Edinburgh" → "UE" not "TUOE".
  const stop = new Set([
    "the",
    "of",
    "and",
    "&",
    "in",
    "at",
    "for",
    "de",
    "di",
    "du",
    "der",
    "des",
    "la",
    "le",
    "el",
    "von",
    "van",
  ]);
  const tokens = name
    .replace(/[()\[\],.:;]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !stop.has(w.toLowerCase()));
  if (tokens.length === 0) return name.slice(0, 2).toUpperCase();
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[1][0]).toUpperCase();
}

// 8 brand-adjacent palettes. Slug → palette is deterministic so a uni
// always renders the same colour.
const PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: "#e7f0ff", fg: "#1e3a8a" }, // blue
  { bg: "#e8f5e9", fg: "#1b5e20" }, // green
  { bg: "#fdf2e9", fg: "#7c2d12" }, // amber
  { bg: "#f3e8ff", fg: "#581c87" }, // purple
  { bg: "#fff1f2", fg: "#9f1239" }, // rose
  { bg: "#e0f2fe", fg: "#075985" }, // sky
  { bg: "#ecfdf5", fg: "#065f46" }, // emerald
  { bg: "#fef3c7", fg: "#78350f" }, // honey
];

function pickPalette(slug: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return PALETTES[h % PALETTES.length];
}
