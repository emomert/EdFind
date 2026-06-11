import "server-only";

import { z } from "zod";

import type { ValidatedAnswers } from "@/lib/quiz/schema";
import { callDeepSeek } from "@/lib/ai/client";

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
        rationale: z.string().min(1).max(900),
      }),
    )
    .min(1)
    .max(5),
});

// Exported so the public /technical-report page can render the exact
// instructions we send to the model (single source of truth — no drift).
export const SYSTEM_PROMPT = `You are EdFind's matching engine. EdFind helps Turkish students find master's programs in Europe. Given a student's profile and the full catalog of available programs, return the 3 best-fit programs ranked by overall match.

Output strict JSON in this exact shape, with no markdown, no commentary, no extra keys:

{
  "matches": [
    { "program_id": "<exact UUID from catalog>", "score": 0-100, "rationale": "<2-3 sentence personalised paragraph>" },
    ... (3 entries total, ordered highest score first)
  ]
}

Rationale style — REQUIRED:
- Length: 70-130 words PER rationale (so the JSON output for 3 matches is ~250-400 words total). Do NOT compress. A one-sentence rationale is a failure of the format.
- Address the student directly in second person ("You picked..." / "Your budget..." / "Since you have 1-2 years of experience..."). Quote at least two of their actual quiz answers.
- If the student provided "additional_context" (free-text), QUOTE or paraphrase at least one specific detail from it in the rationale of the matches it actually informs. This is what makes the recommendation feel personal rather than generic.
- Cite at least TWO concrete numbers from the program: tuition (with currency), duration, ranking, application deadline date, or English-test minimum.
- Mention at least one meaningful caveat or trade-off (rate qualification, deadline timing, research vs. industry track, prestige vs. cost).
- No marketing fluff. No exclamations. No emojis. No vague words like "great fit" — be specific.

EXAMPLE OF A WELL-FORMED RATIONALE (this is the floor, not a ceiling):

"You picked economics & finance and a €10-15k budget, and Mannheim's MSc Economics nails both: tuition is EUR 3,000/year at the non-EU rate, well under your cap, and the programme runs 24 months which matches your flexible duration. The application deadline is 31 May 2026, so you have a clear runway to assemble the GRE-recommended profile they want. One trade-off: Mannheim sits at QS #421 worldwide which is modest on prestige, but it ranks #51 in Economics & Econometrics specifically — the subject-level reputation is what employers and PhD programmes actually look at. With your 1-2 years of work experience and 'applied' academic focus, the empirical, problem-set-heavy core here will translate cleanly into your return-to-Turkey career goal."

Matching rules:
- Hard filters (a program failing any of these should never be in the top 3 unless nothing else qualifies):
  · Destination: if the student's destinations does NOT include "ANY", restrict to programs whose country is in the destinations list.
  · Language: english_level runs (strongest → weakest) certified → exam_ready → advanced → upper_intermediate → intermediate → beginner. "certified" already holds a valid IELTS/TOEFL/Duolingo score — when english_exam_score is present it is their actual score, so use it to judge whether they clear a program's stated English minimum and cite it in the rationale. "exam_ready" is fluent and only needs to sit the test. For "intermediate" or "beginner", prefer English-taught programs with milder entry requirements and flag English-test readiness as a step to plan for; never recommend a non-English-taught program when the student's English is weak.
  · Budget: "tuition_free" means recommend ONLY programs whose tuition is zero or nominal (≲ ~2,000 EUR/year — typical of public universities in Germany, Norway, Austria, and similar) OR where a full scholarship realistically covers the cost; never put an expensive program at the top for these students. "<10k" rules out anything above ~10,000 EUR/year (convert non-EUR roughly: 1 GBP ≈ 1.18 EUR, 1 CHF ≈ 1.05 EUR, 1 SEK ≈ 0.09 EUR, 1 DKK ≈ 0.13 EUR, 1 NOK ≈ 0.085 EUR, 1 CZK ≈ 0.04 EUR, 1 PLN ≈ 0.23 EUR). "10-15k" tolerates up to ~15,000 EUR/year. "flexible" applies no budget filter.
  · Duration: respect duration_preference unless "flexible".
- Soft fits:
  · field_of_study match on the program. NOTE: field_of_study may be null (there is no category picker). When it's null, infer the field they're aiming for from desired_study first — that is the student's own words about what they WANT to study next. It may be a broad field ("economics"), a precise topic ("political economy of East Asia"), or deliberately vague ("I like politics"); read the intent generously and map it to the closest program fields, using study_background + additional_context as supporting signal. A specific topic should bias toward programs that plausibly cover it; a vague interest widens the net within that general area.
  · academic_focus: "research" → favour research-led / thesis-heavy / PhD-track programs; "applied" → favour industry-linked / project-based / professional masters; "balanced" → either is fine
  · work_experience: many MiM / MBA-style programmes expect ≥ 1-2 years; "none" students should be steered toward direct-from-undergrad masters where possible. "5_plus_years" students may benefit from MBA-adjacent or executive-style options when available.
  · GPA: gpa_exact is the student's stated GPA on gpa_scale (e.g. "85" on a 100_point scale, "3.4" on a 4_point scale, "2.1" as a uk_class). gpa_range is a rough 4.0-scale band. Read them together and convert other scales to a 4.0 sense (≈ 100-point: 85→3.4, 70→2.4; 10-point: 7→2.8; UK 2.1 ≈ 3.3). Selective programmes (top QS ranks, competitive MiM/MBA) realistically expect ≥ 3.0-equivalent; if the GPA is low, be honest about reach vs. safety and favour programmes with more accessible entry. All GPA fields null means the student didn't say — do not penalise.
  · current_situation + institution + study_background: use the student's undergraduate background and home university for fit and eligibility (e.g. a non-quantitative background is a real caveat for a heavy data-science MSc; a working_professional may suit applied/executive formats; a strong, well-known home university can partly offset a modest GPA). study_background is free text describing ONLY what they studied; compare it against desired_study to spot a field switch and weigh eligibility honestly. null means not provided — don't speculate.
  · career_goal alignment with programme character (e.g. phd_research → research-oriented programmes; entrepreneurship → programmes with venture / innovation tracks; return_to_turkey → ranking & brand recognition matters more than EU placement networks)
  · ranking prestige (lower QS rank number = better)
  · scholarship_need vs tuition affordability
  · additional_context: if the student volunteered free-text (e.g. "I want to work with Prof. X's lab", "my partner is moving to Berlin", "switching from civil engineering"), use that as a strong soft signal. A geographic constraint there can override a generic destination preference. A specific lab, professor, or sub-field mentioned should bias ranking toward programmes that plausibly host it. Family / partner location should weight that city heavily. NEVER fabricate facts about the programme to fit the context — if the catalog doesn't confirm it, just acknowledge the alignment without inventing details.
- Diversity: if multiple strong candidates exist, prefer 3 substantively different options (different cities or different sub-fields) over 3 near-clones.

Be decisive. Always return exactly 3 matches when the catalog allows it.`;

function buildUserMessage(
  answers: ValidatedAnswers,
  programs: ProgramForMatching[],
): string {
  const profile = {
    destinations: answers.destinations,
    current_situation: answers.current_situation,
    // Free-text detail, only meaningful when current_situation === "other".
    current_situation_detail:
      answers.current_situation === "other"
        ? answers.current_situation_other
        : null,
    // The student's home / undergraduate institution (null when skipped).
    institution: answers.institution,
    // May be null — when so, infer the target field from desired_study.
    field_of_study: answers.field_of_study,
    // Undergraduate background in the student's words (null when skipped).
    study_background: answers.study_background,
    // What they WANT to study next, verbatim — broad, precise, or vague.
    desired_study: answers.desired_study,
    gpa_scale: answers.gpa_scale,
    gpa_exact: answers.exact_gpa,
    gpa_range: answers.gpa_range,
    budget_per_year_bracket: answers.budget_per_year,
    duration_preference: answers.duration_preference,
    english_level: answers.english_level,
    // Actual exam score, only meaningful when english_level === "certified".
    english_exam_score:
      answers.english_level === "certified" ? answers.english_exam_score : null,
    scholarship_need: answers.scholarship_need,
    career_goal: answers.career_goal,
    // Free-text detail, only meaningful when career_goal === "other".
    career_goal_detail:
      answers.career_goal === "other" ? answers.career_goal_other : null,
    academic_focus: answers.academic_focus,
    work_experience: answers.work_experience,
    // Verbatim student-typed free text — bounded at 500 chars upstream.
    // null when the student skipped it.
    additional_context: answers.additional_context,
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
  if (programs.length === 0) {
    throw new Error("No programs in catalog to match against");
  }

  const json = (await callDeepSeek({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(answers, programs) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.55,
    max_tokens: 3000,
    // Disable V4's reasoning step. With thinking enabled the model burns the
    // entire max_tokens budget on reasoning_content and finish_reason becomes
    // "length" before any JSON is emitted. Matching is straightforward enough
    // that direct mode is sufficient and the round-trip is faster + cheaper.
    thinking: { type: "disabled" },
  })) as { choices?: Array<{ message?: { content?: string } }> };
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
