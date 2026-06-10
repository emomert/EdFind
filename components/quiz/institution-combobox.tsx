"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Building2, Check, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  searchTurkishUniversities,
  type TurkishUniversity,
} from "@/lib/quiz/turkish-universities";

/**
 * Institution picker for the quiz. Searchable list of Turkish universities
 * (the audience's home institutions) with a first-class free-text fallback:
 * whatever the student types IS the answer, so studying abroad / at an
 * unlisted school is never a dead end. Suggestions only assist.
 *
 * Stores a plain string (the chosen or typed institution name). Diacritic-
 * folded search means "bogazici" finds "Boğaziçi University".
 */
export function InstitutionCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();

  const suggestions: TurkishUniversity[] = useMemo(
    () => searchTurkishUniversities(query, 7),
    [query],
  );

  const exactMatch = useMemo(
    () =>
      suggestions.some(
        (s) => s.name.toLowerCase() === query.trim().toLowerCase(),
      ),
    [suggestions, query],
  );

  const showList = open && query.trim().length > 0;

  function commit(name: string) {
    setQuery(name);
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleChange(next: string) {
    setQuery(next);
    setOpen(true);
    setActiveIndex(-1);
    // Free-text by default — the typed text is the live answer.
    onChange(next.trim().length === 0 ? null : next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        commit(suggestions[activeIndex].name);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative mt-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder="Search for your university…"
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay so an option's onMouseDown commit fires before we close.
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-border bg-card p-1.5 shadow-lg"
          onMouseDown={(e) => {
            // Keep focus on the input during the click so blur-close doesn't
            // race the commit.
            e.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {suggestions.map((s, i) => (
            <li key={`${s.name}-${s.city}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onClick={() => commit(s.name)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  i === activeIndex ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {s.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {s.city}
                  </span>
                </span>
                {value === s.name ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            </li>
          ))}

          {!exactMatch ? (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => commit(query.trim())}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60"
              >
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 text-muted-foreground">
                  Use my own:{" "}
                  <span className="font-medium text-foreground">“{query.trim()}”</span>
                </span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <p className="mt-2 text-xs text-muted-foreground">
        Not listed? Just type it in — we&apos;ll use exactly what you write.
      </p>
    </div>
  );
}
