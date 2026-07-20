import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  BadgeCheck,
  CircleAlert,
  Clock,
  MessagesSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmUniversityVerification } from "@/lib/verification/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.verifyEmail.meta");
  return { title: t("title") };
}

/**
 * Landing page for the confirmation link in the verification email.
 * Deliberately public: the token in the URL is the proof of ownership, so
 * the user can open the link in any browser (e.g. their phone's mail app)
 * without being signed in there.
 */
export default async function VerifyUniversityEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await confirmUniversityVerification(token)
    : ({ ok: false, error: "invalid" } as const);
  const t = await getTranslations("auth.verifyEmail");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      {result.ok ? (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <BadgeCheck className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight">
            {result.alreadyVerified
              ? t("verified.alreadyVerifiedTitle")
              : t("verified.title")}
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground">
            {t.rich("verified.description", {
              email: result.email,
              strong: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/community">
              <MessagesSquare aria-hidden />
              {t("verified.cta")}
            </Link>
          </Button>
        </>
      ) : result.error === "expired" ? (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight">
            {t("expired.title")}
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground">
            {t("expired.description")}
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/community">{t("expired.cta")}</Link>
          </Button>
        </>
      ) : (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <CircleAlert className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight">
            {result.error === "conflict"
              ? t("invalid.conflictTitle")
              : t("invalid.title")}
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground">
            {result.error === "conflict"
              ? t("invalid.conflictDescription")
              : t("invalid.description")}
          </p>
          <Button asChild size="lg" variant="outline" className="mt-8">
            <Link href="/community">{t("invalid.cta")}</Link>
          </Button>
        </>
      )}
    </div>
  );
}
