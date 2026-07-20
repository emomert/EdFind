import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/legal-page";
import { TermsContentEn } from "./content-en";
import { TermsContentTr } from "./content-tr";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");
  return {
    title: t("title"),
    description: t("meta.description"),
  };
}

export default async function TermsPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("legal.terms"),
  ]);

  return (
    <LegalPage
      title={t("title")}
      updated={new Date("2026-06-10")}
      intro={t("intro")}
    >
      {locale === "tr" ? <TermsContentTr /> : <TermsContentEn />}
    </LegalPage>
  );
}
