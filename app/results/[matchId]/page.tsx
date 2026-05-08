import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Your matches",
  description: "Master's programs matched to your profile.",
};

type Params = { matchId: string };

export default async function ResultsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { matchId } = await params;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your matches
      </h1>
      <p className="mt-3 text-muted-foreground">
        Phase 2 placeholder. Real matches land in Phase 4 once the database, Server Action,
        and seeded program are wired up.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6">
        <p className="text-sm font-medium text-muted-foreground">Match ID</p>
        <p className="mt-1 font-mono text-sm text-foreground">{matchId}</p>
      </div>

      <div className="mt-10">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
