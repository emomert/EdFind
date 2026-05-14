import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { APPLICATIONS_ENABLED, COMMUNITY_ENABLED } from "@/lib/feature-flags";
import { getUser } from "@/lib/supabase/auth";
import { HeaderSearch } from "@/components/header-search";

const baseNavLinks = [
  { href: "/quiz", label: "Quiz" },
  { href: "/search", label: "AI Search" },
  { href: "/catalog", label: "Catalog" },
  { href: "/shortlist", label: "Shortlist" },
];

const navLinks = [
  ...baseNavLinks,
  ...(APPLICATIONS_ENABLED
    ? [{ href: "/applications", label: "Applications" }]
    : []),
  ...(COMMUNITY_ENABLED ? [{ href: "/community", label: "Community" }] : []),
];

export async function SiteHeader() {
  const user = await getUser();
  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Logo />

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
          aria-label="Main"
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
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
