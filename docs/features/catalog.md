# Feature: Catalog browse + header search

Two related surfaces shipped 2026-05-14:

1. **`/catalog`** — public browse page for the full university + program list.
2. **Header search button** — a Cmd+K command-palette modal for jumping
   straight to a known university or program.

Together they cover the two distinct discovery flows that `/quiz` and
`/search` don't:

| Flow | Surface |
|---|---|
| "Match me to programs based on what I am" | `/quiz` (structured) |
| "Find me programs that fit this sentence" | `/search` (AI free-text) |
| "Show me everything you have, let me filter" | `/catalog` (this) |
| "Take me directly to Polimi / MSc CS" | Header search (this) |

## `/catalog`

**Public route, no auth required.** Lives at `app/catalog/page.tsx`. Server
Component reads the full catalog from Supabase and passes a denormalised
view to the `CatalogClient` component.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Hero — gradient + stats (universities · programs · countries)   │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  Tabs: Universities · Programs  (animated underline)             │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  Filters: search · country (· field · language · duration on     │
│  Programs · partner-only on Universities) · sort                 │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  Grid of UniversityCard or ProgramCard (3 cols / 2 cols)         │
│  - University card: logo, QS rank pill, partner badge, program   │
│    count, link to /universities/[slug]                           │
│  - Program card: ↳ parent university line, field/lang/duration/  │
│    tuition pills, link to /programs/[uni]/[prog]                 │
└──────────────────────────────────────────────────────────────────┘
```

### Filters

**Universities tab:** search (name, city, country), country, sort (QS rank /
A→Z / country), "Partner only" toggle.

**Programs tab:** search (name, university, degree), country, field of study,
language, duration. Sort: A→Z / tuition asc / tuition desc / duration.

Both tabs share the same search box; the placeholder updates with the tab.

### Why public

University and program detail pages were already public (SEO target). Making
the catalog public is consistent and lets first-time visitors browse before
committing to auth. The Server Component reads via the service-role client
(same pattern as `/universities/[slug]`) — no client-side Supabase exposure.

## Header search (Cmd+K)

Lives at `components/header-search.tsx`. Mounted from `components/site-header.tsx`
between the nav links and the user controls. Visible on every page.

### Behaviour

- **Trigger:** the "Search" pill in the header (visible on all viewports;
  ⌘K hint shown on `md+`), or the global Cmd/Ctrl+K shortcut anywhere.
- **Lazy index fetch:** the first time the modal opens, the component fetches
  `/api/catalog-search` once and caches the response in a ref. Subsequent
  opens are instant.
- **Empty query:** shows top-ranked universities + a sample of programs as a
  starting point.
- **Typed query:** client-side substring match against name + university +
  city + country. Up to 6 universities + 10 programs.
- **Sections:** results split into "Universities" and "Programs" with
  iconified headers so the type difference is obvious.
- **Keyboard:** ↑/↓ to move, ↵ to navigate, Esc to close. Mouse hover also
  syncs the active index.
- **Footer link:** "Browse the full catalog →" jumps to `/catalog`.
- **Empty state:** suggests `/search` (AI Search) when nothing matches.

### Why a command palette, not a search page

The user already has `/search` for free-text AI matching. The header search
covers the orthogonal "I know what I'm looking for, take me there" flow,
which would feel heavy as a full page. A modal triggered from a persistent
pill is the natural shape.

## API: `/api/catalog-search`

Route handler at `app/api/catalog-search/route.ts`. Returns a lightweight
JSON index for the modal:

```ts
type CatalogSearchResponse = {
  universities: CatalogSearchUniversity[]; // 58 entries, ~6 fields each
  programs: CatalogSearchProgram[];        // 196 entries, ~7 fields each
};
```

Payload is ~30 KB at current catalog size. `Cache-Control: public, s-maxage=60,
stale-while-revalidate=300` keeps the edge fresh without hammering Supabase.

No auth check — this is the same data the public `/catalog` and detail pages
already render.

## Component / file map

| File | Purpose |
|---|---|
| `app/catalog/page.tsx` | Server Component — loads catalog, denormalises program → university name, passes to client |
| `components/catalog/catalog-client.tsx` | Client Component — hero, tabs, filters, two card grids |
| `app/api/catalog-search/route.ts` | JSON API for the header search modal |
| `components/header-search.tsx` | Button + Cmd+K modal — lazy-fetches the index, sections, keyboard nav |
| `components/site-header.tsx` | Adds `<HeaderSearch />` and the `/catalog` nav link |

## Animation choices

- `motion.div` page fade-up on `/catalog`.
- Tab underline uses `layoutId="catalog-tab-underline"` for the slide.
- Cards entrance with `layout` + `whileHover y: -3` so the grid feels alive.
- Modal: backdrop fade + scale-from-12-down for the panel.
- Active result row gets a teal-50 fill (no motion — needs to be instant for
  keyboard navigation feel).

## What's intentionally not done

- **No deep-linking from the modal.** Selecting a result navigates via
  `router.push`; the URL doesn't carry the query.
- **No recent / pinned searches.** Comes later if we see real usage patterns.
- **No fuzzy matching.** Pure substring — easy to upgrade with `fuse.js` or
  `@algolia/autocomplete` if it stops being good enough.
- **No mobile-tuned filter drawer on `/catalog`.** The filter pill row wraps
  on mobile; works but could be cleaner as a sticky drawer.
