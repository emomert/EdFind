/**
 * HeroBackgroundGraphics — low-opacity atmospheric decoration for hero
 * sections. Sits behind page content as a quiet "study abroad / journey"
 * theme: lucide icons (graduation cap, plane, building, calendar), a
 * dotted travel arc with a paper plane at its head, and a couple of soft
 * cyan blobs. (The hand-drawn European skyline is a separate component —
 * components/decor/europe-skyline.tsx — used on the homepage hero.)
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared atmospheric pieces
// ─────────────────────────────────────────────────────────────────────────────

function SoftBlobs() {
  // Big, very soft blobs anchored off-frame so they bleed past whatever
  // container they're inside. This is what creates the "flowing" feel —
  // gradients without sharp edges, never quite stopping anywhere.
  return (
    <>
      <div className="absolute -top-40 -right-32 size-[640px] rounded-full bg-cyan-300/18 blur-3xl" />
      <div className="absolute -bottom-48 -left-32 size-[560px] rounded-full bg-teal-200/22 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/12 blur-3xl" />
    </>
  );
}

function DottedTravelArc({ variant }: { variant: Variant }) {
  // A curved dotted line that reads as "your application journey", with a
  // small paper plane flying at its head so the dashes read as a flight
  // path rather than a stray line. On the tracking variant the arc dips
  // downward (steady forward motion); on programs it arcs upward like a
  // flight path; on community it's a gentler horizontal wave.
  const d =
    variant === "tracking"
      ? "M -20 80 C 200 180, 500 30, 820 200 C 980 280, 1080 220, 1240 320"
      : variant === "community"
        ? "M -20 140 C 220 110, 440 180, 680 140 C 880 110, 1080 180, 1240 140"
        : "M -20 320 C 280 60, 600 80, 880 180 C 1020 230, 1140 160, 1240 60";

  // Approximate position + heading of the arc near its right end, per path.
  const plane =
    variant === "tracking"
      ? { x: 1080, y: 252, r: 32 }
      : variant === "community"
        ? { x: 1100, y: 142, r: -6 }
        : { x: 1095, y: 138, r: -28 };

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
      <g
        transform={`translate(${plane.x} ${plane.y}) rotate(${plane.r})`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 8 L34 0 L26 21 L15 14 Z" />
        <path d="M15 14 L21 7" />
      </g>
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
