import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { Reveal } from "@/components/motion";

/**
 * Shared shell for the static legal / transparency pages (Terms, Privacy,
 * Technical report). Styles descendant prose elements via Tailwind arbitrary
 * variants so the page bodies can be written as plain semantic HTML without
 * the @tailwindcss/typography plugin.
 */
export function LegalPage({
  eyebrow = "EdFind",
  title,
  updated,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  updated: Date;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("legal.shell");
  const format = useFormatter();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Reveal>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          {t("lastUpdated", {
            date: format.dateTime(updated, {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          })}
        </p>
        {intro ? (
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {intro}
          </p>
        ) : null}
      </Reveal>

      <div
        className="mt-10 space-y-5 text-[15px] leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_h2:first-child]:mt-0 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-primary/50"
      >
        {children}
      </div>
    </div>
  );
}
