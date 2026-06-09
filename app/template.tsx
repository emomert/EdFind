import { PageTransition } from "@/components/motion";

/**
 * Per-route template — App Router re-mounts it on navigation (unlike layout),
 * so the fade replays on every route change for a connected, flowing feel.
 * Uses the shared PageTransition (reduced-motion aware, opacity-only so it
 * never breaks descendant `position: fixed` elements).
 */
export default function RouteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
