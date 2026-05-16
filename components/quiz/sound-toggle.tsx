"use client";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

export function SoundToggle({
  enabled,
  onToggle,
  className,
}: {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute quiz sounds" : "Enable quiz sounds"}
      title={enabled ? "Sounds on — click to mute" : "Sounds muted"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors",
        enabled
          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border bg-card hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {enabled ? (
        <Volume2 className="size-4" />
      ) : (
        <VolumeX className="size-4" />
      )}
    </button>
  );
}
