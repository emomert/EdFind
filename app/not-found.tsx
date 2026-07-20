import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("common.notFound");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-primary">
        {t("badge")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("description")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">{t("backHome")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog">{t("browseCatalog")}</Link>
        </Button>
      </div>
    </div>
  );
}
