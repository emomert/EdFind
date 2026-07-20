import Link from "next/link";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { APPLICATIONS_ENABLED, COMMUNITY_ENABLED } from "@/lib/feature-flags";
import { getUser } from "@/lib/supabase/auth";
import { HeaderSearch } from "@/components/header-search";
import { MobileNav } from "@/components/mobile-nav";

// Shortlist was merged into the applications tracker (2026-06-09): saving a
// program creates an application at status 'interested', so a separate
// "Shortlist" nav entry is redundant — it lives inside Applications now. The
// /shortlist route stays alive (it's the 'interested' view + drives /compare).

export async function SiteHeader() {
  const [user, t] = await Promise.all([getUser(), getTranslations("common")]);
  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    null;

  const navLinks = [
    { href: "/start", label: t("nav.findPrograms") },
    { href: "/catalog", label: t("nav.catalog") },
    ...(APPLICATIONS_ENABLED
      ? [{ href: "/applications", label: t("nav.applications") }]
      : []),
    ...(COMMUNITY_ENABLED
      ? [{ href: "/community", label: t("nav.community") }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Logo />

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
          aria-label={t("nav.ariaMain")}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderSearch />
          <LanguageSwitcher />
          <MobileNav links={navLinks} />
          {user ? (
            <>
              <span
                className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:inline"
                title={displayName ?? undefined}
              >
                {displayName}
              </span>
              <form action="/auth/sign-out" method="post">
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="size-3.5" />
                  {t("header.signOut")}
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">{t("header.signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
