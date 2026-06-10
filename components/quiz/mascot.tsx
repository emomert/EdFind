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
      <MascotIllustration className="size-14 shrink-0" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * "Pusula" — EdFind's compass mascot. A friendly take on the brand's
 * compass mark: bezel ticks at the cardinal points, a needle pinned at the
 * top-right rim pointing northeast (Turkey → Europe), and a small face.
 * Drawn with the same round 2px-ish strokes as the marker decorations so it
 * sits in the house style; colors come from the theme variables.
 */
export function MascotIllustration({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 80 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* body */}
      <circle cx="38" cy="44" r="29" fill="var(--secondary)" />
      <circle
        cx="38"
        cy="44"
        r="29"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
      />
      {/* inner bezel */}
      <circle
        cx="38"
        cy="44"
        r="23"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.2"
        strokeDasharray="1.5 5"
        opacity="0.55"
      />
      {/* cardinal ticks (N tick is hidden behind the needle) */}
      <g stroke="var(--primary)" strokeWidth="2" strokeLinecap="round">
        <path d="M9 44 L14 44" />
        <path d="M62 44 L67 44" />
        <path d="M38 68 L38 73" />
      </g>

      {/* face */}
      <circle cx="30" cy="42" r="2.6" fill="var(--primary)" />
      <circle cx="46" cy="42" r="2.6" fill="var(--primary)" />
      <ellipse cx="24" cy="49" rx="3" ry="1.8" fill="var(--primary)" opacity="0.18" />
      <ellipse cx="52" cy="49" rx="3" ry="1.8" fill="var(--primary)" opacity="0.18" />
      <path
        d="M30 51 Q38 58 46 51"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* needle pinned to the top-right rim, pointing northeast */}
      <g>
        <path d="M70 7 L61 21 L56 14 Z" fill="var(--primary)" />
        <path
          d="M56 14 L61 21 L50 27 Z"
          fill="var(--card)"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M70 7 L61 21 L56 14 Z"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="59" cy="18" r="2" fill="var(--primary)" />
      </g>

      {/* motion sparkle trailing the needle */}
      <g stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <path d="M74 16 L74 22" />
        <path d="M71 19 L77 19" />
      </g>
    </svg>
  );
}
