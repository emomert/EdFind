import Link from "next/link";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";
import { APPLICATIONS_ENABLED, COMMUNITY_ENABLED } from "@/lib/feature-flags";

type FooterLink = { href: string; label: string; external?: boolean };

export function SiteFooter() {
  const t = useTranslations("common.footer");

  const explore: FooterLink[] = [
    { href: "/start", label: t("findPrograms") },
    { href: "/catalog", label: t("browseCatalog") },
    ...(COMMUNITY_ENABLED
      ? [{ href: "/community", label: t("community") }]
      : []),
  ];

  const account: FooterLink[] = [
    { href: "/quiz", label: t("takeQuiz") },
    ...(APPLICATIONS_ENABLED
      ? [{ href: "/applications", label: t("myApplications") }]
      : []),
    { href: "/login", label: t("signIn") },
  ];

  const legal: FooterLink[] = [
    { href: "/technical-report", label: t("howEdFindWorks") },
    { href: "/terms", label: t("terms") },
    { href: "/privacy", label: t("privacy") },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          <FooterColumn title={t("explore")} links={explore} />
          <FooterColumn title={t("yourJourney")} links={account} />
          <FooterColumn title={t("legalTransparency")} links={legal} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year })}</p>
          <p className="max-w-xl sm:text-right">{t("disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
