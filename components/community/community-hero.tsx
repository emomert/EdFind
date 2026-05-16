"use client";

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
      className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-teal-300/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 left-12 size-60 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />
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

        <CampusIllustration />
      </div>
    </motion.section>
  );
}

function CampusIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="relative mx-auto hidden aspect-[4/3] w-full max-w-sm lg:block"
      aria-hidden
    >
      {/* Layered card mockup suggesting verified profiles */}
      <div className="absolute inset-0 rotate-[-4deg] rounded-3xl border border-teal-100 bg-white/80 shadow-xl backdrop-blur" />
      <div className="absolute inset-3 rotate-[2deg] rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 shadow-lg">
        <div className="flex items-center gap-3 p-4">
          <div className="size-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/5 rounded-full bg-slate-200" />
            <div className="h-2 w-2/5 rounded-full bg-slate-100" />
          </div>
          <BadgeCheck className="size-5 text-teal-600" />
        </div>
        <div className="space-y-2 px-4 pb-4">
          <div className="h-2 rounded-full bg-slate-100" />
          <div className="h-2 w-4/5 rounded-full bg-slate-100" />
          <div className="h-2 w-3/5 rounded-full bg-slate-100" />
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
              Verified
            </span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              Alumni
            </span>
          </div>
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-3 top-6 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-teal-700 shadow-lg ring-1 ring-teal-100"
      >
        <BadgeCheck className="mr-1 inline size-3.5 text-teal-600" />
        184 verified students
      </motion.div>
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 3.6, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-4 bottom-4 rounded-2xl bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg ring-1 ring-slate-200"
      >
        💬 “Polimi housing tips →”
      </motion.div>
    </motion.div>
  );
}
