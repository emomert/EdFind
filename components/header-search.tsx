"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Compass,
  GraduationCap,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { COUNTRY_NAMES } from "@/components/applications/types";
import type {
  CatalogSearchProgram,
  CatalogSearchResponse,
  CatalogSearchUniversity,
} from "@/app/api/catalog-search/route";

type ResultRow =
  | { kind: "university"; data: CatalogSearchUniversity }
  | { kind: "program"; data: CatalogSearchProgram };

const MAX_UNIS = 6;
const MAX_PROGS = 10;

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [data, setData] = useState<CatalogSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refs are written only inside callbacks (never during render), so they
  // satisfy react-hooks/refs while still letting `ensureIndex` short-circuit
  // on repeat opens without depending on the latest React state.
  const dataRef = useRef<CatalogSearchResponse | null>(null);
  const fetchInFlightRef = useRef(false);

  const ensureIndex = useCallback(() => {
    if (dataRef.current || fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    setLoading(true);
    setError(null);
    fetch("/api/catalog-search")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogSearchResponse>;
      })
      .then((json) => {
        dataRef.current = json;
        setData(json);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
      })
      .finally(() => {
        fetchInFlightRef.current = false;
        setLoading(false);
      });
  }, []);

  const openModal = useCallback(() => {
    setActiveIndex(0);
    setOpen(true);
    ensureIndex();
  }, [ensureIndex]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Cmd/Ctrl + K to open / Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            setQuery("");
            return false;
          }
          setActiveIndex(0);
          ensureIndex();
          return true;
        });
      } else if (e.key === "Escape") {
        setOpen((prev) => {
          if (prev) {
            setQuery("");
            return false;
          }
          return prev;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ensureIndex]);

  // Focus input when opening — pure DOM side effect, no state writes.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  // ─── Compute results ──────────────────────────────────────────────
  const results: ResultRow[] = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();

    if (!q) {
      // Default state: most-ranked universities + a sample of programs.
      const topUnis = [...data.universities]
        .sort(
          (a, b) =>
            (a.qs_world_rank ?? 99999) - (b.qs_world_rank ?? 99999),
        )
        .slice(0, MAX_UNIS);
      const sampleProgs = data.programs.slice(0, MAX_PROGS);
      return [
        ...topUnis.map<ResultRow>((u) => ({ kind: "university", data: u })),
        ...sampleProgs.map<ResultRow>((p) => ({ kind: "program", data: p })),
      ];
    }

    const uniMatches = data.universities
      .filter((u) => {
        const hay = `${u.name} ${u.city} ${COUNTRY_NAMES[u.country] || u.country}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, MAX_UNIS);

    const progMatches = data.programs
      .filter((p) => {
        const hay = `${p.name} ${p.university_name} ${p.degree}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, MAX_PROGS);

    return [
      ...uniMatches.map<ResultRow>((u) => ({ kind: "university", data: u })),
      ...progMatches.map<ResultRow>((p) => ({ kind: "program", data: p })),
    ];
  }, [data, query]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(0, results.length - 1));

  const goto = useCallback(
    (row: ResultRow) => {
      const href =
        row.kind === "university"
          ? `/universities/${row.data.slug}`
          : `/programs/${row.data.university_slug}/${row.data.slug}`;
      closeModal();
      router.push(href);
    },
    [router, closeModal],
  );

  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const row = results[safeActiveIndex];
      if (row) {
        e.preventDefault();
        goto(row);
      }
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
        aria-label="Search universities & programs"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <span className="hidden rounded border border-slate-200 bg-slate-50 px-1 py-px text-[10px] font-mono text-slate-400 md:inline">
          ⌘K
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/30 px-4 pt-[14vh] backdrop-blur-sm sm:pt-[18vh]"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 12, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.21, 0.6, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal
              aria-label="Catalog search"
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                {loading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" />
                ) : (
                  <Search className="size-4 shrink-0 text-slate-400" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onKeyDownInput}
                  placeholder="Search universities & programs…"
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                  Esc
                </kbd>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex size-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="max-h-[min(60vh,520px)] overflow-y-auto">
                {error && (
                  <p className="px-4 py-6 text-center text-sm text-rose-600">
                    Couldn&apos;t load the catalog right now. Try again.
                  </p>
                )}

                {!error && !loading && results.length === 0 && data && (
                  <NoResults query={query} />
                )}

                {!error && results.length > 0 && (
                  <ResultsList
                    results={results}
                    activeIndex={safeActiveIndex}
                    onHover={setActiveIndex}
                    onPick={goto}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <Hint k="↑↓">navigate</Hint>
                  <Hint k="↵">open</Hint>
                  <Hint k="Esc">close</Hint>
                </div>
                <Link
                  href="/catalog"
                  onClick={closeModal}
                  className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline"
                >
                  Browse the full catalog
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hint({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-slate-200 bg-white px-1 py-px font-mono text-[10px] text-slate-500">
        {k}
      </kbd>
      {children}
    </span>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
        <Compass className="size-5" />
      </div>
      <p className="text-sm font-medium text-slate-700">
        No match for &ldquo;{query}&rdquo;
      </p>
      <p className="max-w-xs text-xs text-slate-500">
        Try a different name, or use{" "}
        <Link href="/search" className="font-medium text-teal-700 hover:underline">
          AI Search
        </Link>{" "}
        to describe what you&apos;re looking for.
      </p>
    </div>
  );
}

function ResultsList({
  results,
  activeIndex,
  onHover,
  onPick,
}: {
  results: ResultRow[];
  activeIndex: number;
  onHover: (i: number) => void;
  onPick: (r: ResultRow) => void;
}) {
  // Split results into university + program sections for clarity.
  let uniSectionEnd = 0;
  for (let i = 0; i < results.length; i++) {
    if (results[i].kind !== "university") {
      uniSectionEnd = i;
      break;
    }
    uniSectionEnd = i + 1;
  }
  const unis = results.slice(0, uniSectionEnd);
  const progs = results.slice(uniSectionEnd);

  return (
    <div className="p-2">
      {unis.length > 0 && (
        <Section
          title="Universities"
          icon={<Building2 className="size-3" />}
        >
          {unis.map((row, idx) => (
            <UniversityRow
              key={(row.data as CatalogSearchUniversity).slug}
              row={row as ResultRow & { kind: "university" }}
              active={idx === activeIndex}
              onHover={() => onHover(idx)}
              onPick={() => onPick(row)}
            />
          ))}
        </Section>
      )}
      {progs.length > 0 && (
        <Section
          title="Programs"
          icon={<GraduationCap className="size-3" />}
        >
          {progs.map((row, i) => {
            const idx = i + unis.length;
            return (
              <ProgramRow
                key={`${(row.data as CatalogSearchProgram).university_slug}/${(row.data as CatalogSearchProgram).slug}`}
                row={row as ResultRow & { kind: "program" }}
                active={idx === activeIndex}
                onHover={() => onHover(idx)}
                onPick={() => onPick(row)}
              />
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="px-1 py-1 first:pt-2 last:pb-2">
      <p className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function UniversityRow({
  row,
  active,
  onHover,
  onPick,
}: {
  row: ResultRow & { kind: "university" };
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const u = row.data;
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
        active ? "bg-teal-50" : "hover:bg-slate-50",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-[11px] font-semibold text-white">
        {logoInitials(u.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", active ? "text-teal-800" : "text-slate-800")}>
          {u.name}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          {u.city}, {COUNTRY_NAMES[u.country] || u.country}
          {u.qs_world_rank != null && ` · QS #${u.qs_world_rank}`}
          {u.is_partner && " · Partner"}
        </p>
      </div>
      {active && <ArrowRight className="size-3.5 text-teal-600" />}
    </button>
  );
}

function ProgramRow({
  row,
  active,
  onHover,
  onPick,
}: {
  row: ResultRow & { kind: "program" };
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const p = row.data;
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
        active ? "bg-teal-50" : "hover:bg-slate-50",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-[11px] font-semibold text-white">
        {logoInitials(p.university_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", active ? "text-teal-800" : "text-slate-800")}>
          {p.name}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          ↳ {p.university_name} · {COUNTRY_NAMES[p.university_country] || p.university_country} ·{" "}
          <span className="uppercase">{p.language}</span>
        </p>
      </div>
      {active && <ArrowRight className="size-3.5 text-teal-600" />}
    </button>
  );
}

function logoInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
