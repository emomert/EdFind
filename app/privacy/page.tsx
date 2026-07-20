import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/legal-page";
import { PrivacyContentEn } from "./content-en";
import { PrivacyContentTr } from "./content-tr";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return {
    title: t("title"),
    description: t("meta.description"),
  };
}

export default async function PrivacyPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("legal.privacy"),
  ]);

  return (
    <LegalPage
      title={t("title")}
      updated={new Date("2026-06-10")}
      intro={t("intro")}
    >
      {locale === "tr" ? <PrivacyContentTr /> : <PrivacyContentEn />}
    </LegalPage>
  );
}
