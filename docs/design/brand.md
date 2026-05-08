# Brand: colors, typography, voice

The v1 visual reference is `Website UI Design Ver_1.pdf` in the repo root. This document codifies the design tokens so they can be applied consistently in code (Tailwind theme, shadcn theme variables, illustrations).

## Voice

- **Friendly, neutral, encouraging.** EdFind is a guide, not a salesperson. Tagline: _"Find your best education!"_
- **Plain language.** Audience is Turkish students whose English may be a working second language. Short sentences, common words.
- **Honest about limits.** "We compare objectively." "We don't promote." Partner-tier content is clearly labeled as partner content, never disguised.
- **Slightly playful** in onboarding/quiz copy (the mascot character, hand-drawn arrows, motivational microcopy). Slightly more formal on data-dense pages (university and program details).

## Color tokens

The primary accent in the design is a saturated teal. Tokens below map to Tailwind's `teal` and `slate` scales as a starting point; tweak in code if the design intent diverges.

| Token | Light value | Use |
|---|---|---|
| `--primary` | `#0D9488` (≈ teal-600) | Primary buttons, key links, brand marks |
| `--primary-hover` | `#0F766E` (≈ teal-700) | Hover state on primary |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--accent` | `#14B8A6` (≈ teal-500) | Secondary highlights, badges, progress fills |
| `--accent-soft` | `#CCFBF1` (≈ teal-100) | Highlight backgrounds (e.g. selected card border tint) |
| `--background` | `#FFFFFF` | Page background |
| `--surface` | `#F8FAFC` (≈ slate-50) | Card backgrounds, alternating sections |
| `--border` | `#E2E8F0` (≈ slate-200) | Card borders, dividers |
| `--foreground` | `#0F172A` (≈ slate-900) | Body text |
| `--muted-foreground` | `#475569` (≈ slate-600) | Secondary text |
| `--success` | `#10B981` (≈ emerald-500) | Confirmation states |
| `--warning` | `#F59E0B` (≈ amber-500) | Deadlines approaching |
| `--danger` | `#DC2626` (≈ red-600) | Errors, destructive actions |

Dark mode is **not** in scope for v1. Tokens will get dark-mode pairs when we add it.

## Typography

- **Family:** `Inter` as the primary UI font (variable; near-equivalent to the look in the design). Self-host via `next/font` to avoid a Google Fonts dependency at runtime.
- **Display headings:** Inter at 700 weight, tight letter-spacing (`-0.02em`).
- **Body:** Inter at 400/500.
- **Numerals in stats** (e.g. _"148 matched programs"_): Inter tabular numerals (`font-feature-settings: 'tnum'`).
- **Scale** (Tailwind defaults are fine to start):
  - `text-5xl` page title, `text-3xl` section title, `text-xl` card title, `text-base` body, `text-sm` meta.

## Iconography

- **Lucide** for utility icons (search, filter, calendar, check, arrow). Outline style, 1.5px stroke, 20-24px in most contexts.
- **Custom illustrations** for the hero, quiz mascot, loading screen, and empty states. These come from the design PDF or follow its style — soft pastels, single-stroke line work, light teal accents. Stored as inline SVG in `components/illustrations/` once Phase 1 starts.

## Component patterns

- **Cards** are the primary content unit: white surface, 1px border, `rounded-2xl`, subtle shadow on hover for interactive cards.
- **Buttons:**
  - Primary: solid `--primary` background, white text, `rounded-lg`, medium weight.
  - Secondary: outlined teal on white.
  - Ghost: text-only with hover background.
- **Form fields:** large hit targets, `rounded-lg`, `--border` outline, `--accent` ring on focus.
- **Progress bars** in the quiz: thin pill, `--surface` track, `--accent` fill, animated transitions on step change.

## Tailwind / shadcn integration

- Tokens above will be wired into `tailwind.config.ts` as `theme.extend.colors` and into shadcn's `app/globals.css` as CSS variables under `:root`.
- shadcn's `new-york` style is closest to the design's tighter, less-rounded look — use that as the starting style preset.

## Accessibility

- All color pairs above the body text level meet WCAG AA contrast at default sizes. Verify with a contrast checker before locking new combinations.
- Focus states must be visible on all interactive elements — never `outline: none` without a replacement ring.
- Quiz illustrations are decorative; mark them `aria-hidden`.
