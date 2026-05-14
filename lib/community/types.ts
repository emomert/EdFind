export type CommunityUserRole =
  | "prospect"
  | "applicant"
  | "verified_student"
  | "alumni"
  | "campus_responsible";

export type CommunityGroupType = "university" | "program";

export type CommunityActivityLevel = "low" | "medium" | "high";

export type CommunityUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  role: CommunityUserRole;
  universitySlug?: string;
  programSlug?: string;
  verified: boolean;
  enrolled: boolean;
  isCampusResponsible: boolean;
  languages?: string[];
  responseTime?: string;
  expertiseTags?: string[];
  bio?: string;
};

export type CommunityGroup = {
  id: string;
  type: CommunityGroupType;
  name: string;
  universitySlug: string;
  programSlug?: string;
  country: string;
  description: string;
  memberCount: number;
  verifiedStudentCount: number;
  campusResponsibleIds: string[];
  isLockedForFreeUsers: boolean;
  latestDiscussionPreview?: string;
  latestDiscussionAuthorId?: string;
  activityLevel: CommunityActivityLevel;
};

export type CommunityMessage = {
  id: string;
  groupId: string;
  userId: string;
  message: string;
  createdAt: string; // ISO
  isFromCampusResponsible?: boolean;
};

export type StudentReview = {
  id: string;
  userId: string;
  universitySlug: string;
  programSlug?: string;
  rating: number; // 1-5
  review: string;
  tags: string[];
  helpfulCount: number;
  createdAt: string; // ISO
};

export type CommunityQuestion = {
  id: string;
  text: string;
  universitySlug?: string;
  programSlug?: string;
  replyCount: number;
  verifiedReplyCount: number;
  participantUserIds: string[];
  createdAt: string;
};

export type SubscriptionState = {
  isSubscribed: boolean;
  // future: plan, since, expiresAt — for now just the flag
};

export const ROLE_LABELS: Record<CommunityUserRole, string> = {
  prospect: "Prospect",
  applicant: "Applicant",
  verified_student: "Verified Student",
  alumni: "Alumni",
  campus_responsible: "Campus Responsible",
};

export const REVIEW_TAGS = [
  "Career Opportunities",
  "Peer Network",
  "Workload",
  "Affordability",
  "International Environment",
  "Support Services",
  "City Experience",
  "Course Quality",
  "Global Network",
  "Faculty",
  "Housing",
] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];

export const EXPERTISE_TAGS = [
  "Applications",
  "Housing",
  "Scholarships",
  "Student Life",
  "Career Opportunities",
  "Visa Process",
  "Coursework",
  "Internships",
] as const;
export type ExpertiseTag = (typeof EXPERTISE_TAGS)[number];
