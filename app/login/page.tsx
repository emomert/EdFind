import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getUser } from "@/lib/supabase/auth";
import { LoginClient } from "@/components/auth/login-client";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

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
