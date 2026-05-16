/**
 * Single source of truth for "is this ?next= value safe to redirect to".
 *
 * Rejects:
 *   - Anything that isn't a string starting with "/"
 *   - Protocol-relative URLs ("//evil.com") — these start with "/" but the
 *     browser treats them as external. Critical: `startsWith("/")` alone is
 *     an open-redirect vulnerability.
 *   - Backslash variants ("/\evil.com") that some browsers normalise to "//".
 */
export function isSafeNextPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value[0] === "/" &&
    value[1] !== "/" &&
    value[1] !== "\\"
  );
}

export function sanitizeNextPath(
  value: unknown,
  fallback: string = "/",
): string {
  return isSafeNextPath(value) ? value : fallback;
}
