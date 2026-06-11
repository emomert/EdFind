"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MonitorPlay, RotateCw, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { TOTAL_STEPS } from "@/lib/quiz/schema";

/**
 * Auto-playing quiz preview (2026-06-11 feedback): a large modal that looks
 * like the real quiz and plays itself — options get "clicked", free-text
 * answers type themselves out — so visitors see exactly what the 14-question
 * flow feels like before signing up. Opened from the hero's "Watch the quiz
 * in action" link via a window event (same pattern as the welcome tour).
 */

const OPEN_EVENT = "edfind:quiz-demo:open";

type DemoStep =
  | {
      kind: "select";
      legend: string;
      helper?: string;
      options: string[];
      /** Indexes picked, in click order. */
      picks: number[];
    }
  | {
      kind: "text";
      legend: string;
      helper?: string;
      typed: string;
    };

const DEMO_STEPS: DemoStep[] = [
  {
    kind: "select",
    legend: "Which destination feels right for your master's journey?",
    helper: "Pick one or more — or \"No preference\" to stay open.",
    options: ["Italy", "Netherlands", "Germany", "Sweden", "France", "No preference"],
    picks: [0, 1],
  },
  {
    kind: "select",
    legend: "What best describes your current situation?",
    options: [
      "Current undergraduate student",
      "Graduating soon (final year)",
      "Recent graduate",
      "Working professional",
    ],
    picks: [1],
  },
  {
    kind: "text",
    legend: "What did you study?",
    helper: "Your undergraduate field, in your own words.",
    typed: "BSc Industrial Engineering at Istanbul Technical University",
  },
  {
    kind: "text",
    legend: "What do you want to study?",
    helper:
      "Be as free as you like — a field, a precise topic, or just a feeling.",
    typed: "I want to move into data science — ideally applied to supply chains",
  },
  {
    kind: "select",
    legend: "What's your budget per year?",
    helper: "Tuition only — not living costs.",
    options: [
      "Tuition-free / fully-funded only",
      "Under €10,000",
      "€10,000 – €15,000",
      "Flexible / not sure yet",
    ],
    picks: [2],
  },
];

const PICK_DELAY_MS = 750;
const AFTER_SELECT_PAUSE_MS = 950;
const AFTER_TYPE_PAUSE_MS = 1100;
const TYPE_SPEED_MS = 32;

export function QuizDemoLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      <MonitorPlay className="size-3.5" aria-hidden />
      Watch the quiz in action
    </button>
  );
}

export function QuizDemo() {
  const [open, setOpen] = useState(false);
  // -1 = intro beat, DEMO_STEPS.length = finale.
  const [stepIndex, setStepIndex] = useState(0);
  const [pickedCount, setPickedCount] = useState(0);
  const [runId, setRunId] = useState(0);
  const reducedMotion = useReducedMotion();

  const close = useCallback(() => setOpen(false), []);
  const replay = useCallback(() => {
    setStepIndex(0);
    setPickedCount(0);
    setRunId((r) => r + 1);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStepIndex(0);
      setPickedCount(0);
      setRunId((r) => r + 1);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Esc closes; body scroll locks while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const step = DEMO_STEPS[stepIndex];
  const isFinale = stepIndex >= DEMO_STEPS.length;

  const advance = useCallback(() => {
    setPickedCount(0);
    setStepIndex((i) => i + 1);
  }, []);

  // Drive select steps: stagger the "clicks", then advance.
  useEffect(() => {
    if (!open || isFinale || !step || step.kind !== "select") return;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    step.picks.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => setPickedCount(i + 1),
          reducedMotion ? 150 * (i + 1) : PICK_DELAY_MS * (i + 1),
        ),
      );
    });
    timers.push(
      setTimeout(
        advance,
        (reducedMotion ? 150 : PICK_DELAY_MS) * step.picks.length +
          AFTER_SELECT_PAUSE_MS,
      ),
    );
    return () => timers.forEach(clearTimeout);
    // runId restarts the timeline on replay.
  }, [open, stepIndex, runId, step, isFinale, advance, reducedMotion]);

  const progress = Math.min(stepIndex / DEMO_STEPS.length, 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          onClick={close}
          role="dialog"
          aria-modal
          aria-label="Quiz preview"
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.21, 0.6, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header: demo badge + faux progress */}
            <header className="border-b border-slate-100 px-6 pb-4 pt-5 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20">
                  <Sparkles className="size-3.5" />
                  Quiz preview — plays by itself
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close preview"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                  />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-slate-500">
                  {isFinale
                    ? "Done"
                    : `${stepIndex + 1} / ${DEMO_STEPS.length}`}
                </span>
              </div>
            </header>

            {/* Body */}
            <div className="min-h-[380px] flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
              <AnimatePresence mode="wait">
                {isFinale ? (
                  <Finale key="finale" onReplay={replay} onClose={close} />
                ) : step.kind === "select" ? (
                  <motion.div
                    key={`step-${stepIndex}-${runId}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StepLegend legend={step.legend} helper={step.helper} />
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {step.options.map((label, i) => {
                        const pickOrder = step.picks.indexOf(i);
                        const isPicked =
                          pickOrder !== -1 && pickOrder < pickedCount;
                        return (
                          <motion.div
                            key={label}
                            animate={isPicked ? { scale: [1, 0.97, 1] } : {}}
                            transition={{ duration: 0.25 }}
                            className={cn(
                              "rounded-2xl border p-4 text-sm font-medium transition-colors duration-300",
                              isPicked
                                ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm ring-2 ring-teal-100"
                                : "border-slate-200 bg-white text-slate-700",
                            )}
                          >
                            {label}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`step-${stepIndex}-${runId}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StepLegend legend={step.legend} helper={step.helper} />
                    <Typewriter
                      key={`type-${stepIndex}-${runId}`}
                      text={step.typed}
                      instant={Boolean(reducedMotion)}
                      onDone={advance}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-center text-[11px] text-slate-500 sm:px-8">
              A shortened preview — the real quiz is {TOTAL_STEPS} quick
              questions and takes about 2 minutes.
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepLegend({ legend, helper }: { legend: string; helper?: string }) {
  return (
    <>
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {legend}
      </h2>
      {helper && <p className="mt-2 text-sm text-slate-500">{helper}</p>}
    </>
  );
}

function Typewriter({
  text,
  instant,
  onDone,
}: {
  text: string;
  instant: boolean;
  onDone: () => void;
}) {
  const [count, setCount] = useState(instant ? text.length : 0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (count < text.length) {
      const t = setTimeout(() => setCount((c) => c + 1), TYPE_SPEED_MS);
      return () => clearTimeout(t);
    }
    if (!doneRef.current) {
      doneRef.current = true;
      const t = setTimeout(onDone, AFTER_TYPE_PAUSE_MS);
      return () => clearTimeout(t);
    }
  }, [count, text, onDone]);

  return (
    <div className="mt-6 min-h-[120px] rounded-xl border border-teal-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm ring-2 ring-teal-100">
      {text.slice(0, count)}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
        className="ml-px inline-block h-4 w-px translate-y-0.5 bg-teal-600"
        aria-hidden
      />
    </div>
  );
}

function Finale({
  onReplay,
  onClose,
}: {
  onReplay: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      key="finale"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex h-full flex-col items-center justify-center py-6 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
        className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg"
      >
        <Sparkles className="size-7" />
      </motion.div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
        …and that&apos;s when the matching happens
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Your answers are compared against all 196 programs — real tuition,
        deadlines, and rankings — and you get your top 3 with a personal
        explanation for each.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/quiz"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Take the real quiz
          <ArrowRight className="size-4" />
        </Link>
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
        >
          <RotateCw className="size-3.5" />
          Replay
        </button>
      </div>
    </motion.div>
  );
}
