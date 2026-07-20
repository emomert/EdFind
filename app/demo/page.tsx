import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QuizAutoplay } from "@/components/demo/quiz-autoplay";

/**
 * Public, ungated self-playing demo of the quiz → AI matching flow, built for
 * the EdFind presentation video. It renders the real quiz/results components
 * driven by a scripted persona (see components/demo/), so it needs no auth,
 * no premium cookie, no DeepSeek key, and no database — which also means a
 * screen recorder or Playwright can reach it directly on the live site.
 *
 * Append `?chrome=0` to hide the "Demo" badge + Replay button for a clean,
 * product-like capture.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("demo.meta");
  return {
    title: t("title"),
    description: t("description"),
    // Keep the demo out of search results; it's a presentation asset, not a
    // product surface to index.
    robots: { index: false, follow: false },
  };
}

export default function DemoPage() {
  return <QuizAutoplay />;
}
