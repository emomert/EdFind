import type { Metadata } from "next";
import { QuizClient } from "@/components/quiz/quiz-client";

export const metadata: Metadata = {
  title: "Profile Quiz",
  description:
    "Answer 7 quick questions and we'll match you to master's programs in Europe.",
};

export default function QuizPage() {
  return <QuizClient />;
}
