"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Crown, Lock, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  CommunityGroup,
  CommunityMessage,
  CommunityUser,
} from "@/lib/community/types";
import { UniversityLogo } from "@/components/university/university-logo";
import { VerifiedBadge } from "./verified-badge";
import { UserAvatar } from "./user-avatar";
import { RoleBadge } from "./role-badge";
import { useVerification } from "./verification-context";
import { VerifyUniversityEmailCard } from "./verify-university-email-card";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function GroupChatModal({
  open,
  onClose,
  group,
  messages,
  users,
  responsibles,
  universityName,
  universityLogoUrl,
}: {
  open: boolean;
  onClose: () => void;
  group: CommunityGroup | null;
  messages: CommunityMessage[];
  users: Readonly<Record<string, CommunityUser>>;
  responsibles: CommunityUser[];
  universityName?: string;
  universityLogoUrl?: string | null;
}) {
  return (
    <AnimatePresence>
      {open && group && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.21, 0.6, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl"
            role="dialog"
            aria-modal
            aria-labelledby="group-chat-title"
          >
            <header className="flex items-start gap-3 border-b border-slate-200 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/60 px-5 py-4">
              <UniversityLogo
                name={universityName || group.name}
                slug={group.universitySlug}
                logoUrl={universityLogoUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h2
                  id="group-chat-title"
                  className="truncate text-base font-semibold text-slate-900"
                >
                  {group.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {group.memberCount.toLocaleString()} members ·{" "}
                  <span className="text-teal-700">
                    {group.verifiedStudentCount} verified
                  </span>
                </p>
                {responsibles.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {responsibles.slice(0, 2).map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
                      >
                        <UserAvatar user={r} size="xs" />
                        <Crown className="size-3 text-amber-500" />
                        {r.name.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>

            <ChatBody
              key={group.id}
              group={group}
              messages={messages}
              users={users}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatBody({
  group,
  messages,
  users,
}: {
  group: CommunityGroup;
  messages: CommunityMessage[];
  users: Readonly<Record<string, CommunityUser>>;
}) {
  const { canWrite } = useVerification();
  const [draft, setDraft] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<CommunityMessage[]>([]);

  const send = () => {
    if (!draft.trim()) return;
    setOptimisticMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        groupId: group.id,
        userId: "user_me",
        message: draft.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  };

  const allMessages = [...messages, ...optimisticMessages];

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/40 px-5 py-4">
        {allMessages.length === 0 ? (
          <EmptyChat />
        ) : (
          allMessages.map((m) => (
            <Message
              key={m.id}
              message={m}
              user={
                m.userId === "user_me"
                  ? {
                      name: "You",
                      role: "applicant",
                      verified: false,
                      enrolled: false,
                      isCampusResponsible: false,
                      id: "user_me",
                    }
                  : users[m.userId]
              }
              isSelf={m.userId === "user_me"}
            />
          ))
        )}
      </div>

      <footer className="border-t border-slate-100 p-4">
        {/* One gate: university verification = write permission. Read is open
            to all members, and group-chat writing is free for verified
            students — the subscription's only perk is DMing campus
            responsibles (2026-06-11 feedback), so no upgrade wall here. */}
        {!canWrite ? (
          <VerifyUniversityEmailCard variant="input" />
        ) : (
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about applications, housing, workload, scholarships…"
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="size-4" />
            </button>
          </div>
        )}
      </footer>
    </>
  );
}

function Message({
  message,
  user,
  isSelf,
}: {
  message: CommunityMessage;
  user?: CommunityUser;
  isSelf: boolean;
}) {
  if (!user) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isSelf && "flex-row-reverse")}
    >
      <UserAvatar user={user} size="sm" />
      <div className={cn("max-w-[78%]", isSelf && "text-right")}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5",
            isSelf && "justify-end",
          )}
        >
          <span className="text-xs font-semibold text-slate-800">
            {user.name}
          </span>
          {user.verified && <VerifiedBadge />}
          {user.role !== "prospect" && user.role !== "applicant" && (
            <RoleBadge role={user.role} />
          )}
          {message.isFromCampusResponsible && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              <Crown className="size-2.5" /> Responsible
            </span>
          )}
          <span className="text-[10px] text-slate-400">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "mt-1 inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isSelf
              ? "bg-teal-600 text-white"
              : message.isFromCampusResponsible
              ? "bg-amber-50 text-slate-800 ring-1 ring-amber-200"
              : "bg-white text-slate-700 ring-1 ring-slate-200",
          )}
        >
          {message.message}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700">
        <Lock className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">
        This community is just getting started
      </h3>
      <p className="max-w-xs text-xs text-slate-500">
        Be the first to break the ice — say hi or ask the question you came
        here to ask.
      </p>
      <ArrowRight className="size-3 text-slate-300" />
    </div>
  );
}
