import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CircleAlert,
  Clock,
  MessagesSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmUniversityVerification } from "@/lib/verification/server";

export const metadata: Metadata = {
  title: "Verify university email",
};

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

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      {result.ok ? (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <BadgeCheck className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight">
            {result.alreadyVerified
              ? "Already verified"
              : "University email verified!"}
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground">
            <strong className="text-foreground">{result.email}</strong> is
            linked to your EdFind account. You can now write in the community —
            chat in groups, post reviews, and ask questions.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/community">
              <MessagesSquare aria-hidden />
              Go to the community
            </Link>
          </Button>
        </>
      ) : result.error === "expired" ? (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight">
            This link has expired
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground">
            Confirmation links are valid for 24 hours. Request a new one from
            the community page and check your inbox again.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/community">Request a new link</Link>
          </Button>
        </>
      ) : (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <CircleAlert className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight">
            {result.error === "conflict"
              ? "This email was just verified elsewhere"
              : "Invalid confirmation link"}
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground">
            {result.error === "conflict"
              ? "A university email can only be linked to one account. If that wasn't you, request a new link from the community page."
              : "The link is incomplete or was replaced by a newer request. Open the most recent email, or request a new link from the community page."}
          </p>
          <Button asChild size="lg" variant="outline" className="mt-8">
            <Link href="/community">Back to the community</Link>
          </Button>
        </>
      )}
    </div>
  );
}
