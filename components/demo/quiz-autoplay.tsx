"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  EMPTY_ANSWERS,
  QUESTIONS,
  TOTAL_STEPS,
  isQuestionAnswered,
  type Answers,
  type Destination,
} from "@/lib/quiz/schema";
import { QuizProgressBar } from "@/components/quiz/progress-bar";
import { QuizMascot } from "@/components/quiz/mascot";
import { QuestionScreen } from "@/components/quiz/question-screen";
import { QuizLoadingScreen } from "@/components/quiz/loading-screen";
import { ApplicationsClient } from "@/components/applications/applications-client";
import { DemoResults } from "@/components/demo/demo-results";
import { DemoHome } from "@/components/demo/demo-home";
import { DemoCursor } from "@/components/demo/demo-cursor";
import {
  DEMO_APPLICATIONS,
  DEMO_DOCUMENTS,
  DEMO_MATCHES,
  DEMO_PROFILE,
  DEMO_STUDENT,
  DEMO_TASKS,
  STEP_PLANS,
} from "@/components/demo/demo-data";

/**
 * Self-playing walkthrough of the full EdFind journey, for the presentation
 * video. It mounts the *production* components for each surface (homepage hero,
 * the 14-question quiz, the loading screen, the results cards, the applications
 * dashboard) and drives them on a timeline — so the capture is the real UI, not
 * a re-creation. A fake cursor performs the two "clicks" (start the quiz, save
 * the top match). Curated, deterministic data lives in demo-data.ts.
 *
 * Phases: home → quiz → loading → results (+ save) → applications (+ scroll).
 * A single cancellable "director" effect sequences everything; its timers are
 * cleared on replay so the journey restarts cleanly. Reduced-motion collapses
 * the pauses. `?chrome=0` hides the demo badge + Replay for a clean capture.
 */

type Phase = "home" | "quiz" | "loading" | "results" | "applications";
type Cursor = { x: number; y: number; visible: boolean; clickId: number };

// Timing (ms). Tuned for a ~60s walkthrough at normal motion.
const HOME_DWELL = 3300;
const Q_FIRST_DELAY = 1500; // first question also lets the d3 globe load
const Q_READ_PAUSE = 700;
const Q_AFTER_FILL = 560;
const PICK_STAGGER = 520;
const TYPE_SPEED = 24;
const INSTITUTION_TYPE_SPEED = 55;
const GPA_SCALE_TO_VALUE_PAUSE = 650;
const ENGLISH_REVEAL_PAUSE = 600;
const LOADING_MS = 2900;
const RESULTS_READ = 3200;
const AFTER_SAVE_PAUSE = 650;
const VIEW_APPS_PAUSE = 1200;
const APPS_READ = 2100;
const APPS_SCROLL_PAUSE = 1450;
const APPS_HOLD = 3200;
// Cursor motion.
const SCROLL_SETTLE = 380;
const CURSOR_MOVE = 680;
const CURSOR_CLICK = 340;

function selectedValuesFor(answers: Answers, field: keyof Answers): string[] {
  const value = answers[field];
  if (Array.isArray(value)) return value;
  return value === null ? [] : [value];
}

// Canonical native-setter trick so React's onChange fires when we drive the
// institution combobox's <input> the way a real keystroke would.
function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function QuizAutoplay() {
  const t = useTranslations("demo.chrome");
  const reduce = useReducedMotion();
  const reduceRef = useRef(false);
  useEffect(() => {
    reduceRef.current = Boolean(reduce);
  }, [reduce]);

  const [phase, setPhase] = useState<Phase>("home");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [saved, setSaved] = useState(false);
  const [showViewApps, setShowViewApps] = useState(false);
  const [cursor, setCursor] = useState<Cursor>({
    x: 0,
    y: 0,
    visible: false,
    clickId: 0,
  });
  const [runId, setRunId] = useState(0);
  const [hideChrome, setHideChrome] = useState(false);
  const stepBodyRef = useRef<HTMLDivElement | null>(null);

  const question = QUESTIONS[stepIndex];

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("chrome") === "0" || p.get("bare") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHideChrome(true);
    }
  }, []);

  // Real answer handlers — mirror QuizClient so the flow works if clicked by
  // hand, and so the institution combobox commits through onPatch.
  const handlePatch = useCallback((patch: Partial<Answers>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelect = useCallback(
    (rawValue: string) => {
      setAnswers((prev) => {
        if (question.field === "destinations") {
          const value = rawValue as Destination;
          const current = prev.destinations;
          const isSelected = current.includes(value);
          if (value === "ANY") {
            return { ...prev, destinations: isSelected ? [] : ["ANY"] };
          }
          const withoutAny = current.filter((v) => v !== "ANY");
          const next = isSelected
            ? withoutAny.filter((v) => v !== value)
            : [...withoutAny, value];
          return { ...prev, destinations: next };
        }
        if (question.select === "text") {
          const trimmed = rawValue.trim();
          return { ...prev, [question.field]: trimmed === "" ? null : rawValue };
        }
        const currentValue = prev[question.field];
        if (currentValue === rawValue) {
          return { ...prev, [question.field]: null };
        }
        return { ...prev, [question.field]: rawValue };
      });
    },
    [question],
  );

  const restart = useCallback(() => {
    setAnswers(EMPTY_ANSWERS);
    setStepIndex(0);
    setSaved(false);
    setShowViewApps(false);
    setCursor({ x: 0, y: 0, visible: false, clickId: 0 });
    setPhase("home");
    setRunId((r) => r + 1);
  }, []);

  // The director: one cancellable async sequence for the whole journey.
  // Deps are [runId] only — it drives phase/step/answers state, so it must not
  // restart when those change. `reduce` is read through a ref for the same
  // reason.
  useEffect(() => {
    let done = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const w = window as unknown as { __edfindDemoComplete?: boolean };
    w.__edfindDemoComplete = false;

    const rm = () => reduceRef.current;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, rm() ? Math.min(ms, 60) : ms));
      });

    const patch = (p: Partial<Answers>) =>
      setAnswers((prev) => ({ ...prev, ...p }));

    const moveCursorTo = async (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return null;
      el.scrollIntoView({ block: "center", behavior: rm() ? "auto" : "smooth" });
      await sleep(SCROLL_SETTLE);
      if (done) return null;
      const r = el.getBoundingClientRect();
      setCursor((c) => ({
        ...c,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        visible: true,
      }));
      await sleep(CURSOR_MOVE);
      return el;
    };
    const clickCursor = async () => {
      setCursor((c) => ({ ...c, clickId: c.clickId + 1 }));
      await sleep(CURSOR_CLICK);
    };

    const typeInto = async (
      apply: (value: string) => void,
      text: string,
      speed: number,
    ) => {
      if (rm()) {
        apply(text);
        return;
      }
      for (let i = 1; i <= text.length; i++) {
        if (done) return;
        apply(text.slice(0, i));
        await sleep(speed);
      }
    };

    const fillInstitution = async (query: string, commit: string) => {
      const input = stepBodyRef.current?.querySelector<HTMLInputElement>(
        'input[role="combobox"]',
      );
      if (!input) {
        patch({ institution: commit });
        return;
      }
      input.focus();
      if (rm()) {
        setNativeInputValue(input, commit);
        return;
      }
      for (let i = 1; i <= query.length; i++) {
        if (done) return;
        setNativeInputValue(input, query.slice(0, i));
        await sleep(INSTITUTION_TYPE_SPEED);
      }
      await sleep(600);
      if (done) return;
      const option = Array.from(
        stepBodyRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="option"] button',
        ) ?? [],
      ).find((b) => b.textContent?.includes(commit));
      if (option) option.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      else patch({ institution: commit });
    };

    const fillStep = async (field: string) => {
      const plan = STEP_PLANS[field];
      if (!plan) return;
      switch (plan.kind) {
        case "multi": {
          const acc: Destination[] = [];
          for (const code of plan.picks) {
            if (done) return;
            acc.push(code);
            patch({ destinations: [...acc] });
            await sleep(PICK_STAGGER);
          }
          return;
        }
        case "single":
          patch({ [field]: plan.value } as Partial<Answers>);
          return;
        case "text":
          await typeInto(
            (v) => patch({ [field]: v } as Partial<Answers>),
            plan.text,
            TYPE_SPEED,
          );
          return;
        case "institution":
          await fillInstitution(plan.query, plan.commit);
          return;
        case "gpa":
          patch({ gpa_scale: plan.scale });
          await sleep(GPA_SCALE_TO_VALUE_PAUSE);
          if (done) return;
          await typeInto((v) => patch({ exact_gpa: v }), plan.exact, TYPE_SPEED);
          return;
        case "english":
          patch({ english_level: "certified" });
          await sleep(ENGLISH_REVEAL_PAUSE);
          if (done) return;
          await typeInto(
            (v) => patch({ english_exam_score: v }),
            plan.score,
            TYPE_SPEED,
          );
          return;
      }
    };

    const scrollWindowTo = (top: number) =>
      window.scrollTo({ top, behavior: rm() ? "auto" : "smooth" });

    const director = async () => {
      // ── HOME ────────────────────────────────────────────────────────────
      setPhase("home");
      window.scrollTo({ top: 0, behavior: "auto" });
      await sleep(HOME_DWELL);
      if (done) return;
      await moveCursorTo('[data-demo="start"]');
      if (done) return;
      await clickCursor();
      setCursor((c) => ({ ...c, visible: false }));
      await sleep(260);
      if (done) return;

      // ── QUIZ ────────────────────────────────────────────────────────────
      setPhase("quiz");
      for (let i = 0; i < TOTAL_STEPS; i++) {
        if (done) return;
        setStepIndex(i);
        window.scrollTo({ top: 0, behavior: "auto" });
        await sleep(i === 0 ? Q_FIRST_DELAY : Q_READ_PAUSE);
        if (done) return;
        await fillStep(QUESTIONS[i].field);
        if (done) return;
        await sleep(Q_AFTER_FILL);
      }
      if (done) return;

      // ── LOADING ─────────────────────────────────────────────────────────
      setPhase("loading");
      await sleep(LOADING_MS);
      if (done) return;

      // ── RESULTS + SAVE ──────────────────────────────────────────────────
      setPhase("results");
      window.scrollTo({ top: 0, behavior: "auto" });
      await sleep(RESULTS_READ);
      if (done) return;
      await moveCursorTo('[data-demo="save"]');
      if (done) return;
      await clickCursor();
      setSaved(true);
      await sleep(AFTER_SAVE_PAUSE);
      if (done) return;
      setShowViewApps(true);
      await sleep(VIEW_APPS_PAUSE);
      if (done) return;
      await moveCursorTo('[data-demo="view-apps"]');
      if (done) return;
      await clickCursor();
      setCursor((c) => ({ ...c, visible: false }));
      await sleep(240);
      if (done) return;

      // ── APPLICATIONS + SCROLL ───────────────────────────────────────────
      setPhase("applications");
      window.scrollTo({ top: 0, behavior: "auto" });
      await sleep(APPS_READ);
      if (done) return;
      scrollWindowTo(360);
      await sleep(APPS_SCROLL_PAUSE);
      if (done) return;
      scrollWindowTo(820);
      await sleep(APPS_SCROLL_PAUSE);
      if (done) return;
      scrollWindowTo(1240);
      await sleep(APPS_HOLD);
      if (done) return;

      w.__edfindDemoComplete = true;
      window.dispatchEvent(new CustomEvent("edfind:demo:complete"));
    };

    void director();

    return () => {
      done = true;
      timers.forEach(clearTimeout);
    };
  }, [runId]);

  const selected = useMemo(
    () => selectedValuesFor(answers, question.field),
    [answers, question.field],
  );
  const canAdvance = isQuestionAnswered(answers, question);
  const isLastStep = stepIndex === TOTAL_STEPS - 1;

  return (
    <div className="relative">
      {phase === "home" ? (
        <DemoHome onStart={() => setPhase("quiz")} />
      ) : phase === "loading" ? (
        <div className="mx-auto max-w-3xl px-6 py-16">
          {/* Director times the loading→results handoff; onComplete is a no-op. */}
          <QuizLoadingScreen onComplete={() => {}} />
        </div>
      ) : phase === "results" ? (
        <DemoResults
          matches={DEMO_MATCHES}
          saved={saved}
          onSave={() => setSaved(true)}
          showViewApps={showViewApps}
          onViewApps={() => setPhase("applications")}
          onReplay={restart}
        />
      ) : phase === "applications" ? (
        <ApplicationsClient
          email={DEMO_STUDENT.email}
          displayName={DEMO_STUDENT.displayName}
          items={DEMO_APPLICATIONS}
          tasks={DEMO_TASKS}
          documents={DEMO_DOCUMENTS}
          profile={DEMO_PROFILE}
        />
      ) : (
        <div className="mx-auto max-w-3xl px-6 pb-24">
          <div className="sticky top-16 z-10 -mx-6 border-b border-border bg-background/90 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <QuizProgressBar currentStep={stepIndex + 1} totalSteps={TOTAL_STEPS} />
          </div>

          <div ref={stepBodyRef} className="mt-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stepIndex}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <QuestionScreen
                  question={question}
                  answers={answers}
                  selected={selected}
                  onSelect={handleSelect}
                  onPatch={handlePatch}
                  onBack={null}
                  onNext={() => {}}
                  canAdvance={canAdvance}
                  isLastStep={isLastStep}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <QuizMascot className="mt-12" />
        </div>
      )}

      <DemoCursor
        x={cursor.x}
        y={cursor.y}
        visible={cursor.visible}
        clickId={cursor.clickId}
      />

      {!hideChrome ? (
        <>
          <span className="fixed bottom-6 left-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20 backdrop-blur">
            <Sparkles className="size-3.5" />
            {t("badge")}
          </span>
          <button
            type="button"
            onClick={restart}
            className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg transition hover:border-primary/40 hover:text-primary"
          >
            <RotateCw className="size-4" />
            {t("replay")}
          </button>
        </>
      ) : null}
    </div>
  );
}
