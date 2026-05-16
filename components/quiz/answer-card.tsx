"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

import { useSound } from "@/lib/sound/sound-context";

type Props = {
  name: string;
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  selectMode: "single" | "multi";
  onSelect: (value: string) => void;
};

export function AnswerCard({
  name,
  value,
  label,
  description,
  selected,
  selectMode,
  onSelect,
}: Props) {
  const inputType = selectMode === "single" ? "radio" : "checkbox";
  const inputId = `${name}-${value}`;
  const { play } = useSound();

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group relative flex min-h-12 cursor-pointer items-center gap-4 rounded-2xl border bg-card p-4 transition-all sm:p-5",
        "hover:border-primary/60 hover:bg-accent/40",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
        selected
          ? "border-primary bg-secondary/60 shadow-sm"
          : "border-border",
      )}
    >
      <input
        id={inputId}
        type={inputType}
        name={name}
        value={value}
        checked={selected}
        onChange={() => {
          play(selected ? "deselect" : "select");
          onSelect(value);
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selectMode === "single" ? "rounded-full" : "rounded-md",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
        )}
      >
        {selected ? <Check className="size-4" /> : null}
      </span>
      <span className="flex-1">
        <span className="block text-base font-medium text-foreground">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
