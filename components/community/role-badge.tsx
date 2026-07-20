import { Crown, GraduationCap, MapPin, Sparkles, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { CommunityUserRole } from "@/lib/community/types";

// Maps each role to its translation key under community.badges — the
// English labels themselves stay in lib/community/types.ts (ROLE_LABELS,
// unowned by this pass) purely as the type's documentation default.
const ROLE_LABEL_KEYS: Record<CommunityUserRole, string> = {
  prospect: "roleProspect",
  applicant: "roleApplicant",
  verified_student: "roleVerifiedStudent",
  alumni: "roleAlumni",
  campus_responsible: "roleCampusResponsible",
};

const ROLE_TONE: Record<CommunityUserRole, string> = {
  prospect: "bg-slate-100 text-slate-600 ring-slate-200",
  applicant: "bg-amber-50 text-amber-700 ring-amber-200",
  verified_student: "bg-teal-50 text-teal-800 ring-teal-200",
  alumni: "bg-violet-50 text-violet-700 ring-violet-200",
  campus_responsible: "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-800 ring-teal-300",
};

const ROLE_ICON: Record<CommunityUserRole, React.ReactNode> = {
  prospect: <Sparkles className="size-3" />,
  applicant: <MapPin className="size-3" />,
  verified_student: <GraduationCap className="size-3" />,
  alumni: <GraduationCap className="size-3" />,
  campus_responsible: <Crown className="size-3" />,
};

export function RoleBadge({
  role,
  className,
}: {
  role: CommunityUserRole;
  className?: string;
}) {
  const t = useTranslations("community.badges");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        ROLE_TONE[role],
        className,
      )}
    >
      {ROLE_ICON[role] ?? <User className="size-3" />}
      {t(ROLE_LABEL_KEYS[role])}
    </span>
  );
}
