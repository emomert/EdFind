"use client";

import { motion } from "framer-motion";
import { BadgeCheck, MessageSquare } from "lucide-react";

import type { CommunityQuestion, CommunityUser } from "@/lib/community/types";
import { UserAvatar } from "./user-avatar";
import { useSubscription } from "./subscription-context";
import { useVerification } from "./verification-context";
import { cn } from "@/lib/utils";

export function PopularQuestionsList({
  questions,
  users,
  universityNames,
  onReply,
}: {
  questions: CommunityQuestion[];
  users: Readonly<Record<string, CommunityUser>>;
  universityNames: Readonly<Record<string, string>>;
  onReply: (q: CommunityQuestion) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {questions.map((q) => (
        <QuestionRow
          key={q.id}
          q={q}
          users={users}
          universityName={
            q.universitySlug ? universityNames[q.universitySlug] || "" : ""
          }
          onReply={() => onReply(q)}
        />
      ))}
    </div>
  );
}

function QuestionRow({
  q,
  users,
  universityName,
  onReply,
}: {
  q: CommunityQuestion;
  users: Readonly<Record<string, CommunityUser>>;
  universityName: string;
  onReply: () => void;
}) {
  const { isSubscribed } = useSubscription();
  const { canWrite } = useVerification();
  // Replying writes content → needs subscription AND a verified university
  // email. Unverified subscribers see "Verify to reply" (the sidebar card
  // handles the actual flow); free users keep the "Preview" upsell.
  const canReply = isSubscribed && canWrite;
  const participants = q.participantUserIds
    .map((id) => users[id])
    .filter(Boolean);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_28px_-18px_rgba(13,148,136,0.3)]"
    >
      <h3 className="text-sm font-semibold leading-snug text-slate-900">
        {q.text}
      </h3>
      {universityName && (
        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
          {universityName}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {participants.length > 0 && (
            <div className="flex -space-x-1.5">
              {participants.slice(0, 4).map((u) => (
                <UserAvatar
                  key={u.id}
                  user={u}
                  size="xs"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
          )}
          <span>{q.replyCount} replies</span>
          <span className="inline-flex items-center gap-1 text-teal-700">
            <BadgeCheck className="size-3" /> {q.verifiedReplyCount}
          </span>
        </div>
        <button
          type="button"
          onClick={onReply}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition",
            canReply
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700",
          )}
        >
          <MessageSquare className="size-3" />
          {canReply ? "Reply" : isSubscribed ? "Verify to reply" : "Preview"}
        </button>
      </div>
    </motion.article>
  );
}
