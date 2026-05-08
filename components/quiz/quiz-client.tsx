"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ANSWERS_VERSION,
  EMPTY_ANSWERS,
  QUESTIONS,
  QUIZ_DRAFT_STORAGE_KEY,
  TOTAL_STEPS,
  isQuestionAnswered,
  type Answers,
  type Destination,
} from "@/lib/quiz/schema";
import { QuizProgressBar } from "@/components/quiz/progress-bar";
import { QuizMascot } from "@/components/quiz/mascot";
import { QuestionScreen } from "@/components/quiz/question-screen";
import { QuizLoadingScreen } from "@/components/quiz/loading-screen";

type Phase = "questions" | "loading";

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
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("questions");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLDivElement | null>(null);

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

  const handleNext = useCallback(() => {
    if (!canAdvance) return;
    if (isLastStep) {
      setPhase("loading");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1));
  }, [canAdvance, isLastStep]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleLoadingComplete = useCallback(() => {
    // Phase 2: no backend wiring yet. The Server Action + real matchId arrive in Phase 4.
    clearDraft();
    router.push("/results/placeholder");
  }, [router]);

  const selectedValues = useMemo(
    () => selectedValuesFor(answers, question.field),
    [answers, question.field],
  );

  if (phase === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <QuizLoadingScreen onComplete={handleLoadingComplete} />
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
        <QuestionScreen
          question={question}
          selected={selectedValues}
          onSelect={handleSelect}
          onBack={stepIndex === 0 ? null : handleBack}
          onNext={handleNext}
          canAdvance={canAdvance}
          isLastStep={isLastStep}
        />
      </div>

      <QuizMascot className="mt-12" />
    </div>
  );
}
