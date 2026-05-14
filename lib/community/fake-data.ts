import "server-only";

import type {
  CommunityGroup,
  CommunityMessage,
  CommunityQuestion,
  CommunityUser,
  StudentReview,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
// 8 hand-picked universities get rich content. Everything else is
// auto-stubbed in lib/community/generate-groups.ts based on the live
// catalog.
// ─────────────────────────────────────────────────────────────────────────

export const RICH_UNIVERSITY_SLUGS = [
  "politecnico-di-milano",
  "bocconi-university",
  "tu-delft",
  "university-of-amsterdam",
  "technical-university-of-munich",
  "ku-leuven",
  "university-of-bologna",
  "eth-zurich",
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Users — verified students, alumni, applicants, prospects, responsibles.
// Names are obviously fictional but realistic enough to demo.
// ─────────────────────────────────────────────────────────────────────────

export const FAKE_USERS: CommunityUser[] = [
  // Campus responsibles (one per rich uni; some unis get two)
  {
    id: "user_zeynep_a",
    name: "Zeynep A.",
    role: "campus_responsible",
    universitySlug: "politecnico-di-milano",
    programSlug: "msc-management-engineering",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Turkish", "English", "Italian"],
    responseTime: "Usually replies within 24h",
    expertiseTags: ["Applications", "Housing", "Student Life"],
    bio: "MSc Management Engineering at Polimi. Happy to chat about applications, finding a flat in Milan, and what to expect in the first semester.",
  },
  {
    id: "user_emre_k",
    name: "Emre K.",
    role: "campus_responsible",
    universitySlug: "bocconi-university",
    programSlug: "msc-international-management",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Turkish", "English"],
    responseTime: "Usually replies within 12h",
    expertiseTags: ["Applications", "Scholarships", "Career Opportunities"],
    bio: "Second-year MSc International Management at Bocconi. Ex-investment-banking summer. Can help with Bocconi's specific application essays.",
  },
  {
    id: "user_lara_v",
    name: "Lara V.",
    role: "campus_responsible",
    universitySlug: "tu-delft",
    programSlug: "msc-computer-science",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Dutch", "English", "Turkish"],
    responseTime: "Usually replies within 1 day",
    expertiseTags: ["Applications", "Coursework", "Housing"],
    bio: "MSc Computer Science at TU Delft. Honest take on the workload and the housing crisis in Delft.",
  },
  {
    id: "user_kaan_b",
    name: "Kaan B.",
    role: "campus_responsible",
    universitySlug: "university-of-amsterdam",
    programSlug: "msc-business-administration",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Turkish", "English"],
    responseTime: "Usually replies within 24h",
    expertiseTags: ["Applications", "Career Opportunities", "Internships"],
    bio: "MSc Business Administration at UvA. Did an exchange in Singapore. Ask me anything about Amsterdam life and internships.",
  },
  {
    id: "user_deniz_y",
    name: "Deniz Y.",
    role: "campus_responsible",
    universitySlug: "technical-university-of-munich",
    programSlug: "msc-management-and-technology",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Turkish", "English", "German"],
    responseTime: "Usually replies within 2 days",
    expertiseTags: ["Applications", "Visa Process", "Student Life"],
    bio: "MSc Management & Technology at TUM. Patient with visa-paperwork questions — I went through everything you're about to.",
  },
  {
    id: "user_sofia_m",
    name: "Sofia M.",
    role: "campus_responsible",
    universitySlug: "ku-leuven",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["English", "Dutch", "Turkish"],
    responseTime: "Usually replies within 1 day",
    expertiseTags: ["Applications", "Housing", "Student Life"],
    bio: "Living in Leuven for two years. Tiny city, big student energy. Happy to share what worked for my applications.",
  },
  {
    id: "user_selin_d",
    name: "Selin D.",
    role: "campus_responsible",
    universitySlug: "university-of-bologna",
    programSlug: "msc-international-management",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Turkish", "Italian", "English"],
    responseTime: "Usually replies within 24h",
    expertiseTags: ["Applications", "Scholarships", "City Experience"],
    bio: "First-year MSc International Management in Bologna. Will talk your ear off about scholarships and how to land one.",
  },
  {
    id: "user_arda_t",
    name: "Arda T.",
    role: "campus_responsible",
    universitySlug: "eth-zurich",
    programSlug: "msc-computer-science",
    verified: true,
    enrolled: true,
    isCampusResponsible: true,
    languages: ["Turkish", "English", "German"],
    responseTime: "Usually replies within 2 days",
    expertiseTags: ["Applications", "Coursework", "Scholarships"],
    bio: "ETH MSc CS, second year. Coursework is hard but doable. Happy to share my application packet structure (without the actual essay).",
  },

  // Additional verified students (non-responsibles)
  {
    id: "user_mira_e",
    name: "Mira E.",
    role: "verified_student",
    universitySlug: "politecnico-di-milano",
    programSlug: "msc-design",
    verified: true,
    enrolled: true,
    isCampusResponsible: false,
  },
  {
    id: "user_burak_o",
    name: "Burak O.",
    role: "verified_student",
    universitySlug: "bocconi-university",
    programSlug: "msc-finance",
    verified: true,
    enrolled: true,
    isCampusResponsible: false,
  },
  {
    id: "user_pinar_g",
    name: "Pınar G.",
    role: "verified_student",
    universitySlug: "tu-delft",
    programSlug: "msc-aerospace-engineering",
    verified: true,
    enrolled: true,
    isCampusResponsible: false,
  },
  {
    id: "user_eda_c",
    name: "Eda C.",
    role: "verified_student",
    universitySlug: "university-of-amsterdam",
    verified: true,
    enrolled: true,
    isCampusResponsible: false,
  },
  {
    id: "user_mert_s",
    name: "Mert S.",
    role: "verified_student",
    universitySlug: "technical-university-of-munich",
    programSlug: "msc-informatics",
    verified: true,
    enrolled: true,
    isCampusResponsible: false,
  },

  // Alumni
  {
    id: "user_luca_v",
    name: "Luca V.",
    role: "alumni",
    universitySlug: "university-of-amsterdam",
    programSlug: "msc-business-administration",
    verified: true,
    enrolled: false,
    isCampusResponsible: false,
    bio: "UvA Business alum, now in product management in Berlin.",
  },
  {
    id: "user_naz_k",
    name: "Naz K.",
    role: "alumni",
    universitySlug: "bocconi-university",
    verified: true,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_omer_a",
    name: "Ömer A.",
    role: "alumni",
    universitySlug: "politecnico-di-milano",
    verified: true,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_helena_p",
    name: "Helena P.",
    role: "alumni",
    universitySlug: "eth-zurich",
    verified: true,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_marta_l",
    name: "Marta L.",
    role: "alumni",
    universitySlug: "ku-leuven",
    verified: true,
    enrolled: false,
    isCampusResponsible: false,
  },

  // Applicants (in-progress, not yet enrolled)
  {
    id: "user_ayse_t",
    name: "Ayşe T.",
    role: "applicant",
    universitySlug: "ku-leuven",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_can_y",
    name: "Can Y.",
    role: "applicant",
    universitySlug: "tu-delft",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_seda_h",
    name: "Seda H.",
    role: "applicant",
    universitySlug: "technical-university-of-munich",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_furkan_e",
    name: "Furkan E.",
    role: "applicant",
    universitySlug: "bocconi-university",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_dilara_z",
    name: "Dilara Z.",
    role: "applicant",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },

  // Prospects (browsing)
  {
    id: "user_baris_n",
    name: "Barış N.",
    role: "prospect",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
  {
    id: "user_irem_f",
    name: "İrem F.",
    role: "prospect",
    verified: false,
    enrolled: false,
    isCampusResponsible: false,
  },
];

export const USERS_BY_ID: Readonly<Record<string, CommunityUser>> =
  Object.fromEntries(FAKE_USERS.map((u) => [u.id, u]));

// ─────────────────────────────────────────────────────────────────────────
// Reviews — 12 reviews across the 8 rich unis
// ─────────────────────────────────────────────────────────────────────────

export const FAKE_REVIEWS: StudentReview[] = [
  {
    id: "rev_1",
    userId: "user_zeynep_a",
    universitySlug: "politecnico-di-milano",
    programSlug: "msc-management-engineering",
    rating: 5,
    review:
      "The mix of engineering rigor and management coursework is genuinely useful. Career fair in semester two had every consultancy and tech firm I cared about. Milan housing is a fight but worth it.",
    tags: ["Career Opportunities", "Peer Network", "City Experience"],
    helpfulCount: 48,
    createdAt: "2026-02-12T10:30:00Z",
  },
  {
    id: "rev_2",
    userId: "user_mira_e",
    universitySlug: "politecnico-di-milano",
    programSlug: "msc-design",
    rating: 4,
    review:
      "Studios are intense and the faculty pushes hard. Don't come here for nine-to-five — come if you want to build a serious portfolio. Wish there was more support around mental health during crit weeks.",
    tags: ["Course Quality", "Workload", "Support Services"],
    helpfulCount: 33,
    createdAt: "2026-01-28T14:00:00Z",
  },
  {
    id: "rev_3",
    userId: "user_emre_k",
    universitySlug: "bocconi-university",
    programSlug: "msc-international-management",
    rating: 5,
    review:
      "If you want a top European business school with serious finance + consulting placement, this is it. The international cohort is genuinely diverse — you'll have classmates from 40+ countries. Tuition is high but the ROI shows up fast.",
    tags: ["Global Network", "Career Opportunities", "Faculty"],
    helpfulCount: 71,
    createdAt: "2026-02-20T09:15:00Z",
  },
  {
    id: "rev_4",
    userId: "user_naz_k",
    universitySlug: "bocconi-university",
    rating: 4,
    review:
      "Bocconi's name carries weight in EU finance. Coursework is solid but very theory-heavy in the first semester — push through, applied content comes later. Milan is expensive; budget accordingly.",
    tags: ["Faculty", "Affordability"],
    helpfulCount: 29,
    createdAt: "2025-11-14T16:45:00Z",
  },
  {
    id: "rev_5",
    userId: "user_lara_v",
    universitySlug: "tu-delft",
    programSlug: "msc-computer-science",
    rating: 5,
    review:
      "TU Delft CS is for people who like building things, not just reading papers. Strong industry connections, lots of project work. Housing is the only real downside — start looking the day you accept.",
    tags: ["Course Quality", "Career Opportunities", "Housing"],
    helpfulCount: 56,
    createdAt: "2026-03-04T08:00:00Z",
  },
  {
    id: "rev_6",
    userId: "user_pinar_g",
    universitySlug: "tu-delft",
    programSlug: "msc-aerospace-engineering",
    rating: 5,
    review:
      "Aerospace at TUD has unreal facilities. Project teams compete internationally. The English-tasug master's structure is well-organised. Be ready for serious math.",
    tags: ["Course Quality", "Faculty", "Workload"],
    helpfulCount: 41,
    createdAt: "2026-02-09T11:20:00Z",
  },
  {
    id: "rev_7",
    userId: "user_kaan_b",
    universitySlug: "university-of-amsterdam",
    programSlug: "msc-business-administration",
    rating: 4,
    review:
      "Amsterdam is half the experience. The MSc itself is well-respected and the city's startup scene means real internship pipelines. Some courses feel surface-level if you've done a quantitative undergrad.",
    tags: ["City Experience", "Career Opportunities", "International Environment"],
    helpfulCount: 38,
    createdAt: "2026-01-30T13:30:00Z",
  },
  {
    id: "rev_8",
    userId: "user_luca_v",
    universitySlug: "university-of-amsterdam",
    programSlug: "msc-business-administration",
    rating: 5,
    review:
      "Graduated two years ago. The alumni network and recruiter access genuinely opened doors in Berlin and Amsterdam. Course content has aged well in industry.",
    tags: ["Global Network", "Career Opportunities", "Peer Network"],
    helpfulCount: 52,
    createdAt: "2025-10-12T17:00:00Z",
  },
  {
    id: "rev_9",
    userId: "user_deniz_y",
    universitySlug: "technical-university-of-munich",
    programSlug: "msc-management-and-technology",
    rating: 5,
    review:
      "M&T is a flagship for a reason. Industry partners are baked into the curriculum. Munich isn't cheap but tuition is essentially free and the engineering rigor is real.",
    tags: ["Course Quality", "Career Opportunities", "Affordability"],
    helpfulCount: 64,
    createdAt: "2026-02-25T10:00:00Z",
  },
  {
    id: "rev_10",
    userId: "user_sofia_m",
    universitySlug: "ku-leuven",
    rating: 4,
    review:
      "Leuven is a small university town — that's the charm and the limitation. Faculty is excellent and tight-knit. If you want big-city energy this isn't it, but for serious focus and friendships, it's perfect.",
    tags: ["Peer Network", "City Experience", "Faculty"],
    helpfulCount: 27,
    createdAt: "2026-01-15T12:00:00Z",
  },
  {
    id: "rev_11",
    userId: "user_selin_d",
    universitySlug: "university-of-bologna",
    programSlug: "msc-international-management",
    rating: 5,
    review:
      "Oldest uni in Europe, and you can feel it in the city. Scholarship options are real if you apply early. Programs in English are growing — check the current catalog before assuming.",
    tags: ["Affordability", "International Environment", "City Experience"],
    helpfulCount: 31,
    createdAt: "2026-02-02T15:30:00Z",
  },
  {
    id: "rev_12",
    userId: "user_arda_t",
    universitySlug: "eth-zurich",
    programSlug: "msc-computer-science",
    rating: 5,
    review:
      "Brutally rigorous and worth every late night. Zürich is expensive — budget honestly. ETH's name is universally recognised which matters for jobs and PhD applications.",
    tags: ["Course Quality", "Workload", "Global Network"],
    helpfulCount: 88,
    createdAt: "2026-03-08T09:45:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Questions
// ─────────────────────────────────────────────────────────────────────────

export const FAKE_QUESTIONS: CommunityQuestion[] = [
  {
    id: "q_1",
    text: "How hard is it to find housing in Milan as a Polimi student?",
    universitySlug: "politecnico-di-milano",
    replyCount: 32,
    verifiedReplyCount: 8,
    participantUserIds: ["user_zeynep_a", "user_mira_e", "user_omer_a"],
    createdAt: "2026-04-02T10:00:00Z",
  },
  {
    id: "q_2",
    text: "Bocconi MIM — how important is the motivation letter?",
    universitySlug: "bocconi-university",
    programSlug: "msc-international-management",
    replyCount: 24,
    verifiedReplyCount: 6,
    participantUserIds: ["user_emre_k", "user_naz_k", "user_furkan_e"],
    createdAt: "2026-04-10T13:00:00Z",
  },
  {
    id: "q_3",
    text: "TU Delft CS workload — realistic to do a side project?",
    universitySlug: "tu-delft",
    programSlug: "msc-computer-science",
    replyCount: 17,
    verifiedReplyCount: 5,
    participantUserIds: ["user_lara_v", "user_can_y"],
    createdAt: "2026-04-15T18:20:00Z",
  },
  {
    id: "q_4",
    text: "TUM M&T application timing — when should I apply?",
    universitySlug: "technical-university-of-munich",
    programSlug: "msc-management-and-technology",
    replyCount: 21,
    verifiedReplyCount: 7,
    participantUserIds: ["user_deniz_y", "user_mert_s", "user_seda_h"],
    createdAt: "2026-03-28T09:00:00Z",
  },
  {
    id: "q_5",
    text: "UvA Business — is the IELTS 6.5 really enough?",
    universitySlug: "university-of-amsterdam",
    programSlug: "msc-business-administration",
    replyCount: 14,
    verifiedReplyCount: 4,
    participantUserIds: ["user_kaan_b", "user_luca_v"],
    createdAt: "2026-04-20T11:15:00Z",
  },
  {
    id: "q_6",
    text: "Leuven housing — STUVO vs private market in 2026?",
    universitySlug: "ku-leuven",
    replyCount: 19,
    verifiedReplyCount: 6,
    participantUserIds: ["user_sofia_m", "user_marta_l", "user_ayse_t"],
    createdAt: "2026-04-05T14:30:00Z",
  },
  {
    id: "q_7",
    text: "ETH CS — how much background math do I really need?",
    universitySlug: "eth-zurich",
    programSlug: "msc-computer-science",
    replyCount: 27,
    verifiedReplyCount: 9,
    participantUserIds: ["user_arda_t", "user_helena_p"],
    createdAt: "2026-04-12T08:00:00Z",
  },
  {
    id: "q_8",
    text: "Bologna scholarships for non-EU students — current state?",
    universitySlug: "university-of-bologna",
    replyCount: 12,
    verifiedReplyCount: 3,
    participantUserIds: ["user_selin_d", "user_omer_a"],
    createdAt: "2026-04-18T16:00:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Sample group-chat messages — used inside the GroupChatModal preview
// ─────────────────────────────────────────────────────────────────────────

export const FAKE_MESSAGES_BY_GROUP: Record<string, CommunityMessage[]> = {
  "group-uni-politecnico-di-milano": [
    {
      id: "m_polimi_1",
      groupId: "group-uni-politecnico-di-milano",
      userId: "user_ayse_t",
      message:
        "Hi everyone — does anyone know if the motivation letter weight is high for Polimi MSc Management Engineering?",
      createdAt: "2026-04-20T09:14:00Z",
    },
    {
      id: "m_polimi_2",
      groupId: "group-uni-politecnico-di-milano",
      userId: "user_zeynep_a",
      message:
        "Yes — especially for Management Engineering. The committee really looks for a clear academic fit and concrete motivation. Don't be vague about why Polimi specifically.",
      createdAt: "2026-04-20T09:18:00Z",
      isFromCampusResponsible: true,
    },
    {
      id: "m_polimi_3",
      groupId: "group-uni-politecnico-di-milano",
      userId: "user_mira_e",
      message:
        "Seconding this. I mentioned a specific lab and a professor whose research I followed — felt the difference at interview.",
      createdAt: "2026-04-20T09:22:00Z",
    },
    {
      id: "m_polimi_4",
      groupId: "group-uni-politecnico-di-milano",
      userId: "user_omer_a",
      message:
        "Also: do not copy-paste the same letter you sent to Bocconi. They notice. (I might know someone who did this.)",
      createdAt: "2026-04-20T09:30:00Z",
    },
  ],
  "group-uni-bocconi-university": [
    {
      id: "m_boc_1",
      groupId: "group-uni-bocconi-university",
      userId: "user_furkan_e",
      message:
        "Has anyone done the Bocconi essay on 'a moment that changed you'? Finding it really hard to not sound clichéd.",
      createdAt: "2026-04-19T13:00:00Z",
    },
    {
      id: "m_boc_2",
      groupId: "group-uni-bocconi-university",
      userId: "user_emre_k",
      message:
        "Pick something small and specific. The cliché version is 'I climbed a mountain and learned grit'. The good version is one Tuesday at a part-time job that made you re-think a decision.",
      createdAt: "2026-04-19T13:08:00Z",
      isFromCampusResponsible: true,
    },
    {
      id: "m_boc_3",
      groupId: "group-uni-bocconi-university",
      userId: "user_naz_k",
      message:
        "Co-signing Emre. I wrote about debugging my dad's small-business spreadsheet for 4 hours and what I learned about patience. Got in. Specificity wins.",
      createdAt: "2026-04-19T13:15:00Z",
    },
  ],
  "group-uni-tu-delft": [
    {
      id: "m_tud_1",
      groupId: "group-uni-tu-delft",
      userId: "user_can_y",
      message:
        "TU Delft CS — what's the math background expected? I'm coming from a more applied undergrad.",
      createdAt: "2026-04-21T10:00:00Z",
    },
    {
      id: "m_tud_2",
      groupId: "group-uni-tu-delft",
      userId: "user_lara_v",
      message:
        "Linear algebra, probability, calculus at a solid undergrad level. They don't expect grad-level math but you'll struggle in the algorithms course if you can't manipulate big-O proofs.",
      createdAt: "2026-04-21T10:06:00Z",
      isFromCampusResponsible: true,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Rich-content groups — the 8 hand-picked universities + their flagship
// program. Auto-generated groups for the rest of the catalog live in
// generate-groups.ts.
// ─────────────────────────────────────────────────────────────────────────

export type RichGroupSeed = Omit<
  CommunityGroup,
  "id" | "type" | "country" | "memberCount" | "verifiedStudentCount"
> & {
  memberCount: number;
  verifiedStudentCount: number;
};

export const RICH_UNIVERSITY_GROUPS: Record<string, RichGroupSeed> = {
  "politecnico-di-milano": {
    name: "Politecnico di Milano Community",
    universitySlug: "politecnico-di-milano",
    description:
      "Engineering, design, architecture — Polimi's full Master's community. Verified students, alumni, and EdFind responsibles in one place.",
    memberCount: 1248,
    verifiedStudentCount: 184,
    campusResponsibleIds: ["user_zeynep_a"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview:
      "How hard is finding housing in Milan as a Polimi student?",
    latestDiscussionAuthorId: "user_ayse_t",
    activityLevel: "high",
  },
  "bocconi-university": {
    name: "Bocconi University Community",
    universitySlug: "bocconi-university",
    description:
      "Bocconi's full master's community. Finance, management, data science — across the entire MSc portfolio.",
    memberCount: 1612,
    verifiedStudentCount: 232,
    campusResponsibleIds: ["user_emre_k"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview:
      "Bocconi essay on 'a moment that changed you' — not sounding clichéd?",
    latestDiscussionAuthorId: "user_furkan_e",
    activityLevel: "high",
  },
  "tu-delft": {
    name: "TU Delft Community",
    universitySlug: "tu-delft",
    description:
      "Delft's engineering and CS master's students, alumni, and responsibles. Honest takes on workload, housing, and the application path.",
    memberCount: 982,
    verifiedStudentCount: 148,
    campusResponsibleIds: ["user_lara_v"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview: "TU Delft CS — what's the math background expected?",
    latestDiscussionAuthorId: "user_can_y",
    activityLevel: "high",
  },
  "university-of-amsterdam": {
    name: "University of Amsterdam Community",
    universitySlug: "university-of-amsterdam",
    description:
      "UvA's business, economics, and social science master's community. Includes alumni placed across Europe.",
    memberCount: 1102,
    verifiedStudentCount: 173,
    campusResponsibleIds: ["user_kaan_b"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview:
      "UvA Business — is the IELTS 6.5 really enough?",
    latestDiscussionAuthorId: "user_dilara_z",
    activityLevel: "medium",
  },
  "technical-university-of-munich": {
    name: "TUM Community",
    universitySlug: "technical-university-of-munich",
    description:
      "Technical University of Munich master's students. Strong engineering / CS / business focus, and a patient visa-paperwork crew.",
    memberCount: 1421,
    verifiedStudentCount: 207,
    campusResponsibleIds: ["user_deniz_y"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview: "TUM M&T application timing — when to apply?",
    latestDiscussionAuthorId: "user_seda_h",
    activityLevel: "high",
  },
  "ku-leuven": {
    name: "KU Leuven Community",
    universitySlug: "ku-leuven",
    description:
      "Leuven's tight-knit international master's community. Small city, big network.",
    memberCount: 638,
    verifiedStudentCount: 92,
    campusResponsibleIds: ["user_sofia_m"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview: "Leuven housing — STUVO vs private market in 2026?",
    latestDiscussionAuthorId: "user_ayse_t",
    activityLevel: "medium",
  },
  "university-of-bologna": {
    name: "University of Bologna Community",
    universitySlug: "university-of-bologna",
    description:
      "Europe's oldest university, and a growing English-taught master's portfolio. Good scholarship culture if you apply early.",
    memberCount: 724,
    verifiedStudentCount: 96,
    campusResponsibleIds: ["user_selin_d"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview:
      "Bologna scholarships for non-EU students — current state?",
    latestDiscussionAuthorId: "user_dilara_z",
    activityLevel: "medium",
  },
  "eth-zurich": {
    name: "ETH Zürich Community",
    universitySlug: "eth-zurich",
    description:
      "ETH master's community. Rigorous, international, with strong PhD pipelines. Honest answers about workload and Zürich costs.",
    memberCount: 1583,
    verifiedStudentCount: 244,
    campusResponsibleIds: ["user_arda_t"],
    isLockedForFreeUsers: true,
    latestDiscussionPreview: "ETH CS — how much background math do I really need?",
    latestDiscussionAuthorId: "user_baris_n",
    activityLevel: "high",
  },
};
