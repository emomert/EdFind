/**
 * Quiz schema (v1).
 *
 * The shape stored in `profiles.answers` (jsonb) and the structured definitions
 * the quiz UI renders from. See docs/features/profile-quiz.md for the spec.
 *
 * Bump ANSWERS_VERSION (and add a new schema file) when questions or values
 * change. Old answers are kept as-is — never destructive-migrate quiz data.
 */

import { z } from "zod";

export const ANSWERS_VERSION = 1;

export const DESTINATIONS = ["IT", "NL", "DE", "GB", "ANY"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const FIELDS_OF_STUDY = [
  "business_management",
  "engineering",
  "computer_science_ai",
  "design",
  "architecture_built_environment",
  "economics_finance",
  "data_science",
  "social_sciences",
] as const;
export type FieldOfStudy = (typeof FIELDS_OF_STUDY)[number];

export const BUDGET_BRACKETS = [
  "<10k",
  "10-15k",
  "15-20k",
  "20-25k",
  "25k+",
  "flexible",
] as const;
export type BudgetBracket = (typeof BUDGET_BRACKETS)[number];

export const DURATIONS = ["12mo", "18mo", "24mo", "flexible"] as const;
export type Duration = (typeof DURATIONS)[number];

export const ENGLISH_LEVELS = [
  "intermediate",
  "upper-intermediate",
  "advanced",
  "proficient",
] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

export const SCHOLARSHIP_NEEDS = ["required", "helpful", "not_needed"] as const;
export type ScholarshipNeed = (typeof SCHOLARSHIP_NEEDS)[number];

export const CAREER_GOALS = [
  "work_in_europe",
  "work_internationally",
  "return_to_turkey",
  "phd_research",
  "entrepreneurship",
  "unsure",
] as const;
export type CareerGoal = (typeof CAREER_GOALS)[number];

export type Answers = {
  destinations: Destination[];
  field_of_study: FieldOfStudy | null;
  budget_per_year: BudgetBracket | null;
  duration_preference: Duration | null;
  english_level: EnglishLevel | null;
  scholarship_need: ScholarshipNeed | null;
  career_goal: CareerGoal | null;
};

export const EMPTY_ANSWERS: Answers = {
  destinations: [],
  field_of_study: null,
  budget_per_year: null,
  duration_preference: null,
  english_level: null,
  scholarship_need: null,
  career_goal: null,
};

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type QuestionBase = {
  step: number;
  legend: string;
  helper?: string;
};

export type SingleQuestion<K extends keyof Answers, V extends string> = QuestionBase & {
  field: K;
  select: "single";
  options: ReadonlyArray<Option<V>>;
};

export type MultiQuestion<K extends keyof Answers, V extends string> = QuestionBase & {
  field: K;
  select: "multi";
  options: ReadonlyArray<Option<V>>;
};

export type Question =
  | MultiQuestion<"destinations", Destination>
  | SingleQuestion<"field_of_study", FieldOfStudy>
  | SingleQuestion<"budget_per_year", BudgetBracket>
  | SingleQuestion<"duration_preference", Duration>
  | SingleQuestion<"english_level", EnglishLevel>
  | SingleQuestion<"scholarship_need", ScholarshipNeed>
  | SingleQuestion<"career_goal", CareerGoal>;

export const QUESTIONS: readonly Question[] = [
  {
    step: 1,
    field: "destinations",
    select: "multi",
    legend: "Which destination feels right for your master's journey?",
    helper: "Pick one or more. Choose \"No preference\" if you're open to anywhere.",
    options: [
      { value: "IT", label: "Italy" },
      { value: "NL", label: "Netherlands" },
      { value: "DE", label: "Germany" },
      { value: "GB", label: "United Kingdom" },
      { value: "ANY", label: "No preference" },
    ],
  },
  {
    step: 2,
    field: "field_of_study",
    select: "single",
    legend: "What field of study are you drawn to?",
    options: [
      { value: "business_management", label: "Business & Management" },
      { value: "engineering", label: "Engineering" },
      { value: "computer_science_ai", label: "Computer Science & AI" },
      { value: "design", label: "Design" },
      { value: "architecture_built_environment", label: "Architecture & Built Environment" },
      { value: "economics_finance", label: "Economics & Finance" },
      { value: "data_science", label: "Data Science" },
      { value: "social_sciences", label: "Social Sciences" },
    ],
  },
  {
    step: 3,
    field: "budget_per_year",
    select: "single",
    legend: "What's your budget per year?",
    helper: "Tuition only — not living costs. We'll show scholarships separately.",
    options: [
      { value: "<10k", label: "Under €10,000" },
      { value: "10-15k", label: "€10,000 – €15,000" },
      { value: "15-20k", label: "€15,000 – €20,000" },
      { value: "20-25k", label: "€20,000 – €25,000" },
      { value: "25k+", label: "Over €25,000" },
      { value: "flexible", label: "Flexible / not sure yet" },
    ],
  },
  {
    step: 4,
    field: "duration_preference",
    select: "single",
    legend: "How long do you want your program to be?",
    options: [
      { value: "12mo", label: "12 months" },
      { value: "18mo", label: "18 months" },
      { value: "24mo", label: "24 months" },
      { value: "flexible", label: "Flexible" },
    ],
  },
  {
    step: 5,
    field: "english_level",
    select: "single",
    legend: "What's your English level?",
    helper: "Self-assessment is fine. We'll match against each program's actual requirement.",
    options: [
      { value: "intermediate", label: "Intermediate (B1)" },
      { value: "upper-intermediate", label: "Upper-intermediate (B2)" },
      { value: "advanced", label: "Advanced (C1)" },
      { value: "proficient", label: "Proficient (C2)" },
    ],
  },
  {
    step: 6,
    field: "scholarship_need",
    select: "single",
    legend: "Do you need scholarship support?",
    options: [
      { value: "required", label: "Required — I need funding to attend" },
      { value: "helpful", label: "Helpful — I'd take one but can manage without" },
      { value: "not_needed", label: "Not needed" },
    ],
  },
  {
    step: 7,
    field: "career_goal",
    select: "single",
    legend: "What's your career goal after graduation?",
    options: [
      { value: "work_in_europe", label: "Work in Europe" },
      { value: "work_internationally", label: "Work internationally" },
      { value: "return_to_turkey", label: "Return to Turkey" },
      { value: "phd_research", label: "PhD or research" },
      { value: "entrepreneurship", label: "Start my own thing" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

export function isQuestionAnswered(answers: Answers, question: Question): boolean {
  if (question.field === "destinations") {
    return answers.destinations.length > 0;
  }
  return answers[question.field] !== null;
}

export const QUIZ_DRAFT_STORAGE_KEY = "edfind:quiz_draft:v1";

/**
 * Server-side validator for the answers blob. The Server Action runs this
 * before any DB write — every required key must be present and every value
 * must be in its enum/array. Tightened to mirror `Answers` exactly.
 */
export const AnswersSchema = z.object({
  destinations: z.array(z.enum(DESTINATIONS)).min(1),
  field_of_study: z.enum(FIELDS_OF_STUDY),
  budget_per_year: z.enum(BUDGET_BRACKETS),
  duration_preference: z.enum(DURATIONS),
  english_level: z.enum(ENGLISH_LEVELS),
  scholarship_need: z.enum(SCHOLARSHIP_NEEDS),
  career_goal: z.enum(CAREER_GOALS),
}) satisfies z.ZodType<{
  // Compile-time guard: AnswersSchema's parsed shape must match Answers
  // (with non-null fields, since validation rejects null at submit time).
  destinations: Destination[];
  field_of_study: FieldOfStudy;
  budget_per_year: BudgetBracket;
  duration_preference: Duration;
  english_level: EnglishLevel;
  scholarship_need: ScholarshipNeed;
  career_goal: CareerGoal;
}>;

export type ValidatedAnswers = z.infer<typeof AnswersSchema>;
