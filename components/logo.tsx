import Image from "next/image";
import Link from "next/link";

export function Logo({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-semibold tracking-tight"
      aria-label="EdFind home"
    >
      <Image
        src="/logo.png"
        alt=""
        aria-hidden
        width={301}
        height={329}
        priority
        className="h-9 w-auto"
      />
      <span className="text-xl text-foreground">EdFind</span>
      {withTagline ? (
        <span className="hidden text-sm font-normal text-muted-foreground sm:inline">
          Find your best education!
        </span>
      ) : null}
    </Link>
  );
}
