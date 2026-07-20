"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Crown, Languages, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CommunityUser } from "@/lib/community/types";
import { VerifiedBadge } from "./verified-badge";
import { UserAvatar } from "./user-avatar";
import { useSubscription } from "./subscription-context";

export function CampusResponsibleCard({
  user,
  universityName,
}: {
  user: CommunityUser;
  universityName: string;
}) {
  const { isSubscribed } = useSubscription();
  const t = useTranslations("community");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-teal-50/50 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_28px_-18px_rgba(13,148,136,0.3)]"
    >
      <div className="absolute right-3 top-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
          <Crown className="size-2.5" />
          {t("badges.responsible")}
        </span>
      </div>

      <header className="flex items-start gap-3">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0 flex-1 pr-16">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold text-slate-900">{user.name}</h3>
            {user.verified && <VerifiedBadge />}
          </div>
          <p className="text-xs text-slate-500">{universityName}</p>
          {user.responseTime && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="size-3" />
              {user.responseTime}
            </p>
          )}
        </div>
      </header>

      {user.bio && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600">{user.bio}</p>
      )}

      {user.languages && user.languages.length > 0 && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          <Languages className="size-3 text-slate-400" />
          <span className="truncate">{user.languages.join(" · ")}</span>
        </div>
      )}

      {user.expertiseTags && user.expertiseTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.expertiseTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {isSubscribed ? (
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700"
        >
          <MessageCircle className="size-3.5" />
          {t("common.messageName", { name: user.name.split(" ")[0] })}
        </button>
      ) : (
        // Direct messages are THE Premium perk — this is where the paywall
        // is allowed to show itself (2026-06-11 feedback).
        <Link
          href="/premium?next=/community"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
        >
          <MessageCircle className="size-3.5" />
          {t("responsible.goPremiumToMessage", { name: user.name.split(" ")[0] })}
        </Link>
      )}
    </motion.article>
  );
}
