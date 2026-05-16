/**
 * Hand-drawn marker decorations.
 *
 * A small reusable vocabulary of SVG accents in a single visual style:
 *   - Strokes use `currentColor` so you can tint via Tailwind `text-*`.
 *   - All paths use `stroke-linecap="round"`, slightly wobbly geometry,
 *     and 2px stroke width so they look ink-drawn at any reasonable size.
 *   - The whole component is `aria-hidden` — decorations should never be
 *     announced by screen readers.
 *
 * Each glyph accepts a className for sizing/colour and passes everything
 * else through to the SVG element. Sizing is normally done with Tailwind
 * (e.g. `className="size-6 text-teal-500"`); paths are normalised to the
 * SVG viewBox so any size works.
 */

import { type SVGProps } from "react";

type MarkerProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill" | "stroke">;

function baseProps(extra?: string): SVGProps<SVGSVGElement> {
  return {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    className: extra,
  };
}

/** Wobbly underline — sits below a phrase like a marker highlight. */
export function MarkerSquiggle({ className, ...rest }: MarkerProps) {
  return (
    <svg
      viewBox="0 0 120 12"
      preserveAspectRatio="none"
      {...baseProps(className)}
      strokeWidth={2.2}
      {...rest}
    >
      <path d="M2 8 C 12 2, 24 11, 36 6 S 60 2, 72 7 S 96 11, 118 4" />
    </svg>
  );
}

/** Dotted/dashed curved arrow — gently points at something. */
export function MarkerArrow({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 80 60" {...baseProps(className)} strokeWidth={2} {...rest}>
      <path
        d="M6 8 C 22 6, 34 26, 30 44"
        strokeDasharray="3 5"
      />
      <path d="M24 38 L 30 46 L 38 40" />
    </svg>
  );
}

/** Scribbled emphasis circle — drawn around a number or word. */
export function MarkerCircle({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 100 80" {...baseProps(className)} strokeWidth={2.4} {...rest}>
      <path d="M52 8 C 22 10, 6 30, 12 52 C 18 72, 56 76, 80 64 C 96 56, 96 30, 78 16 C 70 10, 60 8, 52 8 Z" />
    </svg>
  );
}

/** Cluster of three sparkles — for "AI / magic" accents. */
export function MarkerSparkles({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 64 64" {...baseProps(className)} strokeWidth={2} {...rest}>
      <path d="M14 14 L 14 26 M 8 20 L 20 20" />
      <path d="M44 8 L 44 18 M 39 13 L 49 13" />
      <path d="M40 36 L 40 50 M 33 43 L 47 43" />
    </svg>
  );
}

/** Four-pointed hand-drawn star. */
export function MarkerStar({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 48 48" {...baseProps(className)} strokeWidth={2.2} {...rest}>
      <path d="M24 6 C 24 18, 28 22, 42 24 C 28 26, 24 30, 24 42 C 24 30, 20 26, 6 24 C 20 22, 24 18, 24 6 Z" />
    </svg>
  );
}

/** Paper plane (with motion-line tail) — friendly Europe-bound vibe. */
export function MarkerPlane({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 80 60" {...baseProps(className)} strokeWidth={2} {...rest}>
      <path d="M6 32 L 70 8 L 56 50 L 38 38 L 6 32 Z" />
      <path d="M38 38 L 50 26" />
      <path
        d="M4 50 C 10 48, 18 46, 24 48"
        strokeDasharray="2 4"
      />
    </svg>
  );
}

/** Big bold checkmark in marker style — for stage progressions. */
export function MarkerCheck({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 48 48" {...baseProps(className)} strokeWidth={3} {...rest}>
      <path d="M8 26 C 14 28, 18 34, 22 40 C 28 28, 34 18, 42 8" />
    </svg>
  );
}

/** Open book / pages — empty states and "knowledge" hints. */
export function MarkerBook({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 96 72" {...baseProps(className)} strokeWidth={2.2} {...rest}>
      <path d="M8 16 C 22 12, 38 14, 48 22 C 58 14, 74 12, 88 16 L 88 60 C 74 56, 58 58, 48 66 C 38 58, 22 56, 8 60 Z" />
      <path d="M48 22 L 48 66" />
      <path d="M18 26 L 38 24" strokeDasharray="2 3" />
      <path d="M18 36 L 36 35" strokeDasharray="2 3" />
      <path d="M58 24 L 78 26" strokeDasharray="2 3" />
      <path d="M60 35 L 78 36" strokeDasharray="2 3" />
    </svg>
  );
}

/** Dotted route line — for paths between two points (Turkey→Europe). */
export function MarkerRoute({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 200 80" {...baseProps(className)} strokeWidth={2} {...rest}>
      <path
        d="M8 60 C 50 12, 110 90, 190 22"
        strokeDasharray="2 6"
      />
      <circle cx="8" cy="60" r="3" fill="currentColor" stroke="none" />
      <circle cx="190" cy="22" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Hand-drawn bookmark — empty shortlist state. */
export function MarkerBookmark({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 60 80" {...baseProps(className)} strokeWidth={2.2} {...rest}>
      <path d="M12 8 C 24 6, 36 6, 50 10 L 48 70 L 30 56 L 12 70 Z" />
    </svg>
  );
}

/** Hand-drawn folder — empty applications state. */
export function MarkerFolder({ className, ...rest }: MarkerProps) {
  return (
    <svg viewBox="0 0 88 64" {...baseProps(className)} strokeWidth={2.2} {...rest}>
      <path d="M6 14 C 12 8, 22 8, 30 10 L 36 16 L 78 16 C 84 18, 84 22, 82 28 L 78 54 C 74 60, 12 60, 8 56 Z" />
      <path d="M6 22 L 82 22" strokeDasharray="2 4" />
    </svg>
  );
}
