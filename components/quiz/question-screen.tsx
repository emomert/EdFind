"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Globe2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnswerCard } from "@/components/quiz/answer-card";
import { MarkerSparkles, MarkerStar } from "@/components/decor/marker";
import type { Destination, Question } from "@/lib/quiz/schema";

// d3-geo + topojson-client + the 90 KB topo file are lazy-loaded so they
// only ship when the user actually reaches question 1.
const EuropeGlobe = dynamic(
  () => import("@/components/quiz/europe-globe").then((m) => m.EuropeGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex aspect-square w-full max-w-[480px] items-center justify-center">
        <div className="size-[88%] animate-pulse rounded-full bg-gradient-to-br from-teal-50 to-emerald-100" />
        <span className="sr-only">Loading map…</span>
      </div>
    ),
  },
);

type Props = {
  question: Question;
  selected: string[];
  onSelect: (value: string) => void;
  onBack: (() => void) | null;
  onNext: () => void;
  canAdvance: boolean;
  isLastStep: boolean;
};

const DESTINATION_NAMES: Record<Destination, string> = {
  IT: "Italy",
  NL: "Netherlands",
  DE: "Germany",
  GB: "United Kingdom",
  ES: "Spain",
  FR: "France",
  CH: "Switzerland",
  SE: "Sweden",
  DK: "Denmark",
  IE: "Ireland",
  AT: "Austria",
  BE: "Belgium",
  CZ: "Czechia",
  EE: "Estonia",
  FI: "Finland",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  ANY: "Anywhere in Europe",
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
  const isDestinations = question.field === "destinations";

  return (
    <fieldset className="border-0 p-0">
      <legend className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {question.legend}
      </legend>
      {question.helper ? (
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {question.helper}
        </p>
      ) : null}

      {isDestinations ? (
        <DestinationGlobe selected={selected} onSelect={onSelect} />
      ) : question.select === "text" ? (
        <FreeTextInput
          value={selected[0] ?? ""}
          placeholder={question.placeholder}
          maxLength={question.maxLength}
          onChange={onSelect}
        />
      ) : (
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
      )}

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

function FreeTextInput({
  value,
  placeholder,
  maxLength,
  onChange,
}: {
  value: string;
  placeholder: string;
  maxLength: number;
  onChange: (next: string) => void;
}) {
  const remaining = maxLength - value.length;
  return (
    <div className="mt-8">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={5}
        maxLength={maxLength}
        className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Anything else we should know"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          You can skip this — the AI will still match using your other answers.
        </span>
        <span
          aria-live="polite"
          className={remaining < 50 ? "text-amber-700" : ""}
        >
          {remaining} characters left
        </span>
      </div>
    </div>
  );
}

function DestinationGlobe({
  selected,
  onSelect,
}: {
  selected: string[];
  onSelect: (value: string) => void;
}) {
  const picked = selected.filter((s): s is Destination =>
    s !== "ANY" && s in DESTINATION_NAMES,
  );
  const anyPicked = selected.includes("ANY");

  return (
    <div className="mt-8">
      <div className="relative">
        <MarkerSparkles
          aria-hidden
          className="pointer-events-none absolute -left-2 -top-4 size-9 text-primary/35"
        />
        <MarkerStar
          aria-hidden
          className="pointer-events-none absolute right-2 top-6 size-6 text-primary/30"
        />
        <EuropeGlobe
          selected={picked}
          onToggle={(code) => onSelect(code)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onSelect("ANY")}
          aria-pressed={anyPicked}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            anyPicked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40",
          ].join(" ")}
        >
          <Globe2 className="size-3.5" />
          Anywhere in Europe
        </button>

        {picked.length > 0 ? (
          <span
            aria-hidden="true"
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            or
          </span>
        ) : null}

        {picked.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            aria-label={`Remove ${DESTINATION_NAMES[code]} from selection`}
          >
            {DESTINATION_NAMES[code]}
            <X className="size-3 text-primary/70 transition-transform group-hover:scale-110" />
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {anyPicked
          ? "Matching across all 18 countries in our catalog."
          : picked.length === 0
          ? "Click any highlighted country to add it. Click a chip to remove."
          : `${picked.length} selected — click again to remove, or pick more.`}
      </p>
    </div>
  );
}
