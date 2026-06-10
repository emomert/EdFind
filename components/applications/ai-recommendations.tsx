"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Compass,
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  Recommendation,
  RecommendationTone,
} from "@/lib/applications/recommendations";

const ICONS: Record<Recommendation["icon"], React.ReactNode> = {
  sparkles: <Sparkles className="size-4" />,
  calendar: <CalendarDays className="size-4" />,
  trophy: <Trophy className="size-4" />,
  compass: <Compass className="size-4" />,
  rocket: <Rocket className="size-4" />,
  heart: <Heart className="size-4" />,
  lightbulb: <Lightbulb className="size-4" />,
};

const TONE_BG: Record<RecommendationTone, string> = {
  celebrate: "bg-gradient-to-br from-emerald-50 via-white to-teal-50 ring-emerald-200",
  nudge: "bg-gradient-to-br from-teal-50 via-white to-sky-50 ring-teal-200",
  info: "bg-gradient-to-br from-sky-50 via-white to-violet-50 ring-sky-200",
  warn: "bg-gradient-to-br from-amber-50 via-white to-rose-50 ring-amber-200",
};

const TONE_ICON: Record<RecommendationTone, string> = {
  celebrate: "bg-emerald-100 text-emerald-700",
  nudge: "bg-teal-100 text-teal-700",
  info: "bg-sky-100 text-sky-700",
  warn: "bg-amber-100 text-amber-700",
};

export function AiRecommendationsPanel({
  items,
}: {
  items: Recommendation[];
}) {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-7"
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-400 ring-2 ring-white"
              aria-hidden
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Personalised guidance
            </h2>
            <p className="text-sm text-muted-foreground">
              A few next-best moves based on where you are right now.
            </p>
          </div>
        </div>
      </header>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
        }}
        className="mt-5 grid gap-3 sm:grid-cols-2"
      >
        {items.map((rec) => (
          <motion.article
            key={rec.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.35, ease: [0.21, 0.6, 0.3, 1] }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 ring-1 ring-inset",
              TONE_BG[rec.tone],
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  TONE_ICON[rec.tone],
                )}
              >
                {ICONS[rec.icon]}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-snug text-slate-900">
                  {rec.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{rec.body}</p>
                {rec.cta && (
                  <Link
                    href={rec.cta.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    {rec.cta.label} →
                  </Link>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}
