import type { Metadata } from "next";

import { requireUser } from "@/lib/supabase/auth";
import { QuizClient } from "@/components/quiz/quiz-client";

export const metadata: Metadata = {
  title: "Profile Quiz",
  description:
    "Answer 9 quick questions and we'll match you to master's programs in Europe.",
};

export default async function QuizPage() {
  await requireUser("/quiz");
  return <QuizClient />;
}
