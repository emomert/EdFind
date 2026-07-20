"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  ANSWERS_VERSION,
  EMPTY_ANSWERS,
  QUESTIONS,
  QUIZ_DRAFT_STORAGE_KEY,
  TOTAL_STEPS,
  isQuestionAnswered,
  type Answers,
  type Destination,
  type ValidatedAnswers,
} from "@/lib/quiz/schema";
import { getOrCreateClientId } from "@/lib/quiz/client-id";
import { submitProfile } from "@/app/quiz/actions";
import { Button } from "@/components/ui/button";
import { QuizProgressBar } from "@/components/quiz/progress-bar";
import { QuizMascot } from "@/components/quiz/mascot";
import { QuestionScreen } from "@/components/quiz/question-screen";
import { QuizLoadingScreen } from "@/components/quiz/loading-screen";
import { SoundProvider, useSound } from "@/lib/sound/sound-context";

type Phase = "questions" | "loading" | "error";

type Draft = {
  answers: Answers;
  stepIndex: number;
  answers_version: number;
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUIZ_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (parsed.answers_version !== ANSWERS_VERSION) return null;
    if (!parsed.answers || typeof parsed.stepIndex !== "number") return null;
    return {
      answers: { ...EMPTY_ANSWERS, ...parsed.answers },
      stepIndex: Math.max(0, Math.min(parsed.stepIndex, TOTAL_STEPS - 1)),
      answers_version: ANSWERS_VERSION,
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage may be unavailable (private mode, quota). Continue without persistence.
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUIZ_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function selectedValuesFor(answers: Answers, field: keyof Answers): string[] {
  const value = answers[field];
  if (Array.isArray(value)) return value;
  return value === null ? [] : [value];
}

export function QuizClient() {
  return (
    <SoundProvider>
      <QuizClientInner />
    </SoundProvider>
  );
}

function QuizClientInner() {
  const t = useTranslations("quiz");
  const router = useRouter();
  const reduce = useReducedMotion();
  const { play } = useSound();
  const [phase, setPhase] = useState<Phase>("questions");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [hydrated, setHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const sequenceResolveRef = useRef<(() => void) | null>(null);

  // One-time hydration from localStorage on mount. setState-in-effect is the
  // documented React idiom here: localStorage isn't readable during SSR, so we
  // render with the defaults first (matching the server output) and then
  // promote the saved draft after mount.
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(draft.answers);
      setStepIndex(draft.stepIndex);
    }
    setHydrated(true);
  }, []);

  // Persist on change, but only after hydration so we don't clobber the saved draft.
  useEffect(() => {
    if (!hydrated) return;
    writeDraft({ answers, stepIndex, answers_version: ANSWERS_VERSION });
  }, [answers, stepIndex, hydrated]);

  // Move keyboard focus to the new question heading on step change.
  useEffect(() => {
    if (phase !== "questions") return;
    headingRef.current?.focus();
  }, [stepIndex, phase]);

  const question = QUESTIONS[stepIndex];
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const canAdvance = isQuestionAnswered(answers, question);

  const handleSelect = useCallback(
    (rawValue: string) => {
      setAnswers((prev) => {
        if (question.field === "destinations") {
          const value = rawValue as Destination;
          const current = prev.destinations;
          const isSelected = current.includes(value);

          // "ANY" is mutually exclusive with the country picks.
          if (value === "ANY") {
            return { ...prev, destinations: isSelected ? [] : ["ANY"] };
          }
          const withoutAny = current.filter((v) => v !== "ANY");
          const next = isSelected
            ? withoutAny.filter((v) => v !== value)
            : [...withoutAny, value];
          return { ...prev, destinations: next };
        }

        // Free-text: rawValue is the textarea's current contents. Empty
        // string → null so the answer stays "unset" rather than empty.
        if (question.select === "text") {
          const trimmed = rawValue.trim();
          return { ...prev, [question.field]: trimmed === "" ? null : rawValue };
        }

        // Single-select fields: toggling the same value clears it.
        const currentValue = prev[question.field];
        if (currentValue === rawValue) {
          return { ...prev, [question.field]: null };
        }
        return { ...prev, [question.field]: rawValue };
      });
    },
    [question],
  );

  const handleSubmit = useCallback(async () => {
    setErrorMessage(null);
    play("complete");
    setPhase("loading");

    // Build the sequence promise BEFORE mounting LoadingScreen so its
    // onSequenceComplete callback has somewhere to land.
    const sequencePromise = new Promise<void>((resolve) => {
      sequenceResolveRef.current = resolve;
    });

    const clientId = getOrCreateClientId();
    const submission = submitProfile({
      clientId,
      answers: answers as ValidatedAnswers,
    });

    const [, result] = await Promise.all([sequencePromise, submission]);

    if (result.ok) {
      clearDraft();
      router.push(`/results/${result.matchId}`);
      return;
    }

    if (result.needsAuth) {
      router.push(`/login?next=${encodeURIComponent("/quiz")}`);
      return;
    }

    setErrorMessage(result.error);
    setPhase("error");
  }, [answers, router, play]);

  const handleNext = useCallback(() => {
    if (!canAdvance) return;
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    play("advance");
    setStepIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1));
  }, [canAdvance, isLastStep, handleSubmit, play]);

  const handleBack = useCallback(() => {
    play("back");
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [play]);

  // Patch one or more answer fields at once — used by compound questions
  // (institution picker, GPA scale/exact/range, the "Other" write-ins).
  const handlePatch = useCallback((patch: Partial<Answers>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSequenceComplete = useCallback(() => {
    sequenceResolveRef.current?.();
    sequenceResolveRef.current = null;
  }, []);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setPhase("questions");
  }, []);

  const selectedValues = useMemo(
    () => selectedValuesFor(answers, question.field),
    [answers, question.field],
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
          {t.has("error.title") ? t("error.title") : "Something went wrong"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {errorMessage ??
            (t.has("error.default") ? t("error.default") : "Please try submitting again.")}
        </p>
        <div className="mt-8 flex gap-3">
          <Button type="button" variant="outline" onClick={handleRetry}>
            <ArrowLeft />
            {t.has("buttons.backToQuestions")
              ? t("buttons.backToQuestions")
              : "Back to questions"}
          </Button>
          <Button type="button" onClick={handleSubmit}>
            <RotateCw />
            {t.has("buttons.tryAgain") ? t("buttons.tryAgain") : "Try again"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <div className="sticky top-16 z-10 -mx-6 border-b border-border bg-background/90 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <QuizProgressBar currentStep={stepIndex + 1} totalSteps={TOTAL_STEPS} />
      </div>

      <div
        ref={headingRef}
        tabIndex={-1}
        className="mt-10 outline-none"
        aria-live="polite"
      >
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
              selected={selectedValues}
              onSelect={handleSelect}
              onPatch={handlePatch}
              onBack={stepIndex === 0 ? null : handleBack}
              onNext={handleNext}
              canAdvance={canAdvance}
              isLastStep={isLastStep}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <QuizMascot className="mt-12" />
    </div>
  );
}
