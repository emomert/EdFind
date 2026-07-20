"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { QuizLoadingScreen } from "@/components/quiz/loading-screen";
import { getOrCreateClientId } from "@/lib/quiz/client-id";
import { searchByText } from "@/app/search/actions";

type Phase = "input" | "loading" | "error";

const MIN_QUERY_LENGTH = 8;

export function SearchClient() {
  const t = useTranslations("search");
  const EXAMPLES = t.raw("examples.items") as ReadonlyArray<string>;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sequenceResolveRef = useRef<(() => void) | null>(null);

  const canSubmit = query.trim().length >= MIN_QUERY_LENGTH;

  const runSearch = useCallback(async () => {
    if (!canSubmit) return;

    setErrorMessage(null);
    setPhase("loading");

    const sequencePromise = new Promise<void>((resolve) => {
      sequenceResolveRef.current = resolve;
    });

    const clientId = getOrCreateClientId();
    const submission = searchByText({ clientId, query: query.trim() });

    const [, result] = await Promise.all([sequencePromise, submission]);

    if (result.ok) {
      router.push(`/results/${result.matchId}`);
      return;
    }

    if (result.needsAuth) {
      router.push(`/login?next=${encodeURIComponent("/search")}`);
      return;
    }

    setErrorMessage(result.error);
    setPhase("error");
  }, [canSubmit, query, router]);

  const handleSequenceComplete = useCallback(() => {
    sequenceResolveRef.current?.();
    sequenceResolveRef.current = null;
  }, []);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setPhase("input");
  }, []);

  const handleExampleClick = useCallback((example: string) => {
    setQuery(example);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        (event.key === "Enter" && (event.metaKey || event.ctrlKey)) &&
        canSubmit
      ) {
        event.preventDefault();
        void runSearch();
      }
    },
    [canSubmit, runSearch],
  );

  if (phase === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <QuizLoadingScreen onComplete={handleSequenceComplete} />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("error.heading")}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {errorMessage ?? t("error.fallback")}
        </p>
        <div className="mt-8 flex gap-3">
          <Button type="button" variant="outline" onClick={handleRetry}>
            <ArrowLeft />
            {t("error.editQuery")}
          </Button>
          <Button type="button" onClick={runSearch}>
            <RotateCw />
            {t("error.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
        <Sparkles className="size-3.5" />
        {t("badge")}
      </span>
      <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {t("heading")}
      </h1>
      <p className="mt-4 text-pretty text-muted-foreground">
        {t("intro")}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
        className="mt-8"
      >
        <label
          htmlFor="search-query"
          className="block text-sm font-medium text-foreground"
        >
          {t("form.queryLabel")}
        </label>
        <textarea
          id="search-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          maxLength={1000}
          placeholder={t("form.placeholder")}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {query.trim().length < MIN_QUERY_LENGTH
              ? t("form.charsRemaining", {
                  count: MIN_QUERY_LENGTH - query.trim().length,
                })
              : t("form.charCount", { count: query.length })}
          </span>
          <span className="hidden sm:inline">
            {t.rich("form.submitHint", {
              kbd: (chunks) => (
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  {chunks}
                </kbd>
              ),
            })}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg" disabled={!canSubmit}>
            <Sparkles />
            {t("form.submit")}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/quiz">{t("form.preferQuiz")}</a>
          </Button>
        </div>
      </form>

      <section className="mt-12 border-t border-border pt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("examples.heading")}
        </p>
        <ul className="mt-4 space-y-2">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => handleExampleClick(example)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/30 hover:text-foreground"
              >
                &ldquo;{example}&rdquo;
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
