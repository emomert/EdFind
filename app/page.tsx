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
            Phase 1 scaffold — the quiz and search pages will land in Phase 2.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/40 p-8">
          <p className="text-sm font-medium text-muted-foreground">Phase 1 status</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>✓ Next.js 16 + TypeScript scaffolded</li>
            <li>✓ Tailwind v4 + brand tokens applied</li>
            <li>✓ Inter font wired up</li>
            <li>✓ shadcn/ui Button installed</li>
            <li>✓ Top nav matches design</li>
            <li className="text-muted-foreground">→ Next: Phase 2 — Profile Quiz UI</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
