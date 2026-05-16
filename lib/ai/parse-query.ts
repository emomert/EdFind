import "server-only";

import { z } from "zod";

import {
  ACADEMIC_FOCUS,
  AnswersSchema,
  BUDGET_BRACKETS,
  CAREER_GOALS,
  DESTINATIONS,
  DURATIONS,
  ENGLISH_LEVELS,
  FIELDS_OF_STUDY,
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
  field_of_study: z.enum(FIELDS_OF_STUDY).nullable(),
  budget_per_year: z.enum(BUDGET_BRACKETS).nullable(),
  duration_preference: z.enum(DURATIONS).nullable(),
  english_level: z.enum(ENGLISH_LEVELS).nullable(),
  scholarship_need: z.enum(SCHOLARSHIP_NEEDS).nullable(),
  career_goal: z.enum(CAREER_GOALS).nullable(),
  academic_focus: z.enum(ACADEMIC_FOCUS).nullable(),
  work_experience: z.enum(WORK_EXPERIENCES).nullable(),
});

const SYSTEM_PROMPT = `You are EdFind's free-text query parser. EdFind helps Turkish students find master's programs in Europe. The student typed a natural-language description of what they want; your job is to map it onto EdFind's 9-field structured profile.

Output strict JSON in this exact shape, with no markdown, no commentary, no extra keys:

{
  "destinations": <array of country codes from the allowed list, or null if no country/region is mentioned>,
  "field_of_study": <one allowed value, or null if not mentioned>,
  "budget_per_year": <one allowed value, or null if not mentioned>,
  "duration_preference": <one allowed value, or null if not mentioned>,
  "english_level": <one allowed value, or null if not mentioned>,
  "scholarship_need": <one allowed value, or null if not mentioned>,
  "career_goal": <one allowed value, or null if not mentioned>,
  "academic_focus": <one allowed value, or null if not mentioned>,
  "work_experience": <one allowed value, or null if not mentioned>
}

Allowed values:
- destinations: IT (Italy), NL (Netherlands), DE (Germany), GB (UK / Britain / England), ES (Spain), FR (France), CH (Switzerland), SE (Sweden), DK (Denmark), IE (Ireland), or ANY for "anywhere / no preference". For multiple countries, return all of them.
- field_of_study: business_management, engineering, computer_science_ai, design, architecture_built_environment, economics_finance, data_science, social_sciences. Map "management" → business_management, "MBA" → business_management, "CS"/"AI"/"machine learning" → computer_science_ai, "fintech" → economics_finance, "DS" → data_science, "humanities" → social_sciences, "architecture" → architecture_built_environment, etc.
- budget_per_year: <10k, 10-15k, 15-20k, 20-25k, 25k+, flexible. Map any concrete number to the nearest bracket — e.g. "under 5k" → <10k, "around 12k" → 10-15k, "no budget limit" → flexible.
- duration_preference: 12mo, 18mo, 24mo, flexible. "1 year" → 12mo, "2 years" → 24mo, "any" → flexible.
- english_level: intermediate (B1), upper-intermediate (B2), advanced (C1), proficient (C2). Map "decent English" → upper-intermediate, "fluent" → advanced, "native-like" → proficient, "okay English" → intermediate. Default to upper-intermediate ONLY if the student says "my English is fine" or similar; otherwise leave null.
- scholarship_need: required, helpful, not_needed. Map "need scholarship" → required, "would love scholarship but can pay" → helpful, "self-funded" → not_needed.
- career_goal: work_in_europe, work_internationally, return_to_turkey, phd_research, entrepreneurship, unsure. Map "want to stay in Europe" → work_in_europe, "PhD afterwards" → phd_research, "want to come back to Turkey" → return_to_turkey, "start my own company" → entrepreneurship.
- academic_focus: research, applied, balanced. Map "thesis-heavy" / "research-led" / "PhD-bound" → research, "industry-focused" / "job-oriented" / "internship-heavy" → applied. Otherwise null (do NOT default to balanced).
- work_experience: none, 1-2_years, 3-5_years, 5_plus_years. Map "fresh graduate" / "no experience" → none, "couple years" → 1-2_years, "five years" → 5_plus_years, "few years" → 1-2_years.

Rules:
- If a field is genuinely not mentioned or unclear, set it to null. Do NOT guess.
- For destinations specifically, if the student says "anywhere in Europe" or "no preference", use ["ANY"]; if they don't mention any country at all, use null (server will fill in ["ANY"]).
- Never invent a value not in the allowed lists.
- Output JSON only.`;

const FALLBACKS = {
  destinations: ["ANY"] as const,
  field_of_study: "business_management",
  budget_per_year: "flexible",
  duration_preference: "flexible",
  english_level: "upper-intermediate",
  scholarship_need: "helpful",
  career_goal: "unsure",
  academic_focus: "balanced",
  work_experience: "none",
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

  for (const key of Object.keys(FALLBACKS) as Array<keyof ValidatedAnswers>) {
    const value = parserOutput.data[key];
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      inferredFields.push(key);
      continue;
    }
    filled[key] = value;
  }

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
