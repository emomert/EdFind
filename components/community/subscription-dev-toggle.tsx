"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSubscription } from "./subscription-context";
import { toggleSubscriptionAction } from "@/app/community/actions";

/**
 * Floating dev-only toggle to flip the community subscription state in the
 * cookie. Replace once Stripe + a real upgrade flow ships.
 */
export function SubscriptionDevToggle() {
  const { isSubscribed } = useSubscription();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const toggle = (next: boolean) => {
    startTransition(async () => {
      await toggleSubscriptionAction(next);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <div className="flex items-start gap-2">
              <Beaker className="size-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Demo mode
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Stripe isn&apos;t wired yet. Flip between free and subscribed
                  to preview both states. Saves to a cookie.
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggle(false)}
                disabled={pending}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-xs transition",
                  !isSubscribed
                    ? "border-teal-300 bg-teal-50 text-teal-800 shadow-sm"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <span className="flex items-center gap-1 font-semibold">
                  {!isSubscribed && <Check className="size-3" />}
                  Free
                </span>
                <span className="text-slate-500">Public previews only</span>
              </button>
              <button
                type="button"
                onClick={() => toggle(true)}
                disabled={pending}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-xs transition",
                  isSubscribed
                    ? "border-teal-300 bg-teal-50 text-teal-800 shadow-sm"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <span className="flex items-center gap-1 font-semibold">
                  {isSubscribed && <Check className="size-3" />}
                  Subscribed
                </span>
                <span className="text-slate-500">Full access</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border bg-white/95 px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur transition hover:shadow-xl",
          isSubscribed
            ? "border-teal-300 text-teal-800"
            : "border-amber-300 text-amber-800",
        )}
      >
        <Beaker className="size-3.5" />
        Demo: {isSubscribed ? "subscribed" : "free"}
        {expanded ? <X className="size-3.5" /> : null}
      </button>
    </div>
  );
}
