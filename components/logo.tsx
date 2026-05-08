import Link from "next/link";
import { Bookmark } from "lucide-react";

export function Logo({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-semibold tracking-tight"
      aria-label="EdFind home"
    >
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Bookmark className="size-4" aria-hidden />
      </span>
      <span className="text-xl text-foreground">EdFind</span>
      {withTagline ? (
        <span className="hidden text-sm font-normal text-muted-foreground sm:inline">
          Find your best education!
        </span>
      ) : null}
    </Link>
  );
}
