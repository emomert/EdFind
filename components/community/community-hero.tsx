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

export function CommunityHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.6, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50/50 via-transparent to-emerald-50/50 p-6 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-teal-200/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 left-12 size-60 rounded-full bg-emerald-100/25 blur-3xl" aria-hidden />
      <HeroBackgroundGraphics variant="community" density="low" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr,1fr] lg:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 shadow-sm ring-1 ring-inset ring-teal-200"
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
            Real experiences. Real students. <span className="text-teal-700">Real answers.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="mt-4 max-w-xl text-base text-slate-600"
          >
            Join university and program communities to ask questions, compare experiences, and choose your best path. Every voice is verified — no spam, no anonymous noise.
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

        <CampusVideo />
      </div>
    </motion.section>
  );
}

/**
 * Campus-life clip in the hero's right column. The file is a freely-licensed
 * Pexels video ("Group of College Students Talking while on the Side of the
 * Bridge" by RDNE Stock project — Pexels license, no attribution required),
 * self-hosted at public/videos/community-hero.mp4 so we don't hotlink.
 * Swap the file to change the clip. Hidden below lg (autoplay video isn't
 * worth the data cost on phones) and removed entirely if it fails to load.
 */
function CampusVideo() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative mx-auto hidden w-full max-w-md lg:block"
      aria-hidden
    >
      <div className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-teal-100">
        <video
          src="/videos/community-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="aspect-[16/10] w-full object-cover"
        />
      </div>
      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-lg ring-1 ring-teal-100 backdrop-blur">
        <BadgeCheck className="size-3.5 text-teal-600" />
        Campus life, for real
      </div>
    </motion.div>
  );
}
