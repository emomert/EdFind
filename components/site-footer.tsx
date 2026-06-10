import Link from "next/link";

import { Logo } from "@/components/logo";
import { APPLICATIONS_ENABLED, COMMUNITY_ENABLED } from "@/lib/feature-flags";

type FooterLink = { href: string; label: string; external?: boolean };

export function SiteFooter() {
  const explore: FooterLink[] = [
    { href: "/start", label: "Find programs" },
    { href: "/catalog", label: "Browse the catalog" },
    ...(COMMUNITY_ENABLED
      ? [{ href: "/community", label: "Community" }]
      : []),
  ];

  const account: FooterLink[] = [
    { href: "/quiz", label: "Take the quiz" },
    ...(APPLICATIONS_ENABLED
      ? [{ href: "/applications", label: "My applications" }]
      : []),
    { href: "/login", label: "Sign in" },
  ];

  const legal: FooterLink[] = [
    { href: "/technical-report", label: "How EdFind works" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ];

  const year = "2026"; // Date.now() is unavailable in this runtime; bump on the yearly review.

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Neutral, AI-supported guidance to help students in Turkey find the
              right master&apos;s program in Europe — one searchable place
              instead of fifty browser tabs.
            </p>
          </div>

          <FooterColumn title="Explore" links={explore} />
          <FooterColumn title="Your journey" links={account} />
          <FooterColumn title="Legal &amp; transparency" links={legal} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} EdFind. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">
            EdFind provides information to help you choose — not admissions,
            legal, immigration, or financial advice. Always confirm details on
            the university&apos;s official site before you apply.
          </p>
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
