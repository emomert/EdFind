import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/supabase/auth";
import { requirePremium } from "@/lib/premium/premium";
import { QuizClient } from "@/components/quiz/quiz-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("quiz.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function QuizPage() {
  await requireUser("/quiz");
  await requirePremium("/quiz");
  return <QuizClient />;
}
