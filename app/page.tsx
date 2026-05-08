import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Choose how you want to{" "}
            <span className="text-primary">explore master&apos;s programs in Europe</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            AI-supported, neutral guidance for Turkish students to find the right
            master&apos;s programs in Europe.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/quiz">
                Start the Profile Quiz
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/search">
                <Search />
                AI Search
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Phase 2 — the quiz works end-to-end on the client. Database wiring and
            real matches land in Phase 3 and Phase 4.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/40 p-8">
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>✓ Phase 0 — foundation docs</li>
            <li>✓ Phase 1 — Next.js + Tailwind + shadcn scaffold</li>
            <li>✓ Phase 2 — Profile quiz UI (7 questions, draft-saved, loading screen)</li>
            <li className="text-muted-foreground">→ Next: Phase 3 — Supabase schema + seed</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
