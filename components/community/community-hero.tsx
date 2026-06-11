"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Globe, MessagesSquare, Crown, GraduationCap } from "lucide-react";

import { HeroBackgroundGraphics } from "@/components/decor/hero-background-graphics";

const TRUST_CHIPS = [
  { icon: BadgeCheck, label: "Verified only" },
  { icon: Globe, label: "European focus" },
  { icon: MessagesSquare, label: "Community driven" },
  { icon: Crown, label: "Campus responsibles" },
  { icon: GraduationCap, label: "Program-specific groups" },
];

/**
 * Hero with a full-bleed campus video background (busy European campus
 * walkway — Pexels #30614645 by Media Hopper Studio, free license,
 * trimmed/compressed and self-hosted at public/videos/community-hero.mp4).
 * A left-to-right white gradient keeps the copy readable; if the video
 * fails to load we fall back to the old static gradient + decor.
 */
export function CommunityHero() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.6, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* Background layers */}
      {videoFailed ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/70" aria-hidden />
          <HeroBackgroundGraphics variant="community" density="low" />
        </>
      ) : (
        <>
          <video
            src="/videos/community-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 size-full object-cover"
            aria-hidden
          />
          {/* Readability gradient — strongest on the left where the copy sits. */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/30"
            aria-hidden
          />
        </>
      )}

      <div className="relative z-10 max-w-2xl p-6 sm:p-10">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 shadow-sm ring-1 ring-inset ring-teal-200"
        >
          <BadgeCheck className="size-3.5" />
          Verified Student Insights
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl"
        >
          Real experiences. Real students.{" "}
          <span className="text-teal-700">Real answers.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="mt-4 max-w-xl text-base text-slate-700"
        >
          Join university and program communities to ask questions, compare
          experiences, and choose your best path. Every voice is verified — no
          spam, no anonymous noise.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
          }}
          className="mt-6 flex flex-wrap gap-2"
        >
          {TRUST_CHIPS.map(({ icon: Icon, label }) => (
            <motion.span
              key={label}
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0 },
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
            >
              <Icon className="size-3.5 text-teal-600" />
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
