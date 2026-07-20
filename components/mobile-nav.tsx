"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type MobileNavLink = { href: string; label: string };

/**
 * Hamburger menu for small screens. The desktop nav is `hidden md:flex`, so
 * without this, phones had no access to the main nav at all (footer aside).
 * Renders a toggle button plus a slide-down panel anchored under the sticky
 * header; the panel closes on any link tap or on route change.
 */
export function MobileNav({ links }: { links: MobileNavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common.mobileNav");

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {open ? (
        <nav
          id="mobile-nav-panel"
          aria-label={t("mainMenu")}
          className="absolute inset-x-0 top-16 border-b border-border bg-background/95 shadow-lg backdrop-blur"
        >
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
