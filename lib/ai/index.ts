import "server-only";

import { z } from "zod";

import type { ValidatedAnswers } from "@/lib/quiz/schema";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

export type ProgramForMatching = {
  id: string;
  slug: string;
  name: string;
  degree: string;
  field_of_study: string;
  language: string;
  duration_months: number;
  tuition_per_year: number | null;
  currency: string;
  description: string | null;
  qs_subject_rank: number | null;
  qs_subject_area: string | null;
  university_name: string;
  university_country: string;
  university_city: string;
  university_qs_world_rank: number | null;
  university_is_partner: boolean;
};

export type MatchSuggestion = {
  program_id: string;
  score: number;
  rationale: string;
};

const MatcherOutputSchema = z.object({
  matches: z
    .array(
      z.object({
        program_id: z.string().min(1),
        score: z.number().min(0).max(100),
        rationale: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(5),
});

const SYSTEM_PROMPT = `You are EdFind's matching engine. EdFind helps Turkish students find master's programs in Europe. Given a student's profile and the full catalog of available programs, return the 3 best-fit programs ranked by overall match.

Output strict JSON in this exact shape, with no markdown, no commentary, no extra keys:

{
  "matches": [
    { "program_id": "<exact UUID from catalog>", "score": 0-100, "rationale": "one sentence, ≤ 200 chars, plain English" },
    ... (3 entries total, ordered highest score first)
  ]
}

Matching rules:
- Hard filters (a program failing any of these should never be in the top 3 unless nothing else qualifies):
  · Destination: if the student's destinations does NOT include "ANY", restrict to programs whose country is in the destinations list.
  · Language: if english_level is "intermediate", prefer programs whose language is "en" with milder language requirements; never recommend a non-English program if the student's English is weak.
  · Budget: "<10k" rules out anything above ~10,000 EUR/year (convert non-EUR rough: 1 GBP ≈ 1.18 EUR, 1 CHF ≈ 1.05 EUR, 1 SEK ≈ 0.09 EUR, 1 DKK ≈ 0.13 EUR). "10-15k" tolerates up to ~15,000 EUR/year. "flexible" applies no budget filter.
  · Duration: respect duration_preference unless "flexible".
- Soft fits: field_of_study match on the program; alignment between career_goal and the program's character (e.g. phd_research → research-oriented programs); ranking prestige (lower QS rank number = better); scholarship_need vs tuition affordability.
- Diversity: if multiple strong candidates exist, prefer 3 substantively different options (different cities or different sub-fields) over 3 near-clones.

Be decisive. Always return exactly 3 matches when the catalog allows it.`;

function buildUserMessage(
  answers: ValidatedAnswers,
  programs: ProgramForMatching[],
): string {
  const profile = {
    destinations: answers.destinations,
    field_of_study: answers.field_of_study,
    budget_per_year_bracket: answers.budget_per_year,
    duration_preference: answers.duration_preference,
    english_level: answers.english_level,
    scholarship_need: answers.scholarship_need,
    career_goal: answers.career_goal,
  };

  const compactPrograms = programs.map((p) => ({
    id: p.id,
    name: p.name,
    degree: p.degree,
    university: p.university_name,
    country: p.university_country,
    city: p.university_city,
    field: p.field_of_study,
    language: p.language,
    duration_months: p.duration_months,
    tuition_per_year: p.tuition_per_year,
    currency: p.currency,
    qs_world_rank: p.university_qs_world_rank,
    qs_subject_rank: p.qs_subject_rank,
    qs_subject_area: p.qs_subject_area,
    description: (p.description ?? "").slice(0, 240),
  }));

  return [
    "Student profile:",
    JSON.stringify(profile, null, 2),
    "",
    `Program catalog (${programs.length} programs):`,
    JSON.stringify(compactPrograms),
    "",
    "Return the top 3 matches as the JSON object specified by the system message.",
  ].join("\n");
}

export async function matchProgramsToProfile(
  answers: ValidatedAnswers,
  programs: ProgramForMatching[],
): Promise<MatchSuggestion[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }
  if (programs.length === 0) {
    throw new Error("No programs in catalog to match against");
  }

  const body = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(answers, programs) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1200,
  };

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`DeepSeek API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned no content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`DeepSeek returned non-JSON: ${content.slice(0, 200)}`);
  }

  const validated = MatcherOutputSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `DeepSeek output failed validation: ${validated.error.message}`,
    );
  }

  const validIds = new Set(programs.map((p) => p.id));
  const filtered = validated.data.matches.filter((m) =>
    validIds.has(m.program_id),
  );

  if (filtered.length === 0) {
    throw new Error("DeepSeek returned no valid program ids");
  }

  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, 3);
}
