"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  RotateCw,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HeroMatchCard,
  SiblingMatchCard,
  type MatchCardData,
} from "@/components/results/match-card";

/**
 * Curated results screen for the self-playing demo. Mirrors the markup of
 * `app/results/[matchId]/page.tsx` 1:1 so the recorded results look identical
 * to production — only the data is the deterministic curated set, and the Save
 * control is a server-action-free stand-in the orchestrator can "click" without
 * triggering an auth redirect (see HeroMatchCard's `saveSlot`).
 */
export function DemoResults({
  matches,
  saved,
  onSave,
  showViewApps,
  onViewApps,
  onReplay,
}: {
  matches: MatchCardData[];
  saved: boolean;
  onSave: () => void;
  showViewApps: boolean;
  onViewApps: () => void;
  onReplay: () => void;
}) {
  const t = useTranslations("demo.results");
  const top = matches[0];
  const others = matches.slice(1);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("matchCount", { count: matches.length })}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onReplay}>
          <RotateCw className="size-3.5" />
          {t("replay")}
        </Button>
      </div>

      <div className="mt-6">
        <HeroMatchCard
          match={top}
          saveSlot={<DemoSaveButton saved={saved} onClick={onSave} />}
        />
      </div>

      {showViewApps ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 sm:flex-row sm:items-center"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <BookmarkCheck className="size-4 text-primary" />
            {t("savedBanner")}
          </span>
          <button
            type="button"
            data-demo="view-apps"
            onClick={onViewApps}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {t("viewApplications")}
            <ArrowRight className="size-4" />
          </button>
        </motion.div>
      ) : null}

      {others.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("otherMatchesTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("otherMatchesSubtitle")}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((m, i) => (
              <SiblingMatchCard key={m.id} match={m} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-border pt-10 text-center sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" onClick={onReplay}>
          <ArrowLeft />
          {t("replayFromStart")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Visual twin of components/shortlist/SaveButton (pill variant) but with no
 * server action — the demo flips `saved` itself. `data-demo="save"` lets the
 * orchestrator find it to drive the fake cursor.
 */
function DemoSaveButton({
  saved,
  onClick,
}: {
  saved: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("demo.results");

  return (
    <button
      type="button"
      data-demo="save"
      onClick={onClick}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        saved
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
      )}
    >
      {saved ? (
        <BookmarkCheck className="size-3.5" />
      ) : (
        <Bookmark className="size-3.5" />
      )}
      {saved ? t("saved") : t("save")}
    </button>
  );
}
