import type { Metadata } from "next";

import { requireUser } from "@/lib/supabase/auth";
import { requirePremium } from "@/lib/premium/premium";
import { QuizClient } from "@/components/quiz/quiz-client";

export const metadata: Metadata = {
  title: "Profile Quiz",
  description:
    "Answer 10 quick questions (the last is an optional free-text) and we'll match you to master's programs in Europe.",
};

export default async function QuizPage() {
  await requireUser("/quiz");
  await requirePremium("/quiz");
  return <QuizClient />;
}
