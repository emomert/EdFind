"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flag, MessageCircle, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { CommunityUser, StudentReview } from "@/lib/community/types";
import { VerifiedBadge } from "./verified-badge";
import { RoleBadge } from "./role-badge";
import { UserAvatar } from "./user-avatar";
import { SubscriberOnly } from "./subscriber-only";

export function ReviewCard({
  review,
  user,
  universityName,
  programName,
  universitySlug,
  programSlug,
}: {
  review: StudentReview;
  user: CommunityUser;
  universityName: string;
  programName?: string;
  universitySlug: string;
  programSlug?: string;
}) {
  const [helpful, setHelpful] = useState(review.helpfulCount);
  const [marked, setMarked] = useState(false);
  const t = useTranslations("community");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.6, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(13,148,136,0.3)]"
    >
      <header className="flex items-start gap-3">
        <UserAvatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-900">{user.name}</span>
            {user.verified && <VerifiedBadge />}
            <RoleBadge role={user.role} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            <Link
              href={`/universities/${universitySlug}`}
              className="hover:text-teal-700"
            >
              {universityName}
            </Link>
            {programName && programSlug && (
              <>
                {" · "}
                <Link
                  href={`/programs/${universitySlug}/${programSlug}`}
                  className="hover:text-teal-700"
                >
                  {programName}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-100 text-slate-200",
              )}
            />
          ))}
        </div>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.review}</p>

      {review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setHelpful((h) => h + (marked ? -1 : 1));
              setMarked((m) => !m);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors",
              marked
                ? "bg-teal-50 text-teal-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
            )}
          >
            <ThumbsUp className={cn("size-3.5", marked && "fill-teal-500/30")} />
            {t("review.helpful", { count: helpful })}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <MessageCircle className="size-3.5" />
            {t("common.reply")}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <SubscriberOnly
            fallback={
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
                {t("review.subscribeToMessage")}
              </span>
            }
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-teal-700"
            >
              <MessageCircle className="size-3" />
              {t("common.messageName", { name: user.name.split(" ")[0] })}
            </button>
          </SubscriberOnly>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
            aria-label={t("review.reportAriaLabel")}
            title={t("review.reportAriaLabel")}
          >
            <Flag className="size-3.5" />
          </button>
        </div>
      </footer>
    </motion.article>
  );
}
