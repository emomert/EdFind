import "server-only";

import { z } from "zod";

import {
  ACADEMIC_FOCUS,
  AnswersSchema,
  BUDGET_BRACKETS,
  CAREER_GOALS,
  CURRENT_SITUATIONS,
  DESTINATIONS,
  DURATIONS,
  ENGLISH_LEVELS,
  FIELDS_OF_STUDY,
  GPA_RANGES,
  SCHOLARSHIP_NEEDS,
  WORK_EXPERIENCES,
  type ValidatedAnswers,
} from "@/lib/quiz/schema";
import { callDeepSeek } from "@/lib/ai/client";

const DEEPSEEK_MODEL = "deepseek-v4-flash";

// Same shape as AnswersSchema but with all fields nullable so we can detect
// "not mentioned" and apply our own fallback rather than asking the model to
// hallucinate a defensible default.
const ParserOutputSchema = z.object({
  destinations: z.array(z.enum(DESTINATIONS)).nullable(),
  current_situation: z.enum(CURRENT_SITUATIONS).nullable(),
  field_of_study: z.enum(FIELDS_OF_STUDY).nullable(),
  gpa_range: z.enum(GPA_RANGES).nullable(),
  budget_per_year: z.enum(BUDGET_BRACKETS).nullable(),
  duration_preference: z.enum(DURATIONS).nullable(),
  english_level: z.enum(ENGLISH_LEVELS).nullable(),
  scholarship_need: z.enum(SCHOLARSHIP_NEEDS).nullable(),
  career_goal: z.enum(CAREER_GOALS).nullable(),
  academic_focus: z.enum(ACADEMIC_FOCUS).nullable(),
  work_experience: z.enum(WORK_EXPERIENCES).nullable(),
});

// Exported so the public /technical-report page can render the exact
// instructions we send to the model (single source of truth — no drift).
export const SYSTEM_PROMPT = `You are EdFind's free-text query parser. EdFind helps Turkish students find master's programs in Europe. The student typed a natural-language description of what they want; your job is to map it onto EdFind's 11-field structured profile.

Output strict JSON in this exact shape, with no markdown, no commentary, no extra keys:

{
  "destinations": <array of country codes from the allowed list, or null if no country/region is mentioned>,
  "current_situation": <one allowed value, or null if not mentioned>,
  "field_of_study": <one allowed value, or null if not mentioned>,
  "gpa_range": <one allowed value, or null if not mentioned>,
  "budget_per_year": <one allowed value, or null if not mentioned>,
  "duration_preference": <one allowed value, or null if not mentioned>,
  "english_level": <one allowed value, or null if not mentioned>,
  "scholarship_need": <one allowed value, or null if not mentioned>,
  "career_goal": <one allowed value, or null if not mentioned>,
  "academic_focus": <one allowed value, or null if not mentioned>,
  "work_experience": <one allowed value, or null if not mentioned>
}

Allowed values:
- destinations: IT (Italy), NL (Netherlands), DE (Germany), GB (UK / Britain / England), ES (Spain), FR (France), CH (Switzerland), SE (Sweden), DK (Denmark), IE (Ireland), AT (Austria), BE (Belgium), CZ (Czechia / Czech Republic), EE (Estonia), FI (Finland), NO (Norway), PL (Poland), PT (Portugal), or ANY for "anywhere / no preference". For multiple countries, return all of them.
- current_situation: undergraduate, graduating_soon, recent_graduate, gap_year, working_professional, other. Map "still studying"/"sophomore"/"junior" → undergraduate, "final-year"/"about to graduate"/"graduating this year" → graduating_soon, "just graduated"/"new graduate" → recent_graduate, "taking a gap year"/"on a break" → gap_year, "working"/"I'm an engineer at X" → working_professional. Leave null if not mentioned.
- field_of_study: business_management, engineering, computer_science_ai, design, architecture_built_environment, economics_finance, data_science, social_sciences. Map "management" → business_management, "MBA" → business_management, "CS"/"AI"/"machine learning" → computer_science_ai, "fintech" → economics_finance, "DS" → data_science, "humanities" → social_sciences, "architecture" → architecture_built_environment, etc. This is the field they want to STUDY NEXT — infer it from what they describe even if they only state their background.
- gpa_range: below_2_0, 2_0_2_5, 2_5_3_0, 3_0_3_5, 3_5_plus. Map a stated GPA on a 4.0 scale to the nearest bracket — e.g. "3.2 GPA" → 3_0_3_5, "3.8/4" → 3_5_plus, "around 2.7" → 2_5_3_0. For a /100 grade, convert first (e.g. "85/100" ≈ 3.4 → 3_0_3_5). Leave null if no GPA is mentioned.
- budget_per_year: tuition_free, <10k, 10-15k, 15-20k, 20-25k, 25k+, flexible. Map "free"/"no tuition"/"tuition-free"/"fully funded only"/"can only do public/free universities" → tuition_free, "under 5k" → <10k, "around 12k" → 10-15k, "no budget limit" → flexible.
- duration_preference: 12mo, 18mo, 24mo, flexible. "1 year" → 12mo, "2 years" → 24mo, "any" → flexible.
- english_level: certified (already holds a valid IELTS/TOEFL/Duolingo score), exam_ready (fluent and ready to sit the test, just hasn't), advanced (C1, comfortable academically), upper_intermediate (B2), intermediate (B1), beginner (A2 or below). Map "have IELTS 7"/"TOEFL 100"/"got my Duolingo" → certified, "fluent"/"native-like" → exam_ready, "C1"/"very strong English" → advanced, "B2"/"good English" → upper_intermediate, "okay English"/"B1" → intermediate, "weak/basic English" → beginner. Leave null if not mentioned.
- scholarship_need: required, helpful, not_needed. Map "need scholarship" → required, "would love scholarship but can pay" → helpful, "self-funded" → not_needed.
- career_goal: work_in_europe, return_to_turkey, work_internationally, phd_research, industry_expert, career_switch, entrepreneurship, unsure, other. Map "want to stay in Europe" → work_in_europe, "come back to Turkey" → return_to_turkey, "work anywhere globally" → work_internationally, "PhD afterwards"/"academia" → phd_research, "become a senior/specialist"/"expert in my field" → industry_expert, "switch fields"/"pivot careers" → career_switch, "start my own company" → entrepreneurship.
- academic_focus: research, applied, balanced. Map "thesis-heavy" / "research-led" / "PhD-bound" → research, "industry-focused" / "job-oriented" / "internship-heavy" → applied. Otherwise null (do NOT default to balanced).
- work_experience: none, 1-2_years, 3-5_years, 5_plus_years. Map "fresh graduate" / "no experience" → none, "couple years" → 1-2_years, "five years" → 5_plus_years, "few years" → 1-2_years.

Rules:
- If a field is genuinely not mentioned or unclear, set it to null. Do NOT guess.
- For destinations specifically, if the student says "anywhere in Europe" or "no preference", use ["ANY"]; if they don't mention any country at all, use null (server will fill in ["ANY"]).
- Never invent a value not in the allowed lists.
- Output JSON only.`;

// Note: additional_context, study_background, and desired_study are
// intentionally NOT in the parser output. additional_context is set below to
// the student's original free-text query (which already carries what they
// want to study, verbatim); study_background, desired_study, institution,
// gpa_scale/exact_gpa and the "_other" companions aren't inferred for /search
// (they stay null). field_of_study defaults to null when unstated — the
// matcher leans on additional_context instead of a fabricated field.
const FALLBACKS = {
  destinations: ["ANY"] as const,
  current_situation: null,
  current_situation_other: null,
  institution: null,
  field_of_study: null,
  study_background: null,
  desired_study: null,
  gpa_scale: null,
  gpa_range: null,
  exact_gpa: null,
  budget_per_year: "flexible",
  duration_preference: "flexible",
  english_level: "upper_intermediate",
  english_exam_score: null,
  scholarship_need: "helpful",
  career_goal: "unsure",
  career_goal_other: null,
  academic_focus: "balanced",
  work_experience: "none",
  additional_context: null,
} as const satisfies ValidatedAnswers;

export type ParseQueryResult = {
  answers: ValidatedAnswers;
  inferredFields: ReadonlyArray<keyof ValidatedAnswers>;
};

/**
 * Parse a free-text query into the structured profile the matcher consumes.
 * Returns the validated answers plus the list of fields the model couldn't
 * extract (which we filled in with safe defaults). Callers can surface the
 * `inferredFields` list to the user if they want to show "we filled these in".
 */
export async function parseFreeTextToProfile(
  query: string,
): Promise<ParseQueryResult> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new Error("Query is empty");
  }

  const json = (await callDeepSeek({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 800,
    // V4 Flash burns its budget on reasoning_content when thinking is on; we
    // need direct JSON. Same gotcha as the matcher in lib/ai/index.ts.
    thinking: { type: "disabled" },
  })) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned no content");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error(`DeepSeek returned non-JSON: ${content.slice(0, 200)}`);
  }

  const parserOutput = ParserOutputSchema.safeParse(parsedJson);
  if (!parserOutput.success) {
    throw new Error(
      `Parser output failed validation: ${parserOutput.error.message}`,
    );
  }

  const inferredFields: Array<keyof ValidatedAnswers> = [];
  const filled = { ...FALLBACKS } as Record<keyof ValidatedAnswers, unknown>;

  // The parser extracts the 11 structured fields. additional_context and
  // study_background are handled separately — additional_context is set below
  // to the student's verbatim query; study_background stays null for /search.
  const PARSED_FIELDS = [
    "destinations",
    "current_situation",
    "field_of_study",
    "gpa_range",
    "budget_per_year",
    "duration_preference",
    "english_level",
    "scholarship_need",
    "career_goal",
    "academic_focus",
    "work_experience",
  ] as const;

  for (const key of PARSED_FIELDS) {
    const value = parserOutput.data[key];
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      inferredFields.push(key);
      continue;
    }
    filled[key] = value;
  }

  // Pass the original query through as additional_context (bounded to match
  // the quiz's 500-char limit). This is what makes /search results feel
  // personal — the matcher can quote the student's actual phrasing back.
  filled.additional_context = trimmed.slice(0, 500);

  // Final pass through the strict AnswersSchema — paranoid, but cheap, and
  // protects the matcher from ever seeing a malformed profile.
  const finalValidation = AnswersSchema.safeParse(filled);
  if (!finalValidation.success) {
    throw new Error(
      `Filled answers failed final validation: ${finalValidation.error.message}`,
    );
  }

  return { answers: finalValidation.data, inferredFields };
}
