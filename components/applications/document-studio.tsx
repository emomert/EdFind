"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Mail,
  Sparkles,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  generateApplicationDocument,
  updateApplicationDocument,
  deleteApplicationDocument,
} from "@/app/applications/document-actions";
import {
  CV_HIGHLIGHTS_MIN_LENGTH,
  DOCUMENT_KIND_LABELS,
  HIGHLIGHTS_MAX_LENGTH,
  type ApplicationItem,
  type DocumentItem,
  type DocumentKind,
} from "./types";

export function DocumentStudio({
  documents,
  applications,
  setDocuments,
  hasProfile,
}: {
  documents: DocumentItem[];
  applications: ApplicationItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  hasProfile: boolean;
}) {
  const [kind, setKind] = useState<DocumentKind>("cv");
  const [applicationId, setApplicationId] = useState<string>("");
  const [highlights, setHighlights] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const appOptions = useMemo(
    () =>
      applications.map((a) => ({
        id: a.id,
        label: `${a.program.name} — ${a.program.university.name}`,
      })),
    [applications],
  );

  const trimmed = highlights.trim();
  const cvTooShort = kind === "cv" && trimmed.length < CV_HIGHLIGHTS_MIN_LENGTH;
  const needsApplication = kind === "cover_letter" && !applicationId;
  const canGenerate = !pending && !cvTooShort && !needsApplication;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setError(null);
    startTransition(async () => {
      const res = await generateApplicationDocument({
        kind,
        applicationId: applicationId || null,
        highlights: trimmed || null,
      });
      if (res.ok) {
        setDocuments((prev) => [res.document, ...prev]);
        setOpenId(res.document.id);
      } else if (res.needsAuth) {
        window.location.assign(
          `/login?next=${encodeURIComponent("/applications")}`,
        );
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Document studio
          </h2>
          <p className="text-sm text-muted-foreground">
            Draft a CV or a program-specific cover letter with AI, then edit it
            into your own. Drafts only use facts you give — gaps become
            [placeholders], never invented details.
          </p>
        </div>
      </header>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["cv", "CV", FileText],
              ["cover_letter", "Cover letter", Mail],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value);
                setError(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                kind === value
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}

          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="min-w-[200px] flex-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:flex-none"
            aria-label={
              kind === "cv"
                ? "Optionally tailor the CV to a tracked program"
                : "Program the cover letter is for"
            }
          >
            <option value="">
              {kind === "cv" ? "General CV (no program)" : "Pick a program…"}
            </option>
            {appOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {kind === "cover_letter" && appOptions.length === 0 && (
          <p className="mt-3 text-sm text-amber-700">
            Track a program first — a cover letter is always written for a
            specific application.
          </p>
        )}

        <label
          htmlFor="doc-highlights"
          className="mt-4 block text-sm font-medium text-foreground"
        >
          Your background, in your own words
          {kind === "cover_letter" && (
            <span className="ml-1 font-normal text-muted-foreground">
              (optional but recommended)
            </span>
          )}
        </label>
        <textarea
          id="doc-highlights"
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          rows={4}
          maxLength={HIGHLIGHTS_MAX_LENGTH}
          placeholder={
            kind === "cv"
              ? "Education dates, internships and jobs (employer, role, what you did), projects, skills, certificates… Turkish is fine — the draft comes out in English."
              : "Why this program? Relevant courses, projects, work experience, what you want to do after… Turkish is fine — the letter comes out in English."
          }
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {cvTooShort
              ? `Add at least ${CV_HIGHLIGHTS_MIN_LENGTH - trimmed.length} more characters — a CV needs real facts to draft from.`
              : `${highlights.length} / ${HIGHLIGHTS_MAX_LENGTH} characters`}
          </span>
          {!hasProfile && (
            <span>
              Tip: <a href="/quiz" className="font-medium text-teal-700 hover:underline">take the quiz</a>{" "}
              so drafts also know your goals and English level.
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90",
              !canGenerate && "cursor-not-allowed opacity-50",
            )}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {pending
              ? "Drafting…"
              : `Draft ${DOCUMENT_KIND_LABELS[kind].toLowerCase()}`}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                applications={applications}
                open={openId === doc.id}
                onToggle={() =>
                  setOpenId((cur) => (cur === doc.id ? null : doc.id))
                }
                setDocuments={setDocuments}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function DocumentCard({
  doc,
  applications,
  open,
  onToggle,
  setDocuments,
}: {
  doc: DocumentItem;
  applications: ApplicationItem[];
  open: boolean;
  onToggle: () => void;
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
}) {
  const [draft, setDraft] = useState(doc.content);
  const [copied, setCopied] = useState(false);
  const [saving, startSaving] = useTransition();
  const dirty = draft !== doc.content;

  const linkedApp = doc.application_id
    ? applications.find((a) => a.id === doc.application_id)
    : undefined;

  const handleSave = () => {
    if (!dirty || saving) return;
    startSaving(async () => {
      const res = await updateApplicationDocument({
        id: doc.id,
        content: draft,
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, content: draft } : d)),
        );
      } else {
        window.alert(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    startSaving(async () => {
      const res = await deleteApplicationDocument({ id: doc.id });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } else {
        window.alert(res.error);
      }
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([draft], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^\w\- ]+/g, "").trim() || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Icon = doc.kind === "cv" ? FileText : Mail;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl",
            doc.kind === "cv"
              ? "bg-teal-50 text-teal-700"
              : "bg-violet-50 text-violet-700",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">
            {doc.title}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {DOCUMENT_KIND_LABELS[doc.kind]}
            {linkedApp && ` · ${linkedApp.program.university.name}`}
            {" · updated "}
            {new Date(doc.updated_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </span>
        <span className="text-xs font-medium text-teal-700">
          {open ? "Close" : "Open"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 font-mono text-xs leading-relaxed text-slate-800 shadow-inner transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
            aria-label={`Edit ${doc.title}`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StudioButton
              onClick={handleSave}
              disabled={!dirty || saving}
              primary
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {dirty ? "Save changes" : "Saved"}
            </StudioButton>
            <StudioButton onClick={handleCopy}>
              {copied ? (
                <Check className="size-3.5 text-teal-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </StudioButton>
            <StudioButton onClick={handleDownload}>
              <Download className="size-3.5" />
              Download .md
            </StudioButton>
            <div className="flex-1" />
            <StudioButton onClick={handleDelete} danger disabled={saving}>
              <Trash2 className="size-3.5" />
              Delete
            </StudioButton>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Always review before sending — fill every [placeholder] and check
            facts. AI drafts are a starting point, not a finished application.
          </p>
        </div>
      )}
    </motion.article>
  );
}

function StudioButton({
  children,
  onClick,
  disabled,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        primary
          ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-700"
          : danger
            ? "border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  );
}
