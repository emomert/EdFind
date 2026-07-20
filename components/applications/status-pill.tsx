import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/app/applications/actions";

const TONE: Record<ApplicationStatus, string> = {
  interested: "bg-slate-100 text-slate-700 ring-slate-200",
  drafting: "bg-amber-50 text-amber-700 ring-amber-200",
  submitted: "bg-sky-50 text-sky-700 ring-sky-200",
  waitlisted: "bg-violet-50 text-violet-700 ring-violet-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  withdrawn: "bg-slate-50 text-slate-500 ring-slate-200",
};

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const t = useTranslations("applications.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
        TONE[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "accepted" && "bg-emerald-500",
          status === "submitted" && "bg-sky-500",
          status === "drafting" && "bg-amber-500",
          status === "waitlisted" && "bg-violet-500",
          status === "rejected" && "bg-rose-500",
          status === "withdrawn" && "bg-slate-400",
          status === "interested" && "bg-slate-400",
        )}
        aria-hidden
      />
      {t(status)}
    </span>
  );
}
