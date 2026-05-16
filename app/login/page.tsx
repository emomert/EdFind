import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/supabase/auth";
import { LoginClient } from "@/components/auth/login-client";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to EdFind to keep your matches across devices.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = sanitizeNextPath(next);
  const user = await getUser();
  if (user) {
    redirect(safeNext);
  }

  return <LoginClient next={safeNext} error={error ?? null} />;
}
