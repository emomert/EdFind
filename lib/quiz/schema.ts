/**
 * Quiz schema (current: v5).
 *
 * The shape stored in `profiles.answers` (jsonb) and the structured definitions
 * the quiz UI renders from. See docs/features/profile-quiz.md for the spec.
 *
 * Bump ANSWERS_VERSION (and add a new schema file) when questions or values
 * change. Old answers are kept as-is — never destructive-migrate quiz data.
 *
 * v5 (2026-06-10):
 *   - current_situation: split the overlapping recent-grad/gap-year choices,
 *     added "graduating soon", and a writable "Other" (current_situation_other).
 *     reframed english_level into CEFR-anchored, professional options.
 *   - Added an `institution` question (searchable Turkish-university picker with
 *     free-text fallback), inserted before the academic-background question.
 *   - Dropped the structured "field you're drawn to" picker. The required
 *     free-text `study_background` ("What did you study?") replaces it; the AI
 *     infers the structured field_of_study (now nullable) from that text.
 *   - GPA is now a compound question: gpa_scale (grading system) + exact_gpa
 *     (free text) + gpa_range (rough 4.0 band).
 *   - budget_per_year gained a "tuition_free" option.
 *   - career_goal gained options + a writable "Other" (career_goal_other).
 *
 * v6 (2026-06-10): added `english_exam_score` (free-text, revealed when
 * english_level === "certified") so a student can record their actual IELTS/
 * TOEFL/Duolingo score. The GPA question also became a two-step "journey"
 * (pick the grading scale, then enter the value) — a pure UI change in
 * question-screen.tsx, no new field.
 *
 * v7 (2026-06-11): split the study question in two. `study_background` now
 * asks ONLY what the student studied (undergrad background); a new required
 * free-text `desired_study` asks what they WANT to study next — deliberately
 * open-ended (a word like "politics", a precise topic like "political economy
 * of East Asia", or something vague like "I like politics" are all valid).
 * The AI infers `field_of_study` primarily from `desired_study` now.
 *
 * UI-required-but-data-nullable fields (current_situation, institution,
 * study_background, gpa_*): the guided quiz requires them, but the /search
 * free-text path can't reliably infer them and we'd rather store null than
 * fabricate. The strict server-required fields stay non-null in AnswersSchema.
 */

import { z } from "zod";

export const ANSWERS_VERSION = 7;

// Mirrors the set of countries that actually appear in `universities.country`.
// Adding values here is forward-compatible — old answers that reference a
// subset stay valid, so no ANSWERS_VERSION bump is required.
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
  "tuition_free",
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
  "certified",
  "exam_ready",
  "advanced",
  "upper_intermediate",
  "intermediate",
  "beginner",
] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

export const CURRENT_SITUATIONS = [
  "undergraduate",
  "graduating_soon",
  "recent_graduate",
  "gap_year",
  "working_professional",
  "other",
] as const;
export type CurrentSituation = (typeof CURRENT_SITUATIONS)[number];

// Grading system the student's GPA is expressed on. Asked first so the exact
// value + rough band are interpreted on the right scale.
export const GPA_SCALES = [
  "4_point",
  "100_point",
  "5_point",
  "10_point",
  "ects_letter",
  "uk_class",
  "other",
] as const;
export type GpaScale = (typeof GPA_SCALES)[number];

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
  "return_to_turkey",
  "work_internationally",
  "phd_research",
  "industry_expert",
  "career_switch",
  "entrepreneurship",
  "unsure",
  "other",
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

export const ADDITIONAL_CONTEXT_MAX_LENGTH = 500;
export const STUDY_BACKGROUND_MAX_LENGTH = 200;
export const DESIRED_STUDY_MAX_LENGTH = 300;
export const INSTITUTION_MAX_LENGTH = 120;
export const SITUATION_OTHER_MAX_LENGTH = 120;
export const CAREER_OTHER_MAX_LENGTH = 200;
export const EXACT_GPA_MAX_LENGTH = 24;
export const ENGLISH_EXAM_SCORE_MAX_LENGTH = 40;

export type Answers = {
  destinations: Destination[];
  current_situation: CurrentSituation | null;
  // Free-text companion shown when current_situation === "other".
  current_situation_other: string | null;
  // The student's home/undergraduate institution (Turkish university name or a
  // free-typed value). UI-required, nullable at the data layer.
  institution: string | null;
  // AI-inferred from study_background (no longer a direct question). Nullable.
  field_of_study: FieldOfStudy | null;
  // Required free-text undergraduate background, in the student's words.
  // Asks ONLY what they studied — the target field lives in desired_study.
  study_background: string | null;
  // Required free-text: what they WANT to study next, as open-ended as they
  // like ("economics", "political economy of East Asia", "I like politics").
  // The AI infers field_of_study primarily from this.
  desired_study: string | null;
  gpa_scale: GpaScale | null;
  gpa_range: GpaRange | null;
  // Free-text exact GPA in whatever scale the student picked ("3.42", "85").
  exact_gpa: string | null;
  budget_per_year: BudgetBracket | null;
  duration_preference: Duration | null;
  english_level: EnglishLevel | null;
  // Free-text exam score, shown only when english_level === "certified".
  english_exam_score: string | null;
  scholarship_need: ScholarshipNeed | null;
  career_goal: CareerGoal | null;
  // Free-text companion shown when career_goal === "other".
  career_goal_other: string | null;
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
  current_situation_other: null,
  institution: null,
  field_of_study: null,
  study_background: null,
  desired_study: null,
  gpa_scale: null,
  gpa_range: null,
  exact_gpa: null,
  budget_per_year: null,
  duration_preference: null,
  english_level: null,
  english_exam_score: null,
  scholarship_need: null,
  career_goal: null,
  career_goal_other: null,
  academic_focus: null,
  work_experience: null,
  additional_context: null,
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

// When a single-select option is the designated "other" value, reveal a
// free-text companion that writes into `field`.
export type OtherSpec = {
  whenValue: string;
  field: keyof Answers;
  // Accessible label for the revealed input (falls back to a generic one).
  label?: string;
  placeholder: string;
  maxLength: number;
};

export type SingleQuestion<K extends keyof Answers, V extends string> = QuestionBase & {
  field: K;
  select: "single";
  options: ReadonlyArray<Option<V>>;
  other?: OtherSpec;
};

export type MultiQuestion<K extends keyof Answers, V extends string> = QuestionBase & {
  field: K;
  select: "multi";
  options: ReadonlyArray<Option<V>>;
};

// Free-text question. When `required` is false/absent the Next button stays
// enabled even with empty text — the field is genuinely optional.
export type FreeTextQuestion<K extends keyof Answers> = QuestionBase & {
  field: K;
  select: "text";
  placeholder: string;
  maxLength: number;
  required?: boolean;
};

// Searchable institution picker (Turkish universities + free-text fallback).
export type InstitutionQuestion = QuestionBase & {
  field: "institution";
  select: "institution";
};

// Compound GPA question: grading scale + exact value + rough 4.0 band.
export type GpaQuestion = QuestionBase & {
  field: "gpa_range";
  select: "gpa";
  scaleOptions: ReadonlyArray<Option<GpaScale>>;
  rangeOptions: ReadonlyArray<Option<GpaRange>>;
  exactPlaceholder: string;
};

export type Question =
  | MultiQuestion<"destinations", Destination>
  | SingleQuestion<"current_situation", CurrentSituation>
  | InstitutionQuestion
  | FreeTextQuestion<"study_background">
  | FreeTextQuestion<"desired_study">
  | GpaQuestion
  | SingleQuestion<"english_level", EnglishLevel>
  | SingleQuestion<"budget_per_year", BudgetBracket>
  | SingleQuestion<"duration_preference", Duration>
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
      { value: "undergraduate", label: "Current undergraduate student" },
      { value: "graduating_soon", label: "Graduating soon (final year)" },
      {
        value: "recent_graduate",
        label: "Recent graduate",
        description: "Finished within the last couple of years",
      },
      {
        value: "gap_year",
        label: "On a gap year / break",
        description: "Graduated and currently taking time before the next step",
      },
      { value: "working_professional", label: "Working professional" },
      { value: "other", label: "Other" },
    ],
    other: {
      whenValue: "other",
      field: "current_situation_other",
      placeholder: "Tell us in a few words…",
      maxLength: SITUATION_OTHER_MAX_LENGTH,
    },
  },
  {
    step: 3,
    field: "institution",
    select: "institution",
    // The legend is overridden at render time to match the student's situation
    // (studying at / will graduate from / graduated from).
    legend: "Which university did you study at?",
    helper:
      "Start typing to search Turkish universities — or type any institution if yours isn't listed.",
  },
  {
    step: 4,
    field: "study_background",
    select: "text",
    required: true,
    legend: "What did you study?",
    helper:
      "Your undergraduate field, in your own words — just what you studied. The AI reads this to judge fit and eligibility. (What you want to study next is the following question.)",
    placeholder: "e.g. BSc Civil Engineering, or BA Sociology with an econ minor…",
    maxLength: STUDY_BACKGROUND_MAX_LENGTH,
  },
  {
    step: 5,
    field: "desired_study",
    select: "text",
    required: true,
    legend: "What do you want to study?",
    helper:
      "Be as free as you like. A field works (\"economics\"), so does something very specific (\"political economy of East Asia\") — and even a vague \"I like politics\" is enough. We'll work out the right programs either way.",
    placeholder:
      "e.g. data science, sustainable architecture, or just 'something with politics'…",
    maxLength: DESIRED_STUDY_MAX_LENGTH,
  },
  {
    step: 6,
    field: "gpa_range",
    select: "gpa",
    legend: "What's your GPA?",
    helper:
      "Pick the grading scale your school uses, then type your exact GPA. Not every school grades the same way — a ballpark is fine.",
    scaleOptions: [
      { value: "4_point", label: "4.0 scale" },
      { value: "100_point", label: "Out of 100" },
      { value: "5_point", label: "5.0 scale" },
      { value: "10_point", label: "Out of 10" },
      { value: "ects_letter", label: "ECTS / letter grades" },
      { value: "uk_class", label: "UK classification" },
      { value: "other", label: "Other" },
    ],
    rangeOptions: [
      { value: "below_2_0", label: "Below 2.0" },
      { value: "2_0_2_5", label: "2.0 – 2.5" },
      { value: "2_5_3_0", label: "2.5 – 3.0" },
      { value: "3_0_3_5", label: "3.0 – 3.5" },
      { value: "3_5_plus", label: "3.5+" },
    ],
    exactPlaceholder: "e.g. 3.42, 85/100, or 2.1 (Upper Second)",
  },
  {
    step: 7,
    field: "english_level",
    select: "single",
    legend: "How would you describe your English?",
    helper:
      "We'll match against each program's actual entry requirement. Self-assessment is fine.",
    options: [
      {
        value: "certified",
        label: "I have a valid IELTS / TOEFL / Duolingo score",
        description: "Test already passed and in date",
      },
      {
        value: "exam_ready",
        label: "Fluent — ready to sit IELTS/TOEFL",
        description: "Could pass the test, just haven't booked it yet",
      },
      {
        value: "advanced",
        label: "Advanced (C1)",
        description: "Comfortable with academic English",
      },
      { value: "upper_intermediate", label: "Upper-intermediate (B2)" },
      {
        value: "intermediate",
        label: "Intermediate (B1)",
        description: "Solid everyday English, still improving",
      },
      { value: "beginner", label: "Beginner / basic (A2 or below)" },
    ],
    // Revealed when "certified" is picked — capture the actual score.
    other: {
      whenValue: "certified",
      field: "english_exam_score",
      label: "Your IELTS / TOEFL / Duolingo score",
      placeholder: "e.g. IELTS 7.5, TOEFL 102, or Duolingo 125",
      maxLength: ENGLISH_EXAM_SCORE_MAX_LENGTH,
    },
  },
  {
    step: 8,
    field: "budget_per_year",
    select: "single",
    legend: "What's your budget per year?",
    helper: "Tuition only — not living costs. We'll show scholarships separately.",
    options: [
      {
        value: "tuition_free",
        label: "Tuition-free / fully-funded only",
        description: "Public universities with no or nominal tuition, or full scholarships",
      },
      { value: "<10k", label: "Under €10,000" },
      { value: "10-15k", label: "€10,000 – €15,000" },
      { value: "15-20k", label: "€15,000 – €20,000" },
      { value: "20-25k", label: "€20,000 – €25,000" },
      { value: "25k+", label: "Over €25,000" },
      { value: "flexible", label: "Flexible / not sure yet" },
    ],
  },
  {
    step: 9,
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
    step: 10,
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
    step: 11,
    field: "career_goal",
    select: "single",
    legend: "What's your goal after the master's?",
    helper: "We use this to weigh program character, location, and brand differently.",
    options: [
      { value: "work_in_europe", label: "Work in Europe after graduating" },
      {
        value: "return_to_turkey",
        label: "Return to Turkey with an international degree",
      },
      { value: "work_internationally", label: "Work internationally / global mobility" },
      { value: "phd_research", label: "Pursue a PhD or research career" },
      {
        value: "industry_expert",
        label: "Grow into a senior / specialist role in my field",
      },
      { value: "career_switch", label: "Switch into a new field or industry" },
      { value: "entrepreneurship", label: "Start my own company / venture" },
      { value: "unsure", label: "Still figuring it out" },
      { value: "other", label: "Other" },
    ],
    other: {
      whenValue: "other",
      field: "career_goal_other",
      placeholder: "Describe your goal in a few words…",
      maxLength: CAREER_OTHER_MAX_LENGTH,
    },
  },
  {
    step: 12,
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
    step: 13,
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
    step: 14,
    field: "additional_context",
    select: "text",
    legend: "Anything else we should know? (optional)",
    helper:
      "Specific labs you want to work with, family in a city you'd join, why this field really, anything we'd miss from multiple choice. The AI reads this and quotes it in your rationale.",
    placeholder:
      "e.g. I want to be near my partner in Berlin, or I'm aiming for Prof. Smith's robotics lab at TU Delft…",
    maxLength: ADDITIONAL_CONTEXT_MAX_LENGTH,
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

export function isQuestionAnswered(answers: Answers, question: Question): boolean {
  if (question.field === "destinations") {
    return answers.destinations.length > 0;
  }
  // Institution: UI-required — needs a non-empty value (picked or typed).
  if (question.select === "institution") {
    return (
      typeof answers.institution === "string" &&
      answers.institution.trim().length > 0
    );
  }
  // GPA: a two-step journey — the grading scale must be chosen first, then an
  // exact value or a rough band.
  if (question.select === "gpa") {
    if (answers.gpa_scale === null) return false;
    const hasExact =
      typeof answers.exact_gpa === "string" && answers.exact_gpa.trim().length > 0;
    return hasExact || answers.gpa_range !== null;
  }
  // Free-text: optional unless flagged required (study_background).
  if (question.select === "text") {
    if (question.required) {
      const v = answers[question.field];
      return typeof v === "string" && v.trim().length > 0;
    }
    return true;
  }
  return answers[question.field] !== null;
}

export const QUIZ_DRAFT_STORAGE_KEY = "edfind:quiz_draft:v1";

/**
 * Server-side validator for the answers blob. The Server Action runs this
 * before any DB write — every required key must be present and every value
 * must be in its enum/array. Tightened to mirror `Answers` exactly.
 *
 * Fields that are UI-required but `.nullable()` here (current_situation,
 * institution, study_background, gpa_*, field_of_study) are intentionally
 * nullable so the /search free-text path can submit a partial profile without
 * fabricating values.
 */
export const AnswersSchema = z.object({
  destinations: z.array(z.enum(DESTINATIONS)).min(1),
  current_situation: z.enum(CURRENT_SITUATIONS).nullable().optional().default(null),
  current_situation_other: z
    .string()
    .max(SITUATION_OTHER_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  institution: z
    .string()
    .max(INSTITUTION_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  // AI-inferred from study_background (no longer asked directly) — nullable.
  field_of_study: z.enum(FIELDS_OF_STUDY).nullable().optional().default(null),
  study_background: z
    .string()
    .max(STUDY_BACKGROUND_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  desired_study: z
    .string()
    .max(DESIRED_STUDY_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  gpa_scale: z.enum(GPA_SCALES).nullable().optional().default(null),
  gpa_range: z.enum(GPA_RANGES).nullable().optional().default(null),
  exact_gpa: z
    .string()
    .max(EXACT_GPA_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  budget_per_year: z.enum(BUDGET_BRACKETS),
  duration_preference: z.enum(DURATIONS),
  english_level: z.enum(ENGLISH_LEVELS),
  english_exam_score: z
    .string()
    .max(ENGLISH_EXAM_SCORE_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
  scholarship_need: z.enum(SCHOLARSHIP_NEEDS),
  career_goal: z.enum(CAREER_GOALS),
  career_goal_other: z
    .string()
    .max(CAREER_OTHER_MAX_LENGTH)
    .nullable()
    .optional()
    .default(null),
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
  current_situation_other: string | null;
  institution: string | null;
  field_of_study: FieldOfStudy | null;
  study_background: string | null;
  desired_study: string | null;
  gpa_scale: GpaScale | null;
  gpa_range: GpaRange | null;
  exact_gpa: string | null;
  budget_per_year: BudgetBracket;
  duration_preference: Duration;
  english_level: EnglishLevel;
  english_exam_score: string | null;
  scholarship_need: ScholarshipNeed;
  career_goal: CareerGoal;
  career_goal_other: string | null;
  academic_focus: AcademicFocus;
  work_experience: WorkExperience;
  additional_context: string | null;
}>;

export type ValidatedAnswers = z.infer<typeof AnswersSchema>;
