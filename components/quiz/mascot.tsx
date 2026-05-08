import { cn } from "@/lib/utils";

type Props = {
  message?: string;
  className?: string;
};

const DEFAULT_MESSAGE =
  "There's no right or wrong answer — just what feels right for you!";

export function QuizMascot({ message = DEFAULT_MESSAGE, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4",
        className,
      )}
    >
      <MascotIllustration className="size-12 shrink-0" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function MascotIllustration({ className }: { className?: string }) {
  // Placeholder mascot — swap with the design PDF illustration once extracted.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" fill="var(--secondary)" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="var(--primary)" strokeWidth="2" />
      <circle cx="24" cy="28" r="2.5" fill="var(--primary)" />
      <circle cx="40" cy="28" r="2.5" fill="var(--primary)" />
      <path
        d="M22 38 Q32 46 42 38"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14 22 Q12 18 16 16"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
