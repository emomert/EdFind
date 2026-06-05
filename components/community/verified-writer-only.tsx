"use client";

import { useVerification } from "./verification-context";

/**
 * Wraps community WRITE affordances (chat input, review/question composers).
 * Accounts without a confirmed university email see the fallback instead —
 * they can read everything, write nothing. Mirrors `SubscriberOnly`.
 *
 * NOTE: this is UI gating only. When real community-content tables land,
 * their RLS insert policies must call the no-arg `public.is_university_verified()`
 * (which checks the current `auth.uid()`) — the database stays the source of
 * truth (CLAUDE.md "Don'ts").
 */
export function VerifiedWriterOnly({
  fallback,
  children,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canWrite } = useVerification();
  return <>{canWrite ? children : fallback}</>;
}
