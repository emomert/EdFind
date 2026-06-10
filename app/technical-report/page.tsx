import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LegalPage } from "@/components/legal/legal-page";
import { SYSTEM_PROMPT as MATCHER_PROMPT } from "@/lib/ai";
import { SYSTEM_PROMPT as PARSER_PROMPT } from "@/lib/ai/parse-query";
import { ANSWERS_VERSION, TOTAL_STEPS } from "@/lib/quiz/schema";

export const metadata: Metadata = {
  title: "How EdFind works — technical overview",
  description:
    "A plain-English technical overview of how EdFind matches students to master's programs, the stack behind it, and the exact AI prompts we use.",
};

function PromptBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="not-prose my-4">
      <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </figcaption>
      <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-muted/50 p-4 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
        {children}
      </pre>
    </figure>
  );
}

export default function TechnicalReportPage() {
  return (
    <LegalPage
      eyebrow="Transparency"
      title="How EdFind works"
      updated="10 June 2026"
      intro="We think a tool that recommends life decisions should be honest about how it does it. This page explains, in plain terms, what happens under the hood — the stack, the matching pipeline, our neutrality rules, and the actual AI prompts we send to the model."
    >
      <h2>What EdFind is doing</h2>
      <p>
        Master&apos;s information for European universities is scattered across
        hundreds of sites, in different languages and formats. EdFind pulls a
        curated slice of it into one structured, searchable database, then uses a
        large language model to reason over your profile and that catalog to
        surface programs worth a closer look. It is a research accelerator, not an
        oracle — every figure links back to a source you should verify.
      </p>

      <h2>The stack</h2>
      <ul>
        <li>
          <strong>Web app:</strong> Next.js 16 (App Router) with TypeScript,
          Tailwind CSS, and shadcn/ui components. Rendered mostly as React Server
          Components.
        </li>
        <li>
          <strong>Data + auth:</strong> Supabase (PostgreSQL, authentication, and
          storage) hosted in the EU (Ireland). Access is enforced at the database
          level with Row-Level Security, not just in app code.
        </li>
        <li>
          <strong>Hosting:</strong> Vercel.
        </li>
        <li>
          <strong>AI:</strong> DeepSeek V4 Flash (<code>deepseek-v4-flash</code>),
          called server-side only. Reasoning mode is disabled so the model returns
          structured JSON directly.
        </li>
      </ul>
      <p>
        Every AI call and every privileged database call happens on the server.
        API keys never reach your browser.
      </p>

      <h2>How a match is made</h2>
      <p>
        The guided quiz is {TOTAL_STEPS} questions (schema version{" "}
        {ANSWERS_VERSION}). When you submit it:
      </p>
      <ol>
        <li>
          Your answers are validated on the server against a strict schema — every
          value must be a known option or within bounds before anything is stored.
        </li>
        <li>
          We load the full program catalog from the database and compact it into a
          machine-readable list (program, university, field, language, duration,
          tuition + currency, rankings).
        </li>
        <li>
          We send your profile and that catalog to the model with the{" "}
          <strong>matching prompt</strong> below. It applies hard filters
          (destination, language, budget, duration) and soft fits (field,
          academic focus, GPA, work experience, your free-text notes), then returns
          the three best programs with a 0–100 score and a personalised rationale.
        </li>
        <li>
          We validate the model&apos;s output, drop anything that doesn&apos;t
          point at a real program, store the top three, and show you the results.
        </li>
      </ol>
      <p>
        The matcher never invents facts about a program: it can only rank what is
        in the catalog, and it&apos;s instructed to acknowledge trade-offs rather
        than oversell.
      </p>

      <h2>Free-text search</h2>
      <p>
        If you describe what you want in your own words instead of taking the quiz,
        a separate <strong>parser prompt</strong> first maps your sentence onto the
        same structured profile (filling only what you actually said and leaving
        the rest blank), and then the identical matching pipeline runs. Your exact
        wording is also passed through so the rationale can quote you.
      </p>

      <h2>Neutrality</h2>
      <p>
        Partner universities are content-tagged and surfaced as their own tier.
        They are <strong>never silently boosted</strong> inside neutral matching
        results — the prompt ranks on fit, not on commercial relationship. This is
        a product promise, enforced by keeping partner status out of the ranking
        signal.
      </p>

      <h2>AI-researched data</h2>
      <p>
        Some content — housing costs, cost-of-living estimates, and university
        campus photos — is researched with AI agents that read public sources and
        cite them. These are clearly labelled as estimates, dated, and shown with
        their sources. Currency figures carry an approximate euro conversion for
        convenience. Always treat them as a starting point, not a quote.
      </p>

      <h2>The exact prompts we use</h2>
      <p>
        For full transparency, here are the verbatim system instructions sent to
        the model. They&apos;re rendered straight from the running code, so what
        you see here is what the product actually uses (the prompts evolve as we
        tune quality).
      </p>

      <PromptBlock label="Matching prompt (quiz + search results)">
        {MATCHER_PROMPT}
      </PromptBlock>

      <PromptBlock label="Free-text query parser prompt (/search)">
        {PARSER_PROMPT}
      </PromptBlock>

      <h2>Privacy &amp; security in brief</h2>
      <p>
        We collect what we need to match you and remember your progress, store it
        in the EU, and never sell it. Your quiz answers are sent to the AI model
        provider to generate matches — so please keep sensitive details out of
        free-text boxes. The full detail, including your rights and how to delete
        your data, is in our <a href="/privacy">Privacy Policy</a>. The terms of
        use are in our <a href="/terms">Terms of Service</a>.
      </p>

      <h2>Honest limitations</h2>
      <ul>
        <li>
          The catalog is a curated subset of European master&apos;s programs, not
          every program that exists.
        </li>
        <li>
          AI matches are suggestions. They can be wrong, miss context, or reflect
          stale data. Verify everything that matters on the official site.
        </li>
        <li>
          Rankings, tuition, deadlines, and housing costs change — we date what we
          can and link sources, but currency and timing drift.
        </li>
      </ul>
    </LegalPage>
  );
}
