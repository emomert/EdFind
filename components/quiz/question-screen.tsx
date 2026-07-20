"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Globe2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnswerCard } from "@/components/quiz/answer-card";
import { InstitutionCombobox } from "@/components/quiz/institution-combobox";
import { MarkerSparkles, MarkerStar } from "@/components/decor/marker";
import { EXACT_GPA_MAX_LENGTH } from "@/lib/quiz/schema";
import type {
  Answers,
  CurrentSituation,
  Destination,
  GpaQuestion,
  GpaScale,
  Option,
  OtherSpec,
  Question,
} from "@/lib/quiz/schema";

// Translations overlay the English strings in lib/quiz/schema.ts (the AI
// prompt builder reads that file's labels, and option `value`s are
// persisted — the schema itself is never edited for i18n). Every lookup
// falls back to the schema's English text when a key is missing. See
// docs/features/i18n.md § quiz label overlays.
type Translator = ReturnType<typeof useTranslations>;

function tf(t: Translator, key: string, fallback: string): string {
  return t.has(key) ? t(key) : fallback;
}

// `pathPrefix` is the dotted path (under "questions.") to the options map —
// e.g. "destinations.options" for a normal question, or
// "gpa_range.scaleOptions" for the GPA question's grading-scale picker.
function optionLabel<V extends string>(
  t: Translator,
  pathPrefix: string,
  option: Option<V>,
): string {
  return tf(t, `questions.${pathPrefix}.${option.value}`, option.label);
}

function optionDescription<V extends string>(
  t: Translator,
  pathPrefix: string,
  option: Option<V>,
): string | undefined {
  if (!option.description) return undefined;
  return tf(t, `questions.${pathPrefix}.${option.value}`, option.description);
}

// d3-geo + topojson-client + the 90 KB topo file are lazy-loaded so they
// only ship when the user actually reaches question 1.
function EuropeGlobeLoading() {
  const t = useTranslations("quiz");
  return (
    <div className="mx-auto flex aspect-square w-full max-w-[480px] items-center justify-center">
      <div className="size-[88%] animate-pulse rounded-full bg-gradient-to-br from-teal-50 to-emerald-100" />
      <span className="sr-only">
        {tf(t, "questions.destinations.loadingMap", "Loading map…")}
      </span>
    </div>
  );
}

const EuropeGlobe = dynamic(
  () => import("@/components/quiz/europe-globe").then((m) => m.EuropeGlobe),
  {
    ssr: false,
    loading: EuropeGlobeLoading,
  },
);

type Props = {
  question: Question;
  answers: Answers;
  selected: string[];
  onSelect: (value: string) => void;
  onPatch: (patch: Partial<Answers>) => void;
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

// The institution legend adapts to the student's stated situation so the
// wording is natural (studying / graduating / graduated).
function institutionLegend(t: Translator, cs: CurrentSituation | null): string {
  switch (cs) {
    case "undergraduate":
      return tf(
        t,
        "questions.institution.legend.undergraduate",
        "Which university are you studying at?",
      );
    case "graduating_soon":
      return tf(
        t,
        "questions.institution.legend.graduatingSoon",
        "Which university will you graduate from?",
      );
    case "recent_graduate":
    case "gap_year":
    case "working_professional":
      return tf(
        t,
        "questions.institution.legend.graduated",
        "Which university did you graduate from?",
      );
    default:
      return tf(
        t,
        "questions.institution.legend.default",
        "Which university did you study at?",
      );
  }
}

export function QuestionScreen({
  question,
  answers,
  selected,
  onSelect,
  onPatch,
  onBack,
  onNext,
  canAdvance,
  isLastStep,
}: Props) {
  const t = useTranslations("quiz");
  const isDestinations = question.field === "destinations";
  const legend =
    question.select === "institution"
      ? institutionLegend(t, answers.current_situation)
      : tf(t, `questions.${question.field}.legend`, question.legend);
  const helper = question.helper
    ? tf(t, `questions.${question.field}.helper`, question.helper)
    : null;

  return (
    <fieldset className="border-0 p-0">
      <legend className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {legend}
      </legend>
      {helper ? (
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{helper}</p>
      ) : null}

      {isDestinations ? (
        <DestinationGlobe selected={selected} onSelect={onSelect} />
      ) : question.select === "institution" ? (
        <InstitutionCombobox
          value={answers.institution}
          onChange={(v) => onPatch({ institution: v })}
        />
      ) : question.select === "gpa" ? (
        <GpaPicker question={question} answers={answers} onPatch={onPatch} />
      ) : question.select === "text" ? (
        <FreeTextInput
          questionField={question.field}
          value={selected[0] ?? ""}
          placeholder={question.placeholder}
          maxLength={question.maxLength}
          required={Boolean(question.required)}
          ariaLabel={legend}
          onChange={onSelect}
        />
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => (
              <AnswerCard
                key={option.value}
                name={question.field}
                value={option.value}
                label={optionLabel(t, `${question.field}.options`, option)}
                description={optionDescription(
                  t,
                  `${question.field}.optionDescriptions`,
                  option,
                )}
                selected={selected.includes(option.value)}
                selectMode={question.select}
                onSelect={onSelect}
              />
            ))}
          </div>
          {question.select === "single" &&
          question.other &&
          answers[question.field] === question.other.whenValue ? (
            <OtherTextInput
              questionField={question.field}
              spec={question.other}
              value={
                typeof answers[question.other.field] === "string"
                  ? (answers[question.other.field] as string)
                  : ""
              }
              onPatch={onPatch}
            />
          ) : null}
        </>
      )}

      <div className="mt-10 flex items-center justify-between gap-3">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft />
            {tf(t, "buttons.back", "Back")}
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
        <Button type="button" onClick={onNext} disabled={!canAdvance} size="lg">
          {isLastStep
            ? tf(t, "buttons.seeMyMatches", "See my matches")
            : tf(t, "buttons.next", "Next")}
          <ArrowRight />
        </Button>
      </div>
    </fieldset>
  );
}

function GpaPicker({
  question,
  answers,
  onPatch,
}: {
  question: GpaQuestion;
  answers: Answers;
  onPatch: (patch: Partial<Answers>) => void;
}) {
  const t = useTranslations("quiz");
  const scale = answers.gpa_scale;
  const scaleChosen = scale !== null;
  // The 4.0-scale quick-pick bands only make sense on a 4.0 scale.
  const showRange = scale === "4_point";
  const pickScale = (next: GpaScale | null) => {
    // Switching to a non-4.0 scale clears any stale 4.0 band so the matcher
    // never receives a band that contradicts the chosen scale.
    if (next === null || next === "4_point") onPatch({ gpa_scale: next });
    else onPatch({ gpa_scale: next, gpa_range: null });
  };
  const scaleOption = question.scaleOptions.find((o) => o.value === scale);
  const scaleLabel = scaleOption
    ? optionLabel(t, "gpa_range.scaleOptions", scaleOption)
    : "";
  const exactPlaceholder = tf(
    t,
    "questions.gpa_range.exactPlaceholder",
    question.exactPlaceholder,
  );

  // Step 1 — choose the grading scale. The picker collapses once a scale is set.
  if (!scaleChosen) {
    return (
      <div className="mt-8">
        <p className="text-sm font-medium text-foreground">
          {tf(
            t,
            "questions.gpa_range.chooseScalePrompt",
            "First, which grading scale does your school use?",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {question.scaleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pickScale(opt.value)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              {optionLabel(t, "gpa_range.scaleOptions", opt)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2 — scale chosen: collapse it to a summary and reveal the GPA entry.
  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-secondary/40 px-4 py-2.5">
        <p className="text-sm text-foreground">
          {tf(t, "questions.gpa_range.gradingScaleLabel", "Grading scale:")}{" "}
          <span className="font-semibold">{scaleLabel}</span>
        </p>
        <button
          type="button"
          onClick={() => pickScale(null)}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          {tf(t, "questions.gpa_range.change", "Change")}
        </button>
      </div>

      <div>
        <label htmlFor="exact-gpa" className="text-sm font-medium text-foreground">
          {tf(t, "questions.gpa_range.enterGpaLabel", "Now enter your GPA")}
        </label>
        <input
          id="exact-gpa"
          type="text"
          inputMode="decimal"
          autoFocus
          value={answers.exact_gpa ?? ""}
          maxLength={EXACT_GPA_MAX_LENGTH}
          placeholder={exactPlaceholder}
          onChange={(e) =>
            onPatch({
              exact_gpa:
                e.target.value.trim() === "" ? null : e.target.value,
            })
          }
          className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
        />
      </div>

      {showRange ? (
        <div>
          <p className="text-sm font-medium text-foreground">
            {tf(t, "questions.gpa_range.orPickRange", "…or pick a rough range")}{" "}
            <span className="font-normal text-muted-foreground">
              {tf(t, "questions.gpa_range.rangeScaleNote", "(4.0 scale)")}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {question.rangeOptions.map((opt) => {
              const active = answers.gpa_range === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onPatch({ gpa_range: active ? null : opt.value })
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-secondary/60 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40",
                  )}
                >
                  {optionLabel(t, "gpa_range.rangeOptions", opt)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OtherTextInput({
  questionField,
  spec,
  value,
  onPatch,
}: {
  questionField: string;
  spec: OtherSpec;
  value: string;
  onPatch: (patch: Partial<Answers>) => void;
}) {
  const t = useTranslations("quiz");
  const inputId = `other-${spec.field}`;
  const label = spec.label
    ? tf(t, `questions.${questionField}.other.label`, spec.label)
    : undefined;
  const placeholder = tf(
    t,
    `questions.${questionField}.other.placeholder`,
    spec.placeholder,
  );
  const ariaLabel = label ?? tf(t, "freeText.pleaseDescribe", "Please describe");

  return (
    <div className="mt-3">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        type="text"
        value={value}
        maxLength={spec.maxLength}
        placeholder={placeholder}
        autoFocus
        onChange={(e) =>
          onPatch({
            [spec.field]:
              e.target.value.trim() === "" ? null : e.target.value,
          } as Partial<Answers>)
        }
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label={ariaLabel}
      />
    </div>
  );
}

function FreeTextInput({
  questionField,
  value,
  placeholder,
  maxLength,
  required,
  ariaLabel,
  onChange,
}: {
  questionField: string;
  value: string;
  placeholder: string;
  maxLength: number;
  required: boolean;
  ariaLabel: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations("quiz");
  const remaining = maxLength - value.length;
  const resolvedPlaceholder = tf(
    t,
    `questions.${questionField}.placeholder`,
    placeholder,
  );
  const hint = required
    ? tf(
        t,
        "freeText.requiredHint",
        "A sentence or two is plenty — it sharpens your matches.",
      )
    : tf(
        t,
        "freeText.optionalHint",
        "You can skip this — the AI will still match using your other answers.",
      );
  const charsLeft = t.has("freeText.charsLeft")
    ? t("freeText.charsLeft", { count: remaining })
    : `${remaining} characters left`;

  return (
    <div className="mt-8">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={resolvedPlaceholder}
        rows={5}
        maxLength={maxLength}
        className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label={ariaLabel}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{hint}</span>
        <span
          aria-live="polite"
          className={remaining < 50 ? "text-amber-700" : ""}
        >
          {charsLeft}
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
  const t = useTranslations("quiz");
  const picked = selected.filter((s): s is Destination =>
    s !== "ANY" && s in DESTINATION_NAMES,
  );
  const anyPicked = selected.includes("ANY");
  const countryName = (code: Destination): string =>
    tf(t, `questions.destinations.options.${code}`, DESTINATION_NAMES[code]);

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
          {tf(t, "questions.destinations.anywhereInEurope", "Anywhere in Europe")}
        </button>

        {picked.length > 0 ? (
          <span
            aria-hidden="true"
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            {tf(t, "questions.destinations.or", "or")}
          </span>
        ) : null}

        {picked.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            aria-label={
              t.has("questions.destinations.removeCountryAria")
                ? t("questions.destinations.removeCountryAria", {
                    country: countryName(code),
                  })
                : `Remove ${countryName(code)} from selection`
            }
          >
            {countryName(code)}
            <X className="size-3 text-primary/70 transition-transform group-hover:scale-110" />
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {anyPicked
          ? tf(
              t,
              "questions.destinations.matchingAllCountries",
              "Matching across all 18 countries in our catalog.",
            )
          : picked.length === 0
          ? tf(
              t,
              "questions.destinations.clickToAdd",
              "Click any highlighted country to add it. Click a chip to remove.",
            )
          : t.has("questions.destinations.selectedCount")
          ? t("questions.destinations.selectedCount", { count: picked.length })
          : `${picked.length} selected — click again to remove, or pick more.`}
      </p>
    </div>
  );
}
