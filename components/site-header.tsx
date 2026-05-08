import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/quiz", label: "Find My Best Master Programs" },
  { href: "/track", label: "Track My Process" },
  { href: "/community", label: "Community" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"
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
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/get-started">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
