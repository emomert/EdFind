import { cn } from "@/lib/utils";

type Props = {
  currentStep: number;
  totalSteps: number;
  className?: string;
};

export function QuizProgressBar({ currentStep, totalSteps, className }: Props) {
  const clampedStep = Math.max(1, Math.min(currentStep, totalSteps));
  const percent = Math.round((clampedStep / totalSteps) * 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Question {clampedStep} of {totalSteps}
        </span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clampedStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label="Quiz progress"
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
