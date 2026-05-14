import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function VerifiedBadge({
  size = "sm",
  title = "Verified enrolled student",
  className,
}: {
  size?: "sm" | "md";
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-teal-100 text-teal-700 ring-1 ring-inset ring-teal-200",
        size === "sm" ? "size-4" : "size-5",
        className,
      )}
    >
      <BadgeCheck className={size === "sm" ? "size-3" : "size-3.5"} />
    </span>
  );
}
