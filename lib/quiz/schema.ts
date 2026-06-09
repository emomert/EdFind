/**
 * Quiz schema (current: v4).
 *
 * The shape stored in `profiles.answers` (jsonb) and the structured definitions
 * the quiz UI renders from. See docs/features/profile-quiz.md for the spec.
 *
 * Bump ANSWERS_VERSION (and add a new schema file) when questions or values
 * change. Old answers are kept as-is — never destructive-migrate quiz data.
 *
 * v4 (2026-06-09): added current_situation + gpa_range single-selects and an
 * optional study_background free-text; reframed english_level from CEFR bands
 * to exam-readiness wording.
 */

import { z } from "zod";

export const ANSWERS_VERSION = 4;

// Mirrors the set of countries that actually appear in `universities.country`
// (currently 18). Adding values here is forward-compatible — old answers that
// reference a subset stay valid, so no ANSWERS_VERSION bump is required.
export const DESTINATIONS = [
  "IT",
  "NL",
  "DE",
  "GB",
  "ES",
  "FR",
  "CH",
  "SE",
  "DK",
  "IE",
  "AT",
  "BE",
  "CZ",
  "EE",
  "FI",
  "NO",
  "PL",
  "PT",
  "ANY",
] as const;
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
  "exam_ready",
  "no_exam_yet",
  "intermediate",
  "needs_improvement",
] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

export const CURRENT_SITUATIONS = [
  "undergraduate",
  "recent_graduate",
  "working_professional",
  "gap_year",
  "other",
] as const;
export type CurrentSituation = (typeof CURRENT_SITUATIONS)[number];

export const GPA_RANGES = [
  "below_2_0",
  "2_0_2_5",
  "2_5_3_0",
  "3_0_3_5",
  "3_5_plus",
] as const;
export type GpaRange = (typeof GPA_RANGES)[number];

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

export const ACADEMIC_FOCUS = ["research", "applied", "balanced"] as const;
export type AcademicFocus = (typeof ACADEMIC_FOCUS)[number];

export const WORK_EXPERIENCES = [
  "none",
  "1-2_years",
  "3-5_years",
  "5_plus_years",
] as const;
export type WorkExperience = (typeof WORK_EXPERIENCES)[number];

export type Answers = {
  destinations: Destination[];
  current_situation: CurrentSituation | null;
  field_of_study: FieldOfStudy | null;
  // Optional free-text: the student's undergraduate background in their words.
  study_background: string | null;
  gpa_range: GpaRange | null;
  budget_per_year: BudgetBracket | null;
  duration_preference: Duration | null;
  english_level: EnglishLevel | null;
  scholarship_need: ScholarshipNeed | null;
  career_goal: CareerGoal | null;
  academic_focus: AcademicFocus | null;
  work_experience: WorkExperience | null;
  // Optional free-text. Lets the student volunteer anything that doesn't fit a
  // multiple-choice box (specific labs, family in a city, motivation). Fed to
  // the matcher verbatim and quoted back in the rationale.
  additional_context: string | null;
};

export const EMPTY_ANSWERS: Answers = {
  destinations: [],
  current_situation: null,
  field_of_study: null,
  study_background: null,
  gpa_range: null,
  budget_per_year: null,
  duration_preference: null,
  english_level: null,
  scholarship_need: null,
  career_goal: null,
  academic_focus: null,
  work_experience: null,
  additional_context: null,
};

export const ADDITIONAL_CONTEXT_MAX_LENGTH = 500;
export const STUDY_BACKGROUND_MAX_LENGTH = 200;

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

// Free-text question. The Next button is enabled even with empty text — the
// field is genuinely optional.
export type FreeTextQuestion<K extends keyof Answers> = QuestionBase & {
  field: K;
  select: "text";
  placeholder: string;
  maxLength: number;
};

export type Question =
  | MultiQuestion<"destinations", Destination>
  | SingleQuestion<"current_situation", CurrentSituation>
  | SingleQuestion<"field_of_study", FieldOfStudy>
  | FreeTextQuestion<"study_background">
  | SingleQuestion<"gpa_range", GpaRange>
  | SingleQuestion<"budget_per_year", BudgetBracket>
  | SingleQuestion<"duration_preference", Duration>
  | SingleQuestion<"english_level", EnglishLevel>
  | SingleQuestion<"scholarship_need", ScholarshipNeed>
  | SingleQuestion<"career_goal", CareerGoal>
  | SingleQuestion<"academic_focus", AcademicFocus>
  | SingleQuestion<"work_experience", WorkExperience>
  | FreeTextQuestion<"additional_context">;

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
      { value: "ES", label: "Spain" },
      { value: "FR", label: "France" },
      { value: "CH", label: "Switzerland" },
      { value: "SE", label: "Sweden" },
      { value: "DK", label: "Denmark" },
      { value: "IE", label: "Ireland" },
      { value: "AT", label: "Austria" },
      { value: "BE", label: "Belgium" },
      { value: "CZ", label: "Czechia" },
      { value: "EE", label: "Estonia" },
      { value: "FI", label: "Finland" },
      { value: "NO", label: "Norway" },
      { value: "PL", label: "Poland" },
      { value: "PT", label: "Portugal" },
      { value: "ANY", label: "No preference" },
    ],
  },
  {
    step: 2,
    field: "current_situation",
    select: "single",
    legend: "What best describes your current situation?",
    options: [
      { value: "undergraduate", label: "Undergraduate student" },
      { value: "recent_graduate", label: "Recent graduate" },
      { value: "working_professional", label: "Working professional" },
      { value: "gap_year", label: "Gap year" },
      { value: "other", label: "Other" },
    ],
  },
  {
    step: 3,
    field: "field_of_study",
    select: "single",
    legend: "What field of study are you drawn to?",
    helper: "The field you want to study next — not necessarily what you studied before.",
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
    step: 4,
    field: "study_background",
    select: "text",
    legend: "What did you study? (optional)",
    helper:
      "Your undergraduate field, in your own words — it helps us judge fit and eligibility. The AI reads this alongside your answers.",
    placeholder:
      "e.g. BSc Civil Engineering at METU, or Business Administration, or switching in from Biology…",
    maxLength: STUDY_BACKGROUND_MAX_LENGTH,
  },
  {
    step: 5,
    field: "gpa_range",
    select: "single",
    legend: "What's your approximate GPA range?",
    helper: "On a 4.0 scale (roughly). A ballpark is fine — it helps gauge eligibility.",
    options: [
      { value: "below_2_0", label: "Below 2.0" },
      { value: "2_0_2_5", label: "2.0 – 2.5" },
      { value: "2_5_3_0", label: "2.5 – 3.0" },
      { value: "3_0_3_5", label: "3.0 – 3.5" },
      { value: "3_5_plus", label: "3.5+" },
    ],
  },
  {
    step: 6,
    field: "english_level",
    select: "single",
    legend: "How would you describe your English level?",
    helper: "Self-assessment is fine. We'll match against each program's actual requirement.",
    options: [
      { value: "exam_ready", label: "IELTS/TOEFL ready" },
      { value: "no_exam_yet", label: "Good, but haven't taken an exam yet" },
      { value: "intermediate", label: "Intermediate" },
      { value: "needs_improvement", label: "Need improvement" },
    ],
  },
  {
    step: 7,
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
    step: 8,
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
    step: 9,
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
    step: 10,
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
  {
    step: 11,
    field: "academic_focus",
    select: "single",
    legend: "What style of master's appeals to you?",
    helper: "We'll weigh research-heavy programs differently from job-oriented ones.",
    options: [
      {
        value: "research",
        label: "Research-heavy",
        description: "Stepping stone to a PhD, theoretical depth, thesis-driven",
      },
      {
        value: "applied",
        label: "Industry-applied",
        description: "Hands-on projects, internships, job-ready skills",
      },
      {
        value: "balanced",
        label: "Balanced",
        description: "A bit of both — keep options open",
      },
    ],
  },
  {
    step: 12,
    field: "work_experience",
    select: "single",
    legend: "How much full-time work experience do you have?",
    helper: "Some programs (like LBS MiM) prefer 1-3 years; others welcome fresh graduates.",
    options: [
      { value: "none", label: "None or under a year" },
      { value: "1-2_years", label: "1-2 years" },
      { value: "3-5_years", label: "3-5 years" },
      { value: "5_plus_years", label: "5+ years" },
    ],
  },
  {
    step: 13,
    field: "additional_context",
    select: "text",
    legend: "Anything else we should know? (optional)",
    helper:
      "Specific labs you want to work with, family in a city you'd join, why this field really, anything we'd miss from multiple choice. The AI reads this and quotes it in your rationale.",
    placeholder:
      "e.g. I'm switching from civil engineering to data science, or I want to be near my partner in Berlin, or I'm aiming for Prof. Smith's robotics lab at TU Delft…",
    maxLength: ADDITIONAL_CONTEXT_MAX_LENGTH,
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

export function isQuestionAnswered(answers: Answers, question: Question): boolean {
  if (question.field === "destinations") {
    return answers.destinations.length > 0;
  }
  // Free-text is optional — Next is always enabled, even with empty input.
  if (question.select === "text") {
    return true;
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
  // current_situation + gpa_range are required in the guided quiz UI but
  // nullable at the data layer: the /search free-text path can't reliably
  // infer them, and we'd rather store null than fabricate a GPA.
  current_situation: z.enum(CURRENT_SITUATIONS).nullable().optional().default(null),
  field_of_study: z.enum(FIELDS_OF_STUDY),
  // Optional free-text undergraduate background (null when skipped).
  study_background: z
    .string()
    .max(STUDY_BACKGROUND_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  gpa_range: z.enum(GPA_RANGES).nullable().optional().default(null),
  budget_per_year: z.enum(BUDGET_BRACKETS),
  duration_preference: z.enum(DURATIONS),
  english_level: z.enum(ENGLISH_LEVELS),
  scholarship_need: z.enum(SCHOLARSHIP_NEEDS),
  career_goal: z.enum(CAREER_GOALS),
  academic_focus: z.enum(ACADEMIC_FOCUS),
  work_experience: z.enum(WORK_EXPERIENCES),
  // Optional and bounded — null or empty string when the student skipped it.
  // Defaulted on the server when older clients submit a payload without it.
  additional_context: z
    .string()
    .max(ADDITIONAL_CONTEXT_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
}) satisfies z.ZodType<{
  // Compile-time guard: AnswersSchema's parsed shape must match Answers
  // (with non-null fields where validation rejects null at submit time).
  destinations: Destination[];
  current_situation: CurrentSituation | null;
  field_of_study: FieldOfStudy;
  study_background: string | null;
  gpa_range: GpaRange | null;
  budget_per_year: BudgetBracket;
  duration_preference: Duration;
  english_level: EnglishLevel;
  scholarship_need: ScholarshipNeed;
  career_goal: CareerGoal;
  academic_focus: AcademicFocus;
  work_experience: WorkExperience;
  additional_context: string | null;
}>;

export type ValidatedAnswers = z.infer<typeof AnswersSchema>;
