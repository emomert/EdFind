import { cn } from "@/lib/utils";
import type { CommunityUser } from "@/lib/community/types";

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Stable, friendly color from a hash of the name so avatars are visually
// distinct without needing real images.
function gradientFor(name: string): string {
  const palette = [
    "from-teal-400 to-emerald-500",
    "from-sky-400 to-indigo-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
    "from-violet-400 to-fuchsia-500",
    "from-emerald-400 to-cyan-500",
    "from-indigo-400 to-purple-500",
    "from-orange-400 to-rose-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<CommunityUser, "name" | "avatarUrl">;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-base",
  }[size];

  return (
    <div
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm ring-1 ring-white/30",
        gradientFor(user.name),
        sizeClasses,
        className,
      )}
    >
      {initials(user.name)}
    </div>
  );
}
