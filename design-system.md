# Design System — Education Platform UI

---

## Overview

A clean, modern e-learning dashboard with a warm neutral base, pastel category cards, and a dual-panel layout. The aesthetic is minimal and approachable — soft backgrounds, rounded components, and clear typographic hierarchy.

---

## Color Palette

### Base Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-app` | `#D6F0E8` | App-level background (mint green) |
| `--color-bg-surface` | `#FAFAF8` | Main content surface / sidebar |
| `--color-bg-card` | `#FFFFFF` | Card backgrounds |
| `--color-bg-panel` | `#F5F3EF` | Right panel / secondary surface |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#1A1A1A` | Headings, primary labels |
| `--color-text-secondary` | `#6B6B6B` | Subtext, metadata, counts |
| `--color-text-muted` | `#A0A0A0` | Placeholder, disabled |
| `--color-text-inverse` | `#FFFFFF` | Text on dark/colored backgrounds |

### Accent Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-accent-primary` | `#1A1A1A` | Active nav icon, CTA buttons |
| `--color-accent-mint` | `#D6F0E8` | App background, highlight tint |
| `--color-accent-star` | `#F5A623` | Star ratings, achievement badges |

### Category Card Colors

| Category | Background | Text |
|---|---|---|
| IT & Software | `#F2CECE` | `#8B2020` (coral/salmon) |
| Business | `#FDE8C8` | `#7A4A10` (warm amber) |
| Media Training | `#E8E8F0` | `#3A3A6A` (soft lavender) |
| Interior / Design | `#D4EDD4` | `#1E5C1E` (sage green) |

---

## Typography

### Font Family

```
Primary: Inter, -apple-system, BlinkMacSystemFont, sans-serif
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 36–40px | 700 | 1.1 | Hero heading ("Invest in your education") |
| `h1` | 24px | 600 | 1.3 | Section titles |
| `h2` | 18px | 600 | 1.4 | Card titles, panel headings |
| `h3` | 15px | 500 | 1.4 | Course titles |
| `body` | 13–14px | 400 | 1.6 | Body text, descriptions |
| `caption` | 11–12px | 400 | 1.5 | Metadata, student counts, timestamps |
| `label` | 11px | 500 | 1.0 | Category tags, badges |

---

## Spacing & Layout

### Grid

- Layout type: **dual-panel fixed sidebar**
- Left sidebar: `64px` wide (icon-only nav)
- Main content: flexible, `~580px`
- Right panel: `~280px` fixed

### Spacing Scale (px)

```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64
```

### Content Padding

| Zone | Value |
|---|---|
| App outer padding | `24px` |
| Card internal padding | `16px 20px` |
| Sidebar icon padding | `16px` vertical, centered |
| Section gap | `24px` |
| Card grid gap | `16px` |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Badges, tags, small buttons |
| `--radius-md` | `12px` | Cards, filter pills |
| `--radius-lg` | `16px` | Main content panels |
| `--radius-xl` | `24px` | App-level containers |
| `--radius-full` | `9999px` | Avatar circles, pill buttons |

---

## Shadows & Elevation

| Level | Value | Usage |
|---|---|---|
| `shadow-none` | `none` | Flat cards on light bg |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.06)` | Course cards |
| `shadow-panel` | `0 4px 24px rgba(0,0,0,0.08)` | Right panel overlay |

---

## Components

### Navigation Sidebar

- Width: `64px`
- Background: `#FAFAF8`
- Icons: `24px`, monochrome SVG
- Active state: icon background circle `#1A1A1A`, icon color `#FFFFFF`
- Inactive state: icon color `#A0A0A0`
- Bottom: user avatar `36px` circle with border

```
Layout: flex column, justify-between
Items: centered, 16px vertical padding each
```

### Filter Tab Bar

Horizontal pill-tab row for category filtering.

- Container: `display: flex`, `gap: 8px`
- Active pill: `background: #1A1A1A`, `color: #FFFFFF`, `border-radius: 9999px`, `padding: 6px 16px`
- Inactive pill: `background: transparent`, `color: #6B6B6B`, `border: 1px solid #E0E0E0`
- Each pill includes a small icon (16px) + label text (13px, 500 weight)

### Course Card

Grid layout: `2 columns`, `gap: 16px`

```
Structure:
┌─────────────────────────────┐
│  [Category Tag]    ★ [4.8]  │
│                             │
│  Course Title               │
│  (2 lines max, 600 weight)  │
│                             │
│  [Avatar stack]  N students │
└─────────────────────────────┘
```

- Background: category pastel color (see palette)
- Border radius: `12px`
- Padding: `16px 20px`
- Category tag: `11px`, `500 weight`, uppercase, same-family dark color
- Rating: star icon `#F5A623` + score `12px bold`
- Title: `15px`, `600`, `#1A1A1A`, max 2 lines
- Student count: `11px`, secondary color
- Avatar stack: 3–4 circular avatars `20px`, overlapping by `6px`

### User Profile Card (Right Panel)

```
Structure:
┌─────────────────────────────┐
│  🔔    [Name]          ⚙️   │
│        Avatar               │
│        Annette Black        │
│  👤 274 Friends  [+][+][+]  │
├─────────────────────────────┤
│  Activity          Year ▾   │
│  3.5h 🔥 Great result!      │
│  [Bar chart — monthly]      │
├─────────────────────────────┤
│  My courses                 │
│  [Course card mini]         │
└─────────────────────────────┘
```

- Panel background: `#F5F3EF`
- Border radius: `16px`
- Avatar: `48px` circle, slight border `2px solid #E8E8E8`
- Name: `16px`, `600 weight`
- Friends count: `13px`, `#6B6B6B`

### Activity Bar Chart

- Bars: `6px` wide, `border-radius: 3px`
- Colors: stacked segments — `#F2CECE` (bottom) + `#D4EDD4` (top) or similar pastel pair
- Active/current month bar: `#1A1A1A` (dark accent)
- X-axis labels: `10px`, muted gray
- Height: `~80px`

### Rating Badge

```
[★ 4.8]
```

- Star: `#F5A623`, `12px`
- Score: `12px`, `700 weight`, `#1A1A1A`
- Positioned top-right of card

### "Top 10" Badge

- Background: `#1A1A1A`
- Text: `#FFFFFF`, `10px`, `600 weight`
- Border radius: `4px`
- Padding: `2px 6px`

---

## Icons

- Style: **outline**, `2px` stroke weight
- Size: `20px` in nav, `16px` inline
- Color: inherits from context (muted default, dark active)
- Categories use small filled/outline icons at `16px` in filter tabs

---

## Interaction States

| State | Treatment |
|---|---|
| Hover (card) | `box-shadow` lifts slightly, scale `1.01` |
| Active nav item | Circle bg `#1A1A1A`, icon white |
| Hover nav item | Circle bg `#F0F0F0` |
| Selected filter pill | Solid dark fill |
| Course card hover | Subtle border `1px solid rgba(0,0,0,0.12)` |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `≥ 1280px` | Full 3-zone layout (sidebar + content + right panel) |
| `1024–1279px` | Right panel collapses to drawer/overlay |
| `768–1023px` | Left sidebar becomes bottom nav bar |
| `< 768px` | Single column, cards go full-width |

---

## Design Principles

1. **Warmth over sterility** — pastel card colors and mint background avoid the cold blue-white of typical dashboards.
2. **Information density without clutter** — compact cards carry rating, category, and student count without overwhelming whitespace.
3. **Dark accent for focus** — the single `#1A1A1A` accent (active nav, "All" filter pill, dark chart bar) creates clear visual focus without competing colors.
4. **Layered surfaces** — three distinct surface levels (mint app bg → off-white content → white card) create depth without shadows.
5. **Consistent roundness** — uniform `12px` card radius and `9999px` for pills creates a friendly, cohesive feel.
