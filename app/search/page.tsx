import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/supabase/auth";
import { requirePremium } from "@/lib/premium/premium";
import { SearchClient } from "@/components/search/search-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SearchPage() {
  await requireUser("/search");
  await requirePremium("/search");
  return <SearchClient />;
}
