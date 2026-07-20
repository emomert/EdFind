import type { Metadata } from "next";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/legal-page";
import { SYSTEM_PROMPT as MATCHER_PROMPT } from "@/lib/ai";
import { SYSTEM_PROMPT as PARSER_PROMPT } from "@/lib/ai/parse-query";
import {
  CV_SYSTEM_PROMPT,
  COVER_LETTER_SYSTEM_PROMPT,
} from "@/lib/ai/generate-document";
import { ANSWERS_VERSION, TOTAL_STEPS } from "@/lib/quiz/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.technicalReport.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

function PromptBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="not-prose my-4">
      <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </figcaption>
      <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-muted/50 p-4 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
        {children}
      </pre>
    </figure>
  );
}

export default function TechnicalReportPage() {
  const t = useTranslations("legal.technicalReport");
  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;
  const code = (chunks: ReactNode) => <code>{chunks}</code>;

  return (
    <LegalPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      updated={new Date("2026-06-11")}
      intro={t("intro")}
    >
      <h2>{t("sections.whatItsDoing.heading")}</h2>
      <p>{t("sections.whatItsDoing.body")}</p>

      <h2>{t("sections.stack.heading")}</h2>
      <ul>
        <li>{t.rich("sections.stack.items.webApp", { strong })}</li>
        <li>{t.rich("sections.stack.items.dataAuth", { strong })}</li>
        <li>{t.rich("sections.stack.items.hosting", { strong })}</li>
        <li>{t.rich("sections.stack.items.ai", { strong, code })}</li>
      </ul>
      <p>{t("sections.stack.note")}</p>

      <h2>{t("sections.howMatch.heading")}</h2>
      <p>
        {t("sections.howMatch.intro", {
          totalSteps: TOTAL_STEPS,
          answersVersion: ANSWERS_VERSION,
        })}
      </p>
      <ol>
        <li>{t("sections.howMatch.steps.step1")}</li>
        <li>{t("sections.howMatch.steps.step2")}</li>
        <li>{t.rich("sections.howMatch.steps.step3", { strong })}</li>
        <li>{t("sections.howMatch.steps.step4")}</li>
      </ol>
      <p>{t("sections.howMatch.note")}</p>

      <h2>{t("sections.freeTextSearch.heading")}</h2>
      <p>{t.rich("sections.freeTextSearch.body", { strong })}</p>

      <h2>{t("sections.documentDrafting.heading")}</h2>
      <p>{t("sections.documentDrafting.body")}</p>

      <h2>{t("sections.neutrality.heading")}</h2>
      <p>{t.rich("sections.neutrality.body", { strong })}</p>

      <h2>{t("sections.aiResearchedData.heading")}</h2>
      <p>{t("sections.aiResearchedData.body")}</p>

      <h2>{t("sections.promptsIntro.heading")}</h2>
      <p>{t("sections.promptsIntro.body")}</p>

      <PromptBlock label={t("promptLabels.matching")}>
        {MATCHER_PROMPT}
      </PromptBlock>

      <PromptBlock label={t("promptLabels.parser")}>
        {PARSER_PROMPT}
      </PromptBlock>

      <PromptBlock label={t("promptLabels.cv")}>
        {CV_SYSTEM_PROMPT}
      </PromptBlock>

      <PromptBlock label={t("promptLabels.coverLetter")}>
        {COVER_LETTER_SYSTEM_PROMPT}
      </PromptBlock>

      <h2>{t("sections.privacySecurity.heading")}</h2>
      <p>
        {t.rich("sections.privacySecurity.body", {
          privacyLink: (chunks) => <a href="/privacy">{chunks}</a>,
          termsLink: (chunks) => <a href="/terms">{chunks}</a>,
        })}
      </p>

      <h2>{t("sections.limitations.heading")}</h2>
      <ul>
        <li>{t("sections.limitations.items.item1")}</li>
        <li>{t("sections.limitations.items.item2")}</li>
        <li>{t("sections.limitations.items.item3")}</li>
      </ul>
    </LegalPage>
  );
}
