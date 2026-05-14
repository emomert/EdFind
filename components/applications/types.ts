import type {
  ApplicationStatus,
  TaskCategory,
  TaskStatus,
} from "@/app/applications/actions";

export type ApplicationItem = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  deadline_at: string | null;
  program_id: string;
  program: {
    slug: string;
    name: string;
    degree: string;
    application_deadline: string | null;
    university: {
      slug: string;
      name: string;
      country: string;
      city: string;
      website: string | null;
    };
  };
};

export type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  category: TaskCategory;
  due_at: string | null;
  application_id: string | null;
  sort_order: number;
};

export type ProfileSummary = {
  destinations: string[];
  fieldOfStudy: string | null;
  hasProfile: boolean;
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  drafting: "Drafting",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  withdrawn: "Withdrawn",
};

export const ALL_APPLICATION_STATUSES: ApplicationStatus[] = [
  "interested",
  "drafting",
  "submitted",
  "waitlisted",
  "accepted",
  "rejected",
  "withdrawn",
];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  documents: "Documents",
  language_test: "Language test",
  writing: "Writing",
  finance: "Finance",
  admin: "Admin",
  other: "Other",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  doing: "Doing",
  done: "Done",
};

export const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  CH: "Switzerland",
  CZ: "Czechia",
  DE: "Germany",
  DK: "Denmark",
  EE: "Estonia",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  IE: "Ireland",
  IT: "Italy",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  SE: "Sweden",
  ANY: "Open to anywhere",
};

export const FIELD_LABELS: Record<string, string> = {
  business_management: "Business & Management",
  engineering: "Engineering",
  computer_science_ai: "Computer Science & AI",
  design: "Design",
  architecture_built_environment: "Architecture",
  economics_finance: "Economics & Finance",
  data_science: "Data Science",
  social_sciences: "Social Sciences",
};

/**
 * Maps an application status to a 0–1 "progress weight". Used to compute the
 * overall journey progress shown in the header.
 *   interested → 10%
 *   drafting → 40%
 *   submitted/waitlisted → 75%
 *   accepted → 100%
 *   rejected/withdrawn → counts as resolved (100%) so a closed application
 *   doesn't drag the average down forever.
 */
export const STATUS_PROGRESS_WEIGHT: Record<ApplicationStatus, number> = {
  interested: 0.1,
  drafting: 0.4,
  submitted: 0.75,
  waitlisted: 0.75,
  accepted: 1,
  rejected: 1,
  withdrawn: 1,
};
