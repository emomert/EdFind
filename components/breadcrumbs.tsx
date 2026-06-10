import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { href?: string; label: string };

/**
 * Compact breadcrumb trail for detail pages (Home / Catalog / University /
 * Program). The last crumb is the current page and renders as plain text.
 * Replaces the old single "Back to …" links, which assumed one entry path.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight aria-hidden className="size-3.5 text-muted-foreground/50" />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "max-w-[16rem] truncate font-medium text-foreground" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
