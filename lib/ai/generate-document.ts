import "server-only";

import { callDeepSeek } from "@/lib/ai/client";

const DEEPSEEK_MODEL = "deepseek-v4-flash";

export type DocumentKind = "cv" | "cover_letter";

/** Program + university facts handed to the model for tailoring. */
export type ProgramForDocument = {
  name: string;
  degree: string;
  language: string;
  duration_months: number;
  tuition_per_year: number | null;
  currency: string;
  description: string | null;
  application_deadline: string | null;
  university_name: string;
  university_city: string;
  university_country: string;
};

export type GenerateDocumentInput = {
  kind: DocumentKind;
  /** The student's display name from Google auth, if any. */
  studentName: string | null;
  /** The raw profiles.answers blob (any schema version), or null. */
  profileAnswers: Record<string, unknown> | null;
  /** Free-text background the student typed into the studio. */
  highlights: string | null;
  /** Required for cover letters; present for tailored CVs. */
  program: ProgramForDocument | null;
};

// Exported so the public /technical-report page can render the exact
// instructions we send to the model (single source of truth — no drift).
export const CV_SYSTEM_PROMPT = `You are EdFind's application-document assistant. EdFind helps Turkish students apply to master's programs in Europe. Draft a clean, one-page academic CV in Markdown for a master's application, based ONLY on the facts the student provides.

Anti-fabrication rules — ABSOLUTE:
- Use only facts present in the student's profile and notes. Never invent employers, job titles, dates, universities, degrees, GPAs, test scores, publications, awards, or skills.
- Where an expected detail is missing (phone, email, city, graduation date, etc.), insert a clearly bracketed placeholder the student must fill in, e.g. [your.email@example.com], [Month Year] — do not guess.
- If the student's notes are thin, produce a shorter CV with placeholders and a final line "<!-- Add more detail in the notes box and regenerate for a fuller draft. -->" rather than padding with invented content.

Structure (omit any section with nothing real to put in it):
1. Name as a top-level heading, then a single contact line (email · phone · city — placeholders where unknown).
2. "Education" — degree, institution, dates, GPA if provided (state the scale exactly as given).
3. "Experience" — most recent first; 1-3 bullet points each, action-verb first, concrete and quantified only where the student gave numbers.
4. "Projects" — only if the notes mention any.
5. "Skills" — grouped (technical / tools / soft) only from stated skills.
6. "Languages" — include English with the stated level or exam score; Turkish as native unless the student says otherwise.
7. "Certificates & Awards" — only if mentioned.

Style:
- European academic-CV conventions: no photo, no birth date, no marital status.
- Concise and factual. No first-person pronouns in bullets. No marketing fluff, no exclamations, no emojis.
- If a target program is provided, order and phrase content to foreground what is most relevant to it — without changing any facts.
- Write in English.

Output ONLY the CV as Markdown. No preamble, no commentary, no code fences.`;

export const COVER_LETTER_SYSTEM_PROMPT = `You are EdFind's application-document assistant. EdFind helps Turkish students apply to master's programs in Europe. Draft a one-page cover letter (motivation letter) in Markdown for the specific program provided, based ONLY on the facts the student provides.

Anti-fabrication rules — ABSOLUTE:
- Use only facts present in the student's profile, their notes, and the program data. Never invent grades, projects, work experience, professors, course names, or details about the program that are not in the provided data.
- Where a personal detail is missing, insert a bracketed placeholder, e.g. [Your address], [Date].
- Do not claim the student has visited, contacted, or researched anything unless their notes say so.

Structure:
1. Sender block placeholder (name + [Your address] + [Date]) and a salutation to the admissions committee of the named program.
2. Opening — name the exact program, degree, and university; one sentence on who the student is (current situation + background).
3. Body paragraph 1 — academic background and the strongest evidence of fit (GPA only if provided and presentable, relevant coursework/projects/experience from the notes).
4. Body paragraph 2 — why THIS program: connect the student's goals to concrete program facts from the provided data (field, duration, language, city/country, described strengths). Quote or paraphrase at least one specific detail from the student's own notes or free-text context when available — that is what makes the letter personal.
5. Closing — forward-looking goal (career plan after the master's), availability for interview, polite sign-off with the student's name.

Style:
- 250-400 words of body text. Professional, warm, specific.
- No clichés ("ever since I was a child", "esteemed institution", "passion for excellence"). No exclamations, no emojis, no flattery padding.
- Honest framing: a career switch or modest GPA is addressed constructively, never hidden behind vague claims.
- Write in English.

Output ONLY the letter as Markdown. No preamble, no commentary, no code fences.`;

function buildUserMessage(input: GenerateDocumentInput): string {
  const parts: string[] = [];

  parts.push(`Student name: ${input.studentName ?? "[not provided — use a placeholder]"}`);

  if (input.profileAnswers && Object.keys(input.profileAnswers).length > 0) {
    parts.push(
      "Student profile (from the EdFind quiz; fields may be missing or null — treat missing as unknown):",
      JSON.stringify(input.profileAnswers, null, 2),
    );
  } else {
    parts.push("Student profile: not available — rely on the notes below.");
  }

  if (input.highlights && input.highlights.trim().length > 0) {
    parts.push(
      "Student's own notes (background, experience, projects, skills — verbatim, may be in Turkish; translate facts into English without changing them):",
      input.highlights.trim(),
    );
  } else {
    parts.push("Student's own notes: none provided.");
  }

  if (input.program) {
    parts.push(
      "Target program (verified catalog data — the only program facts you may use):",
      JSON.stringify(input.program, null, 2),
    );
  } else {
    parts.push("Target program: none — this is a general document.");
  }

  parts.push(
    input.kind === "cv"
      ? "Draft the CV now as specified by the system message."
      : "Draft the cover letter now as specified by the system message.",
  );

  return parts.join("\n\n");
}

/**
 * Generate a CV or cover-letter draft. Returns the Markdown document text.
 * Plain-text completion (no response_format) — the prompt forbids commentary
 * and the result is user-editable anyway, so JSON wrapping adds nothing.
 */
export async function generateDocumentDraft(
  input: GenerateDocumentInput,
): Promise<string> {
  const json = (await callDeepSeek({
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: "system",
        content:
          input.kind === "cv" ? CV_SYSTEM_PROMPT : COVER_LETTER_SYSTEM_PROMPT,
      },
      { role: "user", content: buildUserMessage(input) },
    ],
    temperature: 0.5,
    max_tokens: 2500,
    // Disable V4's reasoning step — same rationale as the matcher: with
    // thinking enabled the budget is burned on reasoning_content before any
    // document text is emitted.
    thinking: { type: "disabled" },
  })) as { choices?: Array<{ message?: { content?: string } }> };

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("DeepSeek returned no content");
  }

  // Models occasionally wrap output in a markdown fence despite instructions.
  const fenced = content.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1].trim() : content;
}
