/**
 * HeroBackgroundGraphics — low-opacity atmospheric decoration for hero
 * sections. Sits behind page content as a quiet "study abroad / journey"
 * theme: lucide icons (graduation cap, plane, building, calendar) plus a
 * thin SVG skyline along the bottom edge, a dotted travel arc, and a
 * couple of soft cyan blobs.
 *
 * Design rules this component enforces so it stays subtle:
 *   - Opacity 8–15% on every element (no full-saturation icons).
 *   - Teal/cyan palette only — no warm accents.
 *   - pointer-events-none on the wrapper so it never blocks clicks.
 *   - Server component (no "use client") — purely static SVG.
 *   - Heavier elements (large icons, skyline) hide on small screens
 *     via Tailwind responsive prefixes so mobile stays uncluttered.
 *
 * This is the BACKGROUND layer. It coexists with the hand-drawn marker
 * accents in `components/decor/marker.tsx`, which serve as FOREGROUND
 * accents (squiggle under a heading, sparkles in a card corner). Keep
 * the two layers separate: low-opacity atmospheric icons here, sharp
 * marker accents there.
 */

import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  MapPin,
  Plane,
  PlaneTakeoff,
  Sparkles,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "programs" | "tracking" | "community";
type Density = "low" | "medium";

export function HeroBackgroundGraphics({
  variant = "programs",
  density = "medium",
  className,
}: {
  variant?: Variant;
  density?: Density;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <SoftBlobs />

      <DottedTravelArc variant={variant} />

      {variant === "programs" ? (
        <ProgramsLayer density={density} />
      ) : variant === "tracking" ? (
        <TrackingLayer density={density} />
      ) : (
        <CommunityLayer density={density} />
      )}

      <Skyline />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared atmospheric pieces
// ─────────────────────────────────────────────────────────────────────────────

function SoftBlobs() {
  return (
    <>
      <div className="absolute -top-24 -right-20 size-[420px] rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-[360px] rounded-full bg-teal-200/20 blur-3xl" />
    </>
  );
}

function Skyline() {
  // A flat SVG row of varying-height rectangles + a couple of dotted
  // spires. Anchored to the bottom of the section, the eye reads it as
  // a horizon line without it dominating.
  return (
    <svg
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 hidden h-16 w-full text-teal-600/10 sm:block"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="20" y="50" width="36" height="40" />
        <rect x="64" y="36" width="48" height="54" />
        <rect x="120" y="48" width="28" height="42" />
        <rect x="158" y="20" width="44" height="70" />
        <rect x="212" y="44" width="32" height="46" />
        <rect x="252" y="34" width="58" height="56" />
        <rect x="318" y="50" width="24" height="40" />
        <rect x="350" y="28" width="46" height="62" />
        <rect x="404" y="46" width="36" height="44" />
        <rect x="448" y="40" width="50" height="50" />
        <rect x="506" y="22" width="38" height="68" />
        <rect x="552" y="48" width="30" height="42" />
        <rect x="590" y="38" width="54" height="52" />
        <rect x="652" y="46" width="36" height="44" />
        <rect x="696" y="30" width="48" height="60" />
        <rect x="752" y="48" width="28" height="42" />
        <rect x="788" y="24" width="44" height="66" />
        <rect x="840" y="44" width="34" height="46" />
        <rect x="882" y="36" width="52" height="54" />
        <rect x="942" y="50" width="26" height="40" />
        <rect x="976" y="32" width="44" height="58" />
        <rect x="1028" y="46" width="38" height="44" />
        <rect x="1074" y="40" width="48" height="50" />
        <rect x="1130" y="50" width="32" height="40" />
      </g>
      {/* Two slender spires for visual variety */}
      <g
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      >
        <line x1="180" y1="20" x2="180" y2="8" />
        <line x1="528" y1="22" x2="528" y2="6" />
      </g>
    </svg>
  );
}

function DottedTravelArc({ variant }: { variant: Variant }) {
  // A curved dotted line that reads as "your application journey". On
  // the tracking variant the arc dips downward (steady forward motion);
  // on programs it arcs upward like a flight path; on community it's a
  // gentler horizontal wave.
  const d =
    variant === "tracking"
      ? "M -20 80 C 200 180, 500 30, 820 200 C 980 280, 1080 220, 1240 320"
      : variant === "community"
        ? "M -20 140 C 220 110, 440 180, 680 140 C 880 110, 1080 180, 1240 140"
        : "M -20 320 C 280 60, 600 80, 880 180 C 1020 230, 1140 160, 1240 60";

  return (
    <svg
      viewBox="0 0 1200 360"
      preserveAspectRatio="none"
      className="absolute inset-0 hidden h-full w-full text-teal-500/15 sm:block"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="2 8"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-variant icon layers
//
// Positions are picked so that the busiest area (top-right) gets the
// "headline" icon, with quieter elements scattered toward dead corners.
// Each icon takes a small extra rotation for an organic, hand-placed feel.
// ─────────────────────────────────────────────────────────────────────────────

function ProgramsLayer({ density }: { density: Density }) {
  return (
    <>
      <GraduationCap className="absolute right-6 top-6 size-20 -rotate-6 text-teal-500/10 sm:size-24" />
      <Plane className="absolute left-1/4 top-10 size-12 -rotate-12 text-teal-500/12 sm:size-14" />
      <Building2 className="absolute right-1/3 top-20 size-10 rotate-3 text-teal-600/10 sm:size-12" />
      <MapPin className="absolute bottom-24 right-12 size-10 text-cyan-600/14 sm:size-12" />
      <Sparkles className="absolute left-10 top-24 size-8 text-cyan-500/14 sm:size-10" />
      {density === "medium" ? (
        <>
          <BookOpen className="absolute bottom-32 left-16 size-10 -rotate-12 text-teal-500/12 sm:size-12" />
          <MapPin className="absolute right-1/4 top-32 size-7 text-cyan-600/12" />
          <Star className="absolute right-20 top-1/3 size-7 text-teal-500/14" />
          <PlaneTakeoff className="absolute bottom-20 left-1/3 size-10 -rotate-12 text-teal-600/10 sm:size-12" />
        </>
      ) : null}
    </>
  );
}

function TrackingLayer({ density }: { density: Density }) {
  return (
    <>
      <CalendarDays className="absolute right-8 top-8 size-20 -rotate-6 text-teal-500/12 sm:size-24" />
      <CheckCircle2 className="absolute left-1/4 top-12 size-12 text-teal-600/14 sm:size-14" />
      <FileText className="absolute right-1/3 top-20 size-10 rotate-6 text-cyan-600/12 sm:size-12" />
      <Building2 className="absolute bottom-24 right-16 size-12 text-teal-600/10 sm:size-14" />
      <CheckCircle2 className="absolute bottom-32 left-12 size-8 text-teal-500/14 sm:size-10" />
      {density === "medium" ? (
        <>
          <CalendarDays className="absolute left-10 top-1/2 size-8 rotate-6 text-cyan-500/12 sm:size-10" />
          <FileText className="absolute bottom-16 left-1/3 size-8 -rotate-6 text-teal-500/12" />
          <CheckCircle2 className="absolute right-1/4 top-1/3 size-7 text-teal-600/14" />
        </>
      ) : null}
    </>
  );
}

function CommunityLayer({ density }: { density: Density }) {
  return (
    <>
      <Building2 className="absolute right-6 top-8 size-20 -rotate-3 text-teal-500/10 sm:size-24" />
      <MapPin className="absolute left-1/4 top-10 size-12 text-cyan-600/14 sm:size-14" />
      <Sparkles className="absolute right-1/3 top-20 size-10 text-teal-500/14 sm:size-12" />
      <Award className="absolute bottom-24 right-12 size-10 -rotate-6 text-teal-600/12 sm:size-12" />
      <BookOpen className="absolute left-12 top-1/3 size-9 -rotate-6 text-teal-500/12 sm:size-10" />
      {density === "medium" ? (
        <>
          <MapPin className="absolute bottom-28 left-1/3 size-8 text-cyan-500/14 sm:size-10" />
          <Star className="absolute right-1/4 top-1/2 size-7 text-teal-500/14" />
          <Sparkles className="absolute bottom-16 right-1/3 size-7 text-cyan-600/12" />
        </>
      ) : null}
    </>
  );
}
