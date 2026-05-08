"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerCard } from "@/components/quiz/answer-card";
import type { Question } from "@/lib/quiz/schema";

type Props = {
  question: Question;
  selected: string[];
  onSelect: (value: string) => void;
  onBack: (() => void) | null;
  onNext: () => void;
  canAdvance: boolean;
  isLastStep: boolean;
};

export function QuestionScreen({
  question,
  selected,
  onSelect,
  onBack,
  onNext,
  canAdvance,
  isLastStep,
}: Props) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {question.legend}
      </legend>
      {question.helper ? (
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{question.helper}</p>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <AnswerCard
            key={option.value}
            name={question.field}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selected.includes(option.value)}
            selectMode={question.select}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft />
            Back
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
        <Button type="button" onClick={onNext} disabled={!canAdvance} size="lg">
          {isLastStep ? "See my matches" : "Next"}
          <ArrowRight />
        </Button>
      </div>
    </fieldset>
  );
}
