import type { Metadata } from "next";

import { requireUser } from "@/lib/supabase/auth";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = {
  title: "AI Search",
  description:
    "Describe your ideal master's in plain language. Our AI parses it and matches against every program in the catalog.",
};

export default async function SearchPage() {
  await requireUser("/search");
  return <SearchClient />;
}
