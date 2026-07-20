/**
 * Self-playing quiz demo — persona + curated results.
 *
 * Drives the REAL quiz components (`QuestionScreen`, `QuizProgressBar`, the
 * results `HeroMatchCard`/`SiblingMatchCard`) so what's recorded is exactly
 * what production renders — only the *driving* (timed auto-fill) and the
 * *result set* (curated, deterministic) are scripted. Built for the demo
 * video shown in the EdFind presentation; lives behind the public `/demo`
 * route. Nothing here touches the database, the AI matcher, or auth.
 *
 * Persona (decided with the user, 2026-06-14): a recent Boğaziçi University
 * political-science graduate moving into public policy / international
 * relations, needs a scholarship, wants an international career. Destinations
 * narrowed to Germany + France + Netherlands so the catalog's strongest,
 * most on-theme policy programs surface as the top 3.
 *
 * The three curated matches are REAL catalog entries (fields copied verbatim
 * from supabase/seed.sql) — Hertie School MPP, Sciences Po Master in Public
 * Policy, Erasmus Rotterdam MSc Sociology. `country` is the 2-letter code
 * because the live results card renders `u.country` raw.
 */

import type { Answers, Destination, GpaScale } from "@/lib/quiz/schema";
import type { MatchCardData } from "@/components/results/match-card";
import type {
  ApplicationItem,
  DocumentItem,
  ProfileSummary,
  TaskItem,
} from "@/components/applications/types";

/**
 * Per-question auto-fill instruction, looked up by the question's `field`.
 * `kind` selects how the orchestrator animates the fill; the target field is
 * implied by the question, except where a question writes companion fields
 * (gpa → gpa_scale + exact_gpa, english → english_level + english_exam_score).
 */
export type StepPlan =
  | { kind: "multi"; picks: Destination[] }
  | { kind: "single"; value: string }
  | { kind: "text"; text: string }
  | { kind: "institution"; query: string; commit: string }
  | { kind: "gpa"; scale: GpaScale; exact: string }
  | { kind: "english"; score: string };

export const STEP_PLANS: Record<string, StepPlan> = {
  destinations: { kind: "multi", picks: ["DE", "FR", "NL"] },
  current_situation: { kind: "single", value: "recent_graduate" },
  institution: {
    kind: "institution",
    query: "Boğaziçi University",
    commit: "Boğaziçi University",
  },
  study_background: {
    kind: "text",
    text: "BA Political Science with a minor in International Relations",
  },
  desired_study: {
    kind: "text",
    text: "Public policy and international relations — especially how governments design and evaluate social policy",
  },
  // The GPA question's field is `gpa_range`; the orchestrator writes gpa_scale
  // then types exact_gpa.
  gpa_range: { kind: "gpa", scale: "4_point", exact: "3.6" },
  // english picks "certified" (reveals the score field) then types the score.
  english_level: { kind: "english", score: "IELTS 7.5" },
  budget_per_year: { kind: "single", value: "flexible" },
  duration_preference: { kind: "single", value: "flexible" },
  scholarship_need: { kind: "single", value: "required" },
  career_goal: { kind: "single", value: "work_internationally" },
  academic_focus: { kind: "single", value: "applied" },
  work_experience: { kind: "single", value: "1-2_years" },
  additional_context: {
    kind: "text",
    text: "I interned at a policy think tank in Ankara and want to work on migration and social policy at an international organisation like the UN or OECD.",
  },
};

/**
 * The fully-answered persona — the state the auto-fill converges to. Kept as a
 * single source so a static render / test can assert the script matches it.
 */
export const PERSONA_ANSWERS: Answers = {
  destinations: ["DE", "FR", "NL"],
  current_situation: "recent_graduate",
  current_situation_other: null,
  institution: "Boğaziçi University",
  field_of_study: null, // the matcher infers this from desired_study
  study_background: "BA Political Science with a minor in International Relations",
  desired_study:
    "Public policy and international relations — especially how governments design and evaluate social policy",
  gpa_scale: "4_point",
  gpa_range: null,
  exact_gpa: "3.6",
  budget_per_year: "flexible",
  duration_preference: "flexible",
  english_level: "certified",
  english_exam_score: "IELTS 7.5",
  scholarship_need: "required",
  career_goal: "work_internationally",
  career_goal_other: null,
  academic_focus: "applied",
  work_experience: "1-2_years",
  additional_context:
    "I interned at a policy think tank in Ankara and want to work on migration and social policy at an international organisation like the UN or OECD.",
};

/**
 * Curated top-3 — real programs from the catalog. Rationales are written in the
 * matcher's voice and quote the persona's own answers (funding need, think-tank
 * background, the social-policy focus, the UN/OECD goal).
 */
export const DEMO_MATCHES: MatchCardData[] = [
  {
    id: "demo-hertie-mpp",
    program_id: "demo-hertie-mpp",
    score: 94,
    is_saved: false,
    rationale:
      "Hertie is Germany's dedicated graduate school of governance, so your move from a Boğaziçi political-science degree into public policy lands squarely in its wheelhouse. The MPP's policy-analysis track fits your interest in how governments design and evaluate social policy, and your think-tank internship in Ankara is exactly the profile it recruits. Crucially, around half of Hertie students receive scholarships — important since you need funding — and Berlin is a strong base for the international career you're after.",
    program: {
      slug: "master-of-public-policy",
      name: "Master of Public Policy (MPP)",
      degree: "MPP",
      field_of_study: "social_sciences",
      language: "en",
      duration_months: 24,
      tuition_per_year: 19250,
      currency: "EUR",
      application_deadline: "2026-05-31",
      start_month: "September",
      description:
        "A two-year, 120 ECTS interdisciplinary master's for future policymakers, drawing on economics, political science, law, public management, statistics, and data science. Students choose between policy analysis and governance & leadership specialisations and complete an integrated internship or professional year.",
      qs_subject_rank: 101,
      qs_subject_area: "Politics & International Studies",
      university: {
        slug: "hertie-school",
        name: "Hertie School",
        country: "DE",
        city: "Berlin",
        website: "https://www.hertie-school.org/en",
        description:
          "Germany's leading private graduate school of governance and public policy, based in central Berlin. Offers English-taught masters and PhD programmes combining political science, economics, law, and data science to train future policymakers and public-sector leaders.",
        is_partner: false,
        qs_world_rank: null,
        logo_url: "/demo-logos/hertie-school.svg",
      },
    },
  },
  {
    id: "demo-sciencespo-mpp",
    program_id: "demo-sciencespo-mpp",
    score: 90,
    is_saved: false,
    rationale:
      "Sciences Po's School of Public Affairs is ranked #2 worldwide in Politics & International Studies, and its income-based tuition can fall to €0 — directly addressing your need for funding. The Social Policy & Innovation stream maps onto the social-policy focus you described, and Paris keeps you close to the international organisations (UN, OECD) you mentioned wanting to work for.",
    program: {
      slug: "master-in-public-policy",
      name: "Master in Public Policy",
      degree: "MA",
      field_of_study: "social_sciences",
      language: "en",
      duration_months: 24,
      tuition_per_year: 20640,
      currency: "EUR",
      application_deadline: "2026-01-04",
      start_month: "September",
      description:
        "A two-year multidisciplinary policy master's at the Sciences Po School of Public Affairs, training future leaders in government, international organisations, and the private sector. Combines core courses in policy analysis, economics, law, and management with seven specialisation streams (e.g. Economics & Public Policy, Energy & Environment, Global Health, Digital, Social Policy & Innovation).",
      qs_subject_rank: 2,
      qs_subject_area: "Politics & International Studies",
      university: {
        slug: "sciences-po",
        name: "Sciences Po",
        country: "FR",
        city: "Paris",
        website: "https://www.sciencespo.fr/en",
        description:
          "A French research university in central Paris specialising in the social sciences — political science, international affairs, public policy, economics, sociology, and law — with seven graduate schools and a strong international student body.",
        is_partner: false,
        qs_world_rank: 267,
        logo_url: "/demo-logos/sciences-po.svg",
      },
    },
  },
  {
    id: "demo-eur-sociology",
    program_id: "demo-eur-sociology",
    score: 85,
    is_saved: false,
    rationale:
      "This one-year Dutch master's studies migration, inequality and other public issues through applied research — close to the questions you want to work on — at a top-150 university. As a 12-month, English-taught option it keeps cost and time lower than a two-year degree while staying firmly in the social-policy space, a practical hedge alongside the longer policy schools.",
    program: {
      slug: "msc-sociology-engaging-public-issues",
      name: "MSc Sociology: Engaging Public Issues",
      degree: "MSc",
      field_of_study: "social_sciences",
      language: "en",
      duration_months: 12,
      tuition_per_year: 21000,
      currency: "EUR",
      application_deadline: "2026-05-01",
      start_month: "September",
      description:
        "A one-year sociology master's examining contemporary public issues such as inequality, migration, urban life, and digital culture. Combines theoretical seminars with applied research methods and a thesis grounded in real-world social problems.",
      qs_subject_rank: 51,
      qs_subject_area: "Sociology",
      university: {
        slug: "erasmus-university-rotterdam",
        name: "Erasmus University Rotterdam",
        country: "NL",
        city: "Rotterdam",
        website: "https://www.eur.nl/en",
        description:
          "A Dutch research university with international reputation in economics, business, social sciences, and health.",
        is_partner: false,
        qs_world_rank: 140,
        logo_url: "/demo-logos/erasmus-university-rotterdam.svg",
      },
    },
  },
];

/* ── Applications phase ──────────────────────────────────────────────────────
 * After the results reveal, the demo "saves" the top match and shows the real
 * applications dashboard (components/applications/ApplicationsClient) populated
 * with this curated data — Hertie tracked at "interested", a few tasks on the
 * board, the persona's profile in the header. No DB; these are plain props.
 */

export const DEMO_STUDENT = {
  email: "aylin@example.com",
  displayName: "Aylin K.",
};

export const DEMO_PROFILE: ProfileSummary = {
  destinations: ["DE", "FR", "NL"],
  fieldOfStudy: "social_sciences",
  hasProfile: true,
};

export const DEMO_APPLICATIONS: ApplicationItem[] = [
  {
    id: "demo-app-hertie",
    status: "interested",
    notes: null,
    deadline_at: "2026-05-31",
    program_id: "demo-hertie-mpp",
    program: {
      slug: "master-of-public-policy",
      name: "Master of Public Policy (MPP)",
      degree: "MPP",
      application_deadline: "2026-05-31",
      university: {
        slug: "hertie-school",
        name: "Hertie School",
        country: "DE",
        city: "Berlin",
        website: "https://www.hertie-school.org/en",
        logo_url: "/demo-logos/hertie-school.svg",
      },
    },
  },
];

export const DEMO_TASKS: TaskItem[] = [
  {
    id: "demo-task-1",
    title: "Request transcript from Boğaziçi",
    status: "todo",
    category: "documents",
    due_at: null,
    application_id: "demo-app-hertie",
    sort_order: 0,
  },
  {
    id: "demo-task-2",
    title: "Draft statement of motivation",
    status: "todo",
    category: "writing",
    due_at: null,
    application_id: "demo-app-hertie",
    sort_order: 1,
  },
  {
    id: "demo-task-3",
    title: "Prepare CV for the MPP",
    status: "doing",
    category: "documents",
    due_at: null,
    application_id: "demo-app-hertie",
    sort_order: 2,
  },
  {
    id: "demo-task-4",
    title: "Shortlist target programs",
    status: "done",
    category: "other",
    due_at: null,
    application_id: null,
    sort_order: 3,
  },
];

export const DEMO_DOCUMENTS: DocumentItem[] = [];
