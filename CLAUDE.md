@AGENTS.md

# ChopDrop — Project Instructions & UI/UX Director Manifesto

## What This Project Is

ChopDrop is an office batch lunch ordering app built specifically for Nigerian office workers. Users pool lunch orders from local street-side and premium vendors. More people ordering from the same vendor = cheaper plates for everyone (up to 30% off). Users build their own customized plates by choosing individual components (base, protein, sides, drinks).

## The Design Philosophy: "Warm Editorial Realism"

Do not design like a generic, soul-less SaaS app. ChopDrop must feel alive, tactile, and distinctly Nigerian. The aesthetic is inspired by premium physical editorial magazines and high-end restaurant menus—relying on high-contrast typography sizes, stark layout asymmetry, and rich flat colors rather than superficial digital tricks like gradients and shadows.

## Design System — MANDATORY

Every UI component, page, and screen MUST follow the design system defined here and in design-prompt-v2.md. Before writing ANY frontend code, read this file completely.

### 1. Spatial Layout & Architectural Rules

* **Mobile-First Canvas:** Strictly single-column, locked to a max-width of 428px. Centered on desktop screens.
* **Layout Asymmetry:** Avoid identical grid heights. Intentionally break symmetry. Alternate between short, high-density row components (like order items) and tall, spacious block components (like featured vendor cards) to create visual rhythm.
* **The "Breathe & Compact" Rule:** Give major layout sections extreme whitespace (gap: 32px), but keep inner card details hyper-dense (gap: 4px or 8px). Never use uniform spacing down a page.
* **Margins:** Persistent page margins of exactly 20px.
* **Padding:** Uniform card padding of 16px.

### 2. Micro-Typography & Hierarchy

* **Font System:** Headings use **Plus Jakarta Sans** (Bold/Semibold). Body and UI elements use **Inter**.
* **Dramatic Scaling:** Intentionally force a massive contrast between neighboring text elements. Place a small 11px muted label immediately adjacent to a bold 20px price anchor. Avoid mid-range 14px uniformity.
* **Numerical Anchors:** All prices must be large, heavy, and use font-variant-numeric: tabular-nums to prevent layout shifting during changes.
* **Context-Driven Alignment:** Left-align all body text, lists, and forms. Center-alignment is strictly reserved for primary hero headings, empty state callouts, and success/celebration screens.

### 3. The Color Code (Strict Constraints)

* **Canvas Background:** Always #FAF7F2 (warm cream). Never pure white, never cool gray.
* **Surfaces:** Cards are pure #FFFFFF with a flat 1px solid #E8E2DA border. border-radius: 16px.
* **The Core Accent:** #C4572A (terracotta). Treat this like liquid gold—limit it to a maximum of 3–4 high-impact interaction elements per view.
* **Monetary Feedback:** Use #1A7D4B (forest green) for positive numbers, savings indicators, and tier discounts.
* **Text Spectrum:** Primary text is #2D2A26 (warm charcoal). Secondary metadata is #6B6560. Muted captions are #9C9590.

### 4. Component Manifest & Micro-Interactions

* **The Split-Label Action Button:** Primary buttons must be a solid 50px height with a 12px border radius. For price-associated actions, left-align the text label and right-align the dynamic price within the button bounds.
* **Vendor Showcases:** Vendor cards feature a hard 160px top-aligned food photograph. The vendor name must be cleanly overlaid over a subtle dark scrim on the photo. Metadata resides below on the clean white card surface.
* **Dynamic Tier Tracker:** Progress tracking bars must be a flat 6px tall with explicit, crisp status transitions: Gray (#9C9590) → Gold (#D4A24E) → Terracotta (#C4572A) → Forest Green (#1A7D4B).
* **Signature Detail:** The Quick Reorder card must feature a distinct 3px solid terracotta left border.
* **Invisible Utility Navigation:** The bottom navigation bar must be entirely flat—white background, thin #E8E2DA top border, minimalist 22px clean outline icons.

### 5. Interaction States & Motion Polish

* **State Prototyping:** Every interactive component must have explicit state changes: Default, Hover/Focus (150ms ease-out), Disabled (solid #F0EBE4 fill with opacity reduction).
* **The Anti-Skeleton Rule:** Never use generic gray pulsing skeleton loading screens. Use a crisp spinner or subtle rhythmic opacity pulse on the actual warm background.

## 🚫 AI Anti-Patterns (ZERO TOLERANCE)

* **NO Box Shadows:** Elevation is achieved solely through #FFFFFF on #FAF7F2 contrast with #E8E2DA borders.
* **NO Gradients:** All UI fills must be solid and flat.
* **NO Cool Grays:** Do not use #F5F5F5, #F8FAFC, or default Tailwind gray/slate scales.
* **NO Monotonous Weights:** Contrast heavy bold typography with crisp regular weights.
* **NO Pill-Shaped Buttons:** Keep action components architectural (12px border radius).
* **NO Over-Badging:** Do not wrap every text in rounded capsules. Let typography work.
* **NO Emoji Placeholders:** Never use 🍛, 🍗, or 🥤 as UI icons. Use photography or warm solid-color placeholders.
* **NO Digital Timers:** Use conversational copy ("21 min left to order") not raw digits (00:21:40).
* **NO Data Redundancy:** Never present the same metric in two places on one viewport.
* **NO Center-Aligned Body Text:** Left-align everything except hero headings and celebration screens.
* **NO Uniform Font Sizing:** Force dramatic scale shifts (11px caption next to 22px number).
* **NO Identical Card Heights:** Visual variety = human design. Identical repetition = template.

## Tech Stack

* **Framework:** Next.js 16 (App Router, Strict TypeScript)
* **Styling:** Tailwind CSS v4 with CSS custom properties in globals.css
* **Database:** Prisma 7 ORM with PostgreSQL (Neon)
* **Payments:** Paystack (LIVE keys in production)
* **Images:** Cloudinary via /api/upload
* **Hosting:** Vercel (auto-deploys on push to master)
* **Auth:** Phone + OTP (Termii API, test mode by default)

## Engineering Standards

* **Financial Integrity:** All prices processed and stored as integers in kobo. Format with ₦ symbol and commas on render.
* **Cultural Authenticity:** Use real Lagos locations, authentic vendor names, Nigerian first names, realistic plate pairings.
* **Build command:** `prisma generate && prisma db push --accept-data-loss && next build`

## Tailwind Theme Blueprint

```
colors: {
  background: '#FAF7F2',
  card: '#FFFFFF',
  border: '#E8E2DA',
  terracotta: { DEFAULT: '#C4572A', dark: '#A8471F' },
  forest: '#1A7D4B',
  gold: '#D4A24E',
  charcoal: '#2D2A26',
  secondary: '#6B6560',
  muted: '#9C9590',
  sand: '#F0EBE4',
}
```
