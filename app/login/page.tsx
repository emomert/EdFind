import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/supabase/auth";
import { LoginClient } from "@/components/auth/login-client";

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
  const user = await getUser();
  if (user) {
    redirect(next && next.startsWith("/") ? next : "/");
  }

  return <LoginClient next={next ?? "/"} error={error ?? null} />;
}
