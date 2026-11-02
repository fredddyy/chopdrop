Now I have complete context. Let me produce the comprehensive UI presentation plan.

---

# ChopDrop Social Commerce: Complete UI Presentation Plan

## Design System Alignment

Before anything else, here is the mapping between the canonical design system colors specified in `CLAUDE.md` and the CSS variables currently live in `src/app/globals.css`:

| Design System Token | CLAUDE.md Value | Current CSS Variable | Current Value | Action Needed |
|---|---|---|---|---|
| Canvas background | `#FAF7F2` | `--bg` | `#FAFAF8` | Update to `#FAF7F2` |
| Card surface | `#FFFFFF` | `--card` | `#FFFFFF` | OK |
| Border | `#E8E2DA` | `--border` | `#E5E4E1` | Update to `#E8E2DA` |
| Accent (terracotta) | `#C4572A` | `--coral` | `#E8604C` | Update to `#C4572A` |
| Forest green | `#1A7D4B` | `--emerald` | `#0D9F5F` | Update to `#1A7D4B` |
| Gold | `#D4A24E` | `--gold` | `#D4A24E` | OK |
| Charcoal | `#2D2A26` | `--text` | `#1A1A19` | Update to `#2D2A26` |
| Secondary | `#6B6560` | `--text-secondary` | `#71706E` | Update to `#6B6560` |
| Muted | `#9C9590` | `--text-muted` | `#A3A09D` | Update to `#9C9590` |
| Sand | `#F0EBE4` | `--sand` | `#F2F0EC` | Update to `#F0EBE4` |

The font system also needs alignment: CLAUDE.md says "Outfit (headings), Inter (body)" per the user's context. The codebase currently uses Plus Jakarta Sans for headings. The pivot should move to **Outfit** for headings and **Inter** for body. This plan assumes that correction.

---

## 1. Discovery Feed (`/discover`)

This is the new home screen. The current `/menu` page is a daily-menu-by-timeslot browser. The new `/discover` is a product catalog with both instant-buy and pool entry points. It must feel like opening Pinduoduo crossed with Chowdeck -- immediately dense with products, urgency, and social proof.

### Header (sticky, 56px tall)

```
[Location pin icon]  "Lekki Phase 1"  [chevron down]     [Search icon]  [Cart icon + badge]
```

- Full width, white background (`--card`), 1px bottom border (`--border`).
- Left cluster: A 16px location pin icon in `--coral`, the user's area name in Outfit Semibold 15px `--text`, and a 12px chevron-down in `--muted`. Tapping opens a bottom sheet to change area.
- Right cluster: A 22px outline search icon and a 22px outline shopping bag icon, both in `--text`. The cart icon has a count badge -- a solid `--coral` circle (18px diameter), white bold 9px text, positioned at the top-right of the icon.
- On scroll (past 60px), the header gains a subtle frosted effect: `backdrop-filter: blur(12px)` with `rgba(250,247,242,0.92)` background. No box shadow.

### Category Filter Bar (horizontally scrollable, below header)

```
[All]  [Food]  [Electronics]  [Fashion]  [Groceries]  [Home]
```

- Scrollable row with `overflow-x: auto`, `hide-scrollbar` utility.
- 20px left margin, 8px gap between pills.
- Each pill: `height: 34px`, `padding: 0 14px`, `border-radius: 8px` (NOT pill-shaped; these are tag filters, so 8px radius is appropriate for this category).
- **Active state**: Background `--text` (charcoal), text white, Outfit Semibold 12px.
- **Inactive state**: Background `--sand`, text `--text-secondary`, Inter Medium 12px.
- Sticky below the header when scrolling (top: 56px).

### "Active Pools Near You" Banner (conditional, appears when pools exist)

This sits between the category bar and the product grid. It only appears when there are active pools in the user's area.

```
------------------------------------------------------------
|  [fire icon]  3 pools filling near you           See all >  |
|                                                              |
|  [Avatar stack: 3 overlapping circles]  12 people joined today  |
------------------------------------------------------------
```

- A single card: white background, `--border` border, 16px border-radius, 16px padding.
- Top row: A 14px flame icon in `--coral`, then "3 pools filling near you" in Outfit Semibold 14px `--text`, then "See all" in Inter Semibold 13px `--coral` with a 10px chevron-right, right-aligned.
- Bottom row: Avatar stack (3 overlapping 24px circles with 2px white border, each a colored initial -- cycling through `--coral`, `--gold`, `--forest`), then "12 people joined today" in Inter Regular 12px `--muted`.
- Tapping the banner navigates to `/pools`.

### Product Grid

The grid is the heart of the page. Two columns, unequal heights. The first product in the feed is a "featured" card spanning full width. After that, products alternate in a 2-column masonry-like layout.

#### Featured Product Card (full width, first item only)

```
+------------------------------------------+
|  [PRODUCT IMAGE -- 200px height]          |
|  +--------------------------------------+ |
|  | "45% off with pool"  [green pill]    | |  (overlay on image, bottom-left)
|  +--------------------------------------+ |
|                                          |
|  Mama Nkechi's Jollof Rice               |  Outfit Semibold 17px --text
|  by ChopDrop Kitchens                    |  Inter Regular 11px --muted
|                                          |
|  ₦2,500        ₦1,375 pool price        |  20px bold --text  /  16px bold --forest
|                                          |
|  [Buy Now ₦2,500]  [Start Pool ₦1,375]  |  Two buttons side by side
+------------------------------------------+
```

- White card, `--border` border, 16px border-radius.
- Image: 200px height, full-bleed at the top of the card, `object-fit: cover`. If there is a savings percentage greater than 20%, a small solid pill sits at the bottom-left of the image: background `--forest`, white text, Inter Bold 10px, `padding: 4px 10px`, 6px radius. Text: "45% off with pool".
- Below the image, 16px padding begins.
- Product name: Outfit Semibold 17px `--text`, max 2 lines, overflow hidden.
- Vendor name: "by VendorName" in Inter Regular 11px `--muted`, 2px below the name.
- Price row (8px below vendor): Two price points side-by-side.
  - Retail price: Inter Bold 20px `--text`, tabular-nums. This is the "Buy Now" price.
  - Pool price: Inter Bold 16px `--forest`, tabular-nums, preceded by a tiny vertical divider (1px `--border`, 16px tall).
- CTA row (12px below price): Two buttons, each 44px tall, 12px border-radius.
  - "Buy Now" button: Background `--sand`, text `--text` Inter Semibold 13px left-aligned, price right-aligned. This is the secondary action.
  - "Start Pool" button: Background `--coral`, text white Inter Semibold 13px left-aligned, pool price right-aligned. This is the primary action. It is the split-label button from the design system.

#### Standard Product Card (2-column grid)

```
+-------------------+
|  [IMAGE -- 140px] |
|  [-35%]           |  (savings pill, top-right on image)
|                   |
|  Suya Platter     |  Outfit Semibold 14px --text, 2 lines max
|  Buka Stop        |  Inter Regular 10px --muted
|                   |
|  ₦3,500           |  Inter Bold 18px --text (retail)
|  ₦2,275 pool      |  Inter Semibold 13px --forest
|                   |
|  [3 joined]       |  If active pools exist for this product
+-------------------+
```

- White card, `--border` border, 16px border-radius, no padding on image (full-bleed top).
- Image: 140px height, `object-fit: cover`.
- Savings pill: Top-right corner of image, `position: absolute`, top 8px right 8px. Background `--forest`, white text, Inter Bold 10px, padding `3px 8px`, 6px radius. Shows "-35%".
- Content area: 12px padding all sides.
- Product name: Outfit Semibold 14px `--text`, 2-line clamp.
- Vendor: Inter Regular 10px `--muted`, 2px below.
- Retail price: Inter Bold 18px `--text`, tabular-nums.
- Pool price: Inter Semibold 13px `--forest`, tabular-nums, directly below retail price (4px gap). Format: "₦2,275 pool".
- Active pool indicator (only if pools exist for this product): A small row at the bottom, separated by a 1px `--border` top border with 8px top padding. Shows avatar stack (2-3 tiny 18px circles) and "3 joined" in Inter Medium 11px `--muted`. This is the social proof hook.

#### Grid Layout Rules

- 2-column grid with 12px gap between columns and 12px gap between rows.
- 20px left/right page margins.
- Card heights are INTENTIONALLY different. Product cards with longer names or active pool indicators will be taller. This creates the asymmetric visual rhythm mandated by the design system.
- Every 6th card: Insert a "pool spotlight" card that spans full width (see below).

#### Pool Spotlight Card (interspersed every 6 items)

```
+------------------------------------------+
|  [dark background --text]                 |
|                                          |
|  [flame icon] Pool filling now           |  12px bold uppercase tracking-wide, --coral
|                                          |
|  Samsung Galaxy Buds3                    |  Outfit Semibold 16px white
|  ₦45,000 → ₦29,250                      |  14px line-through white/40 → 20px bold --forest
|                                          |
|  [progress bar 68% -- coral → forest]    |  6px height
|  17 of 25 joined · 8 spots left         |  12px white/50   ·   12px bold --coral
|                                          |
|  [Join this pool →]                      |  14px bold --coral, text link
+------------------------------------------+
```

- Full-width card, background `--dark` (the charcoal/near-black), 16px border-radius, 20px padding.
- "Pool filling now" header: Inter Bold 12px uppercase, letter-spacing 0.1em, `--coral`.
- Product name: Outfit Semibold 16px white.
- Price: Struck-through retail price in Inter Regular 14px `rgba(255,255,255,0.4)`, then pool price in Inter Bold 20px `--forest`.
- Progress bar: 6px height, background `rgba(255,255,255,0.1)`, fill color transitions from `--coral` (below 60%) to `--forest` (above 60%).
- Stats: "17 of 25 joined" in Inter Regular 12px `rgba(255,255,255,0.5)`, a centered dot separator, then "8 spots left" in Inter Bold 12px `--coral`.
- CTA: "Join this pool" in Inter Bold 14px `--coral` with a 10px chevron-right icon. Text link, not a button. Tapping navigates to `/pool/[slug]`.

### Search Experience

Tapping the search icon in the header opens a full-screen search overlay.

**Search overlay layout:**

```
[← Back]   [Search input field, auto-focused]   [X clear]

Recent searches:           (if any)
  jollof rice
  samsung buds
  suya

Trending:                  (always shown)
  Jollof Rice · Suya · Galaxy Buds · Ankara
```

- Background: `--bg` (warm cream), full viewport.
- Search input: 48px height, `--sand` background, 12px border-radius, Inter Regular 15px, no border on focus (use a 2px `--coral` border on focus state instead).
- Recent searches: Inter Regular 14px `--text`, each on its own row with a 14px clock icon in `--muted` to the left. Tapping searches immediately.
- Trending: Horizontal pills, `--sand` background, Inter Medium 12px `--text-secondary`, 8px radius.
- As the user types, results appear below in a product list (not grid) format: 60px tall rows with a 48px square product thumbnail, name, and price. Results update with 300ms debounce.

### Empty States

**No products found (search):**
```
(center-aligned -- this qualifies as an empty state callout)

No results for "bluetooth speakers"

Try a different search or browse categories below.

[Browse all products]  (terracotta text link)
```

- Outfit Semibold 18px `--text` for the heading.
- Inter Regular 14px `--text-secondary` for the body.
- 80px top padding from the search bar.

**No products in category:**
```
(center-aligned)

Nothing in Fashion yet

We're adding new products every week.
Check back soon or browse other categories.
```

Same typography as above.

---

## 2. Product Detail (`/product/[id]`)

### Hero Section

```
+------------------------------------------+
|  [← Back]                    [Share icon] |  Floating over image
|                                          |
|                                          |
|        [PRODUCT IMAGE -- 300px]          |
|                                          |
|                                          |
|  [Group rate]                            |  Green pill, bottom-left on image
+------------------------------------------+
```

- Product image: Full width, 300px height (taller than the deals page current 260px -- products deserve more visual real estate), `object-fit: cover`.
- If no image: Solid `--sand` background with a subtle product-category icon (outline, 48px, `--muted`).
- Back button: 40px circle, `rgba(255,255,255,0.9)` background, positioned absolute top 16px left 20px. Chevron-left icon, 18px, `--text`.
- Share button: Same circle style, top 16px right 20px. Share/upload icon.
- Savings pill: Bottom-left of image, absolute positioned, bottom 16px left 20px. Background `--forest`, white text, Inter Bold 12px, padding `6px 12px`, 8px radius. Text: "Group rate" (only shown if groupPrice < retailPrice).
- Subtle dark scrim: `linear-gradient(transparent 60%, rgba(0,0,0,0.3))` at the bottom of the image to ensure the pill is readable. NOTE: This is the one exception to the "no gradients" rule -- scrim overlays on photographs are functional, not decorative.

### Price Presentation Card (overlapping the image by 16px)

```
+------------------------------------------+
|  Mama Nkechi's Jollof Rice               |  Outfit Bold 22px --text
|  by ChopDrop Kitchens  [vendor logo]     |  Inter Regular 12px --muted + 20px avatar
|                                          |
|  ₦2,500                                 |  Inter Bold 28px --text (retail)
|  ₦1,375 with 10 people                  |  Inter Bold 22px --forest
|  You save ₦1,125 (45%)                  |  Inter Semibold 14px --forest
|                                          |
|  [description text, 3 lines max...]     |  Inter Regular 14px --text-secondary
+------------------------------------------+
```

- White card, `--border` border, 20px border-radius, 20px padding.
- Positioned with `margin-top: -16px` to overlap the hero image.
- Product name: Outfit Bold 22px `--text`, tight leading (1.2).
- Vendor row (4px below name): Vendor logo (20px circle, `object-fit: cover`, `--border` border) + "by VendorName" in Inter Regular 12px `--muted`. If no logo, show a colored initial circle.
- Retail price: Inter Bold 28px `--text`, tabular-nums. This is the visual anchor of the card.
- Pool price (4px below retail): Inter Bold 22px `--forest`, tabular-nums. Followed by "with [minPoolSize] people" in Inter Regular 14px `--text-secondary`.
- Savings line (4px below pool price): "You save ₦1,125 (45%)" in Inter Semibold 14px `--forest`.
- Description (12px below savings): Inter Regular 14px `--text-secondary`, line-height 1.6, max 3 lines with "Read more" in `--coral` if truncated.

### The TWO CTAs (sticky bottom bar)

This is the critical decision point. The two buttons must be visually distinct and immediately comprehensible.

```
+------------------------------------------+
|  [Buy Now          ₦2,500]  [Start Pool  ₦1,375]  |
+------------------------------------------+
```

- Sticky at the bottom of the viewport, above the bottom nav.
- White background, 1px `--border` top border, 16px padding horizontal, 12px padding vertical.
- Two buttons side by side with 10px gap.
- **"Buy Now" button** (left, secondary):
  - Height: 50px, border-radius: 12px.
  - Background: `--sand`. Text: `--text`.
  - Left text: "Buy Now" in Inter Semibold 14px.
  - Right text: "₦2,500" in Inter Bold 14px.
  - Width: 45% of available space.
- **"Start Pool" button** (right, primary):
  - Height: 50px, border-radius: 12px.
  - Background: `--coral`. Text: white.
  - Left text: "Start Pool" in Inter Semibold 14px.
  - Right text: "₦1,375" in Inter Bold 14px.
  - Width: 55% of available space (slightly wider -- the pool action is the primary behavior we want to encourage).
  - This button changes to **"Join Pool"** if there are active pools for this product and the user is not already in one.

Both buttons follow the split-label action button pattern from the design system.

### Active Pools for This Product

If there are active pools already open for this product, they appear in a section between the price card and the "How pools work" section.

```
+------------------------------------------+
|  ACTIVE POOLS                            |  Inter Bold 11px uppercase tracking-wide --muted
|                                          |
|  +--------------------------------------+ |
|  | [Avatar stack] Started by Chidi       | |  Inter Semibold 14px --text
|  | 7 of 10 joined · 3 spots left        | |  Inter Regular 12px --text-secondary / --coral for spots
|  | [progress bar 70%]                    | |  6px, --coral → --forest
|  | Ends in 2 days                        | |  Inter Regular 11px --muted
|  | [Join ₦1,375 →]                       | |  Inter Bold 13px --coral, text link
|  +--------------------------------------+ |
|                                          |
|  +--------------------------------------+ |
|  | [Avatar stack] Started by Ngozi       | |
|  | ...                                   | |
|  +--------------------------------------+ |
+------------------------------------------+
```

- Section header: "ACTIVE POOLS" in Inter Bold 11px uppercase, letter-spacing 0.1em, `--muted`.
- Each pool: A white card with `--border` border, 16px border-radius, 16px padding.
- Creator: Avatar (28px circle, colored initial) + "Started by [firstName]" in Inter Semibold 14px `--text`.
- Progress: "7 of 10 joined" in Inter Regular 12px `--text-secondary`, then " . " dot, then "3 spots left" in Inter Bold 12px `--coral`.
- Progress bar: 6px height, `--sand` track, `--coral` fill (transitions to `--forest` above 70%).
- Time: "Ends in 2 days" in Inter Regular 11px `--muted`. Conversational format per design system rules.
- CTA: "Join ₦1,375" in Inter Bold 13px `--coral` with a small arrow. Text link, not button.
- Gap between pool cards: 10px.

### Vendor Info Section

```
+------------------------------------------+
|  [Vendor logo 40px]  ChopDrop Kitchens   |  Outfit Semibold 16px --text
|                      Lekki Phase 1       |  Inter Regular 12px --muted
|                      [View all products >]|  Inter Semibold 12px --coral
+------------------------------------------+
```

- White card, `--border` border, 16px border-radius, 16px padding.
- Left: Vendor logo, 40px circle. Right: Vendor name, location, and a link to the vendor's product listing.

### Social Proof Section

```
+------------------------------------------+
|  [2.4k people bought this]               |  Inter Semibold 14px --text
|                                          |
|  [Avatar stack: 5 circles]               |
|  Chidinma, Emeka, and 2,398 others       |  Inter Regular 12px --muted
+------------------------------------------+
```

- Simple informational card. White background, `--border` border, 16px border-radius, 16px padding.
- Only shown when purchase count > 10.

---

## 3. Pool Detail (`/pool/[slug]`) -- THE VIRAL PAGE

This is the most important page in the entire app. When someone taps a WhatsApp link, this is what they see. It must accomplish three things in under 5 seconds:
1. Communicate what the product is and how much they save.
2. Show urgency (progress bar, countdown, spots remaining).
3. Make joining effortless (single CTA, no friction).

This page MUST work for non-authenticated users. Authentication happens AFTER they tap "Join".

### OG Meta Preview (for WhatsApp/social)

```
og:title    = "Jollof Rice Pool — ₦1,375 (was ₦2,500) — 3 spots left"
og:description = "Join Chidi's pool on ChopDrop. 7 of 10 already in. Ends Thursday."
og:image    = Product image (1200x630 generated or product photo)
og:type     = "website"
```

This is handled server-side via `generateMetadata` in the page component.

### Page Layout (top to bottom)

**Top Bar (not sticky, transparent):**

```
[← Back]                          [Share icon]
```

- Only the back arrow (or close X if opened from WhatsApp) and share icon.
- Positioned absolute over the hero image.

**Hero Product Image:**

```
+------------------------------------------+
|                                          |
|         [PRODUCT IMAGE -- 240px]         |
|                                          |
|  [Save 45%]                              |  Forest green pill, bottom-left
+------------------------------------------+
```

- 240px height, full width, `object-fit: cover`.
- Savings pill at bottom-left, identical to product detail page.

**The Money Shot -- Price + Savings Card:**

This is the first thing the brain processes after the image. Overlaps image by 20px.

```
+------------------------------------------+
|  Mama Nkechi's Jollof Rice               |  Outfit Bold 20px --text
|  by ChopDrop Kitchens                    |  Inter Regular 11px --muted
|                                          |
|  ₦2,500                                 |  Inter Regular 14px --muted, line-through
|  ₦1,375                                 |  Inter Bold 32px --forest (THE ANCHOR)
|  You save ₦1,125                         |  Inter Semibold 14px --forest
+------------------------------------------+
```

- White card, `--border` border, 20px border-radius, 20px padding.
- The pool price is rendered at 32px -- this is the largest number on the page. It must immediately communicate the value proposition.
- The retail price is struck through and muted. It is NOT bold, NOT large. It is the reference point, not the anchor.
- `margin-top: -20px` to overlap the hero.

**The Pool Progress Section (THE URGENCY ENGINE):**

This is the most emotionally charged section. It answers: "Is this pool going to succeed? Should I join now?"

```
+------------------------------------------+
|  [dark background]                       |
|                                          |
|  Started by Chidi                        |  Inter Semibold 14px white
|                                          |
|  [====================-------]  70%      |  8px progress bar
|                                          |
|  7 of 10 people joined                  |  Inter Bold 16px white
|  3 more to unlock the group rate        |  Inter Regular 13px white/50
|                                          |
|  [Avatar] [Avatar] [Avatar] [Avatar]     |  Participant avatars
|  [Avatar] [Avatar] [Avatar]              |
|                                          |
|  Ends Thursday evening                   |  Inter Semibold 13px --gold
+------------------------------------------+
```

- Dark card: Background `--dark`, 20px border-radius, 20px padding. 12px below the price card.
- Creator: "Started by [firstName]" in Inter Semibold 14px white.
- Progress bar: 8px height (slightly thicker than standard -- this is the focus of the page), `rgba(255,255,255,0.1)` track.
  - Fill color follows the tier tracker: `--muted` (0-25%), `--gold` (25-50%), `--coral` (50-75%), `--forest` (75-100%).
  - Smooth CSS transition: `width 700ms ease-out`.
  - Percentage text right-aligned: Inter Bold 14px, same color as the bar fill.
- "7 of 10 people joined" in Inter Bold 16px white.
- "3 more to unlock the group rate" in Inter Regular 13px `rgba(255,255,255,0.5)`.
- Participant avatars: 32px circles, 2px white border, colored initials (cycle through `--coral`, `--gold`, `--forest`, `--muted`). Laid out in a wrapping flex row, `gap: 6px`. Max 10 shown. If more, last circle shows "+3" in white text on a `rgba(255,255,255,0.15)` background.
- Countdown: "Ends Thursday evening" in Inter Semibold 13px `--gold`. CONVERSATIONAL format per design system -- never raw digits. More examples: "Ends in 6 hours", "Ends tomorrow morning", "Last few hours".
- When the pool is almost full (1-2 spots), the countdown text changes to `--coral` and reads "Almost full -- 1 spot left".

**How It Works (collapsed by default for return visitors, expanded for first-time):**

```
+------------------------------------------+
|  How pools work                     [v]  |  Accordion header
|                                          |
|  1  Join and pay ₦1,375                 |
|  2  Wait for 3 more people to join      |
|  3  Pool fills → order ships            |
|  4  Doesn't fill? Full refund.          |
+------------------------------------------+
```

- White card, `--border` border, 16px border-radius, 16px padding.
- Accordion: Outfit Semibold 16px `--text` header with a 14px chevron that rotates 180 degrees on toggle (150ms ease-out).
- Steps: Each step has a 28px circle with the number (background `--coral`, white text, Inter Bold 12px), then the text in Inter Regular 14px `--text-secondary`. 12px gap between steps.
- Step 4 (refund guarantee) uses `--forest` for the number circle background instead of `--coral` to emphasize safety.

**Share CTA (THE VIRAL MECHANISM):**

```
+------------------------------------------+
|  [WhatsApp green background]             |
|                                          |
|  Share to fill the pool faster           |  Inter Bold 15px white
|                                          |
|  [WhatsApp icon]  Share on WhatsApp      |  50px button, white bg, green text
|                                          |
|  [Copy link]                             |  Inter Semibold 13px white/60, text link
+------------------------------------------+
```

- Full-width section, background `#25D366` (WhatsApp green), 16px border-radius, 20px padding.
- Heading: "Share to fill the pool faster" in Inter Bold 15px white.
- WhatsApp share button: 50px height, 12px border-radius, white background, `#25D366` text. WhatsApp icon (18px) on the left. Full width.
- Below: "Copy link" text link in Inter Semibold 13px `rgba(255,255,255,0.6)`. Tapping copies the pool URL and shows a brief "Copied" confirmation.

**Join CTA (sticky bottom bar):**

```
+------------------------------------------+
|  [Join for ₦1,375                    →]  |  THE button. Full width.
+------------------------------------------+
```

- Sticky at the bottom, above safe area inset.
- White background, 1px `--border` top border, 20px horizontal padding, 12px vertical padding.
- Single button: 54px height (slightly taller than standard 50px -- this is the highest-stakes button in the app), 12px border-radius.
- Background: `--coral`. Text: white.
- Split-label: "Join for" left-aligned Inter Semibold 15px, "₦1,375" right-aligned Inter Bold 15px.
- Arrow icon (14px) at the far right.
- Press state: `background: --coral-dark`, `transform: scale(0.98)`, 150ms ease-out.

**States after joining:**

When the user taps "Join", they go through: Auth check (if not logged in, bottom sheet with phone + OTP) -> Paystack payment -> Success state.

**Success state (replaces the page body below the hero):**

```
(center-aligned -- celebration screen)

[Green checkmark in 64px circle]

You're in!
You joined Chidi's pool for ₦1,375.

We'll notify you when the pool fills.

[WhatsApp share button -- "Tell friends, fill it faster"]
[View my pools →]
```

- The hero image stays. Everything below it is replaced with this celebration screen.
- Green circle: 64px, background `--forest`, white checkmark icon (30px).
- "You're in!" in Outfit Bold 22px `--text`.
- Body text: Inter Regular 14px `--text-secondary`.
- WhatsApp button: same as the share CTA above.
- "View my pools" text link: Inter Semibold 14px `--coral`.

**Expired/Cancelled state:**

```
(center-aligned)

This pool has ended

The deadline passed before the pool filled.
Everyone has been refunded.

[Browse products →]
```

- Muted presentation. Outfit Semibold 18px `--text`, body in Inter Regular 14px `--text-secondary`.

**Filled/Completed state:**

```
(center-aligned)

Pool complete!
All 10 spots filled. Orders are being processed.

[Browse more products →]
```

- Forest green checkmark, celebratory.

---

## 4. Pools Listing (`/pools`)

### Header

```
Pools                                      |  Outfit Bold 28px --text
The more join, the cheaper it gets.        |  Inter Regular 14px --text-secondary
```

- Same sticky header pattern as `/discover` with back button and cart icon.
- Page title below: 28px bold, left-aligned, 20px margins. Subtitle directly below.

### Area Filter

```
[pin icon] Lekki Phase 1  [change]
```

- A subtle row showing the user's current area. Tapping "change" opens the same area picker bottom sheet as the discover page header.
- Inter Semibold 14px `--text` for the area name. "change" in Inter Semibold 12px `--coral`.

### Sort Tabs

```
[Ending soon]  [Almost full]  [Newest]  [Biggest savings]
```

- Horizontally scrollable, same pill styling as the category filter on `/discover`.
- Active pill: `--text` background, white text. Inactive: `--sand` background, `--text-secondary` text.
- Default sort: "Ending soon".

### Pool Card Design

Each pool card is a full-width card (not 2-column -- pools need more information density).

```
+------------------------------------------+
|  [Product image    |  Suya Platter       |
|   80px square      |  by Buka Stop       |
|   rounded-12px]    |                     |
|                    |  ₦3,500 → ₦2,275    |  struck → bold forest
|                    |  Save 35%           |
+--------------------+---------------------+
|  [progress bar 45%]                      |  6px
|  9 of 20 joined        Ends in 3 days   |
|                                          |
|  Started by Emeka · 11 spots left       |
|                                          |
|  [Join ₦2,275]                    [Share]|  Two CTAs
+------------------------------------------+
```

- White card, `--border` border, 16px border-radius.
- **Top half** (16px padding): Horizontal layout. Left: Product image, 80px square, 12px border-radius. Right: Product name (Outfit Semibold 15px `--text`), vendor (Inter Regular 11px `--muted`), prices (struck retail in Inter Regular 13px `--muted` with line-through, then pool price in Inter Bold 18px `--forest`, then "Save 35%" in Inter Semibold 12px `--forest`).
- **Bottom half** (separated by 1px `--border` top border, 16px padding): Progress bar (6px, color-coded by tier tracker), stats row ("9 of 20 joined" left in Inter Regular 12px `--text-secondary`, "Ends in 3 days" right in Inter Semibold 12px `--gold`), creator + spots ("Started by Emeka" in Inter Regular 12px `--muted`, dot separator, "11 spots left" in Inter Bold 12px `--coral`).
- **CTA row** (8px above bottom): "Join ₦2,275" button -- 40px height, 12px radius, `--coral` background, white text, Inter Bold 13px. "Share" button -- 40px height, 12px radius, `--sand` background, `--text-secondary` text, Inter Semibold 13px, share icon.

### Visual Rhythm

- Gap between pool cards: 12px.
- Every 4th card: Insert a "Start your own pool" interstitial card.

**"Start your own pool" interstitial:**

```
+------------------------------------------+
|  Don't see what you want?                |  Outfit Semibold 16px --text
|  Start your own pool from any product.   |  Inter Regular 13px --text-secondary
|                                          |
|  [Browse products →]                     |  Inter Bold 14px --coral, text link
+------------------------------------------+
```

- `--sand` background (not white -- visual break from the pool cards), 16px border-radius, 16px padding.

### Empty State

```
(center-aligned)

No pools in your area yet

Be the first -- start a pool from any product
and share it with friends nearby.

[Browse products]  (terracotta button)
```

---

## 5. Cart + Checkout

The cart must handle two fundamentally different item types: instant-buy items (pay full price, fulfill immediately) and pool items (pay group price, wait for pool to fill). These must be visually distinct.

### Cart Page (`/cart`)

**Header:**
```
Your cart                                  |  Outfit Bold 24px --text
2 items                                    |  Inter Regular 13px --muted
```

**Instant Buy Section:**

```
INSTANT BUY                                |  Inter Bold 11px uppercase tracking-wide --muted
Ships as soon as you pay                   |  Inter Regular 12px --text-secondary

+------------------------------------------+
|  [img 56px]  Jollof Rice                 |
|              ChopDrop Kitchens           |
|              Qty: 1  [-] [+]            |
|                               ₦2,500     |  Inter Bold 18px --text
+------------------------------------------+
```

- Section header with label and subtitle.
- Each item: White card, `--border` border, 16px border-radius, 16px padding. Horizontal layout: 56px square image (12px radius), then product name (Outfit Semibold 14px `--text`), vendor (Inter Regular 11px `--muted`), quantity controls (32px square buttons with +/- icons, `--sand` background, centered count in Inter Semibold 14px), and price right-aligned (Inter Bold 18px `--text`, tabular-nums).
- Swipe left to reveal a red "Remove" action (or a trash icon button on the right).

**Pool Items Section:**

```
POOL ITEMS                                 |  Inter Bold 11px uppercase tracking-wide --muted
Price locked when pool fills               |  Inter Regular 12px --text-secondary

+------------------------------------------+
|  [3px terracotta left border]            |  (Signature detail from design system)
|  [img 56px]  Samsung Galaxy Buds3        |
|              TechHub NG                  |
|              Pool: 7/10 joined           |
|              [progress bar 70%]          |
|                               ₦29,250    |  Inter Bold 18px --forest
|              Retail ₦45,000              |  Inter Regular 12px --muted, line-through
+------------------------------------------+
```

- Pool items have the **3px solid `--coral` left border** -- this is the signature detail from the design system's "Quick Reorder" pattern, repurposed to mark pool items.
- Price shown in `--forest` (green) instead of `--text`, because this is the discounted pool price.
- Mini progress bar (4px height) showing pool fill status.
- "Pool: 7/10 joined" in Inter Semibold 11px `--text-secondary`.

**Price Breakdown:**

```
+------------------------------------------+
|  Subtotal (instant)          ₦2,500      |
|  Subtotal (pools)            ₦29,250     |
|  Service fee                 ₦150        |
|  Delivery                    Free         |  --forest if free
|  ────────────────────────────────────     |
|  Total                       ₦31,900     |  Inter Bold 20px --text
|                                          |
|  You save ₦16,875 with pools            |  Inter Semibold 14px --forest
+------------------------------------------+
```

- White card, `--border` border, 16px border-radius, 20px padding.
- Each line: Inter Regular 14px `--text-secondary` left, Inter Semibold 14px `--text` right, tabular-nums.
- Divider: 1px `--border`.
- Total: Inter Bold 20px `--text`.
- Savings: Inter Semibold 14px `--forest`, highlighted.

**Checkout CTA (sticky bottom):**

```
+------------------------------------------+
|  [Pay ₦31,900                        →]  |
+------------------------------------------+
```

- Same split-label button pattern. 50px height, 12px radius, `--coral` background, white text.
- If only pool items: Button text changes to "Pay ₦29,250 (pool escrow)".
- If only instant items: "Pay ₦2,500".

### Payment Flow Differences

**Instant buy:** Pay -> Paystack -> Webhook confirms -> Order created -> Success screen with order code and estimated delivery.

**Pool items:** Pay -> Paystack (escrow) -> Participant added to pool -> "You're in the pool!" screen with share CTA. Money is held. If pool fills, order processes. If pool expires, automatic refund (in-app credit or Paystack refund).

**Mixed cart:** Single Paystack payment for the total. Backend splits: instant portion fulfills immediately, pool portion enters escrow. Success screen shows both statuses.

---

## 6. Bottom Navigation

Four tabs:

```
[Compass/Discover]  [Users/Pools]  [Bag/Cart]  [User/Me]
```

| Tab | Label | Icon | Path |
|---|---|---|---|
| 1 | Discover | Compass outline (22px, 1.5px stroke) | `/discover` |
| 2 | Pools | Users/group outline (22px, 1.5px stroke) | `/pools` |
| 3 | Cart | Shopping bag outline (22px, 1.5px stroke) | `/cart` |
| 4 | Me | User circle outline (22px, 1.5px stroke) | `/account` |

**Styling:**
- White background (`--card`), 1px `--border` top border. No shadow. "Invisible infrastructure."
- 4-column grid, centered items.
- Inactive: Icon stroke `--muted`, label Inter Medium 11px `--muted`.
- Active: Icon filled with `--coral` (stroke-width 0, fill currentColor), label Inter Bold 11px `--coral`.
- Active indicator: A 4px wide, 3px tall rounded bar centered above the icon, background `--coral`. Positioned absolute at -2px top.
- Cart tab special behavior: When cart has items, the label changes from "Cart" to the formatted total (e.g., "₦31,900") in the same 11px size. A badge (18px circle, `--coral` background, white 9px bold text) shows item count, positioned at top-right of the icon.
- Safe area: `padding-bottom: env(safe-area-inset-bottom)` for notch devices.

---

## 7. Key Micro-interactions

### Adding to Cart Animation

When user taps "Buy Now" on a product:
1. Button text changes to a checkmark icon for 600ms.
2. A small product thumbnail (24px circle) "flies" from the button position toward the cart icon in the bottom nav, following a bezier curve (CSS `@keyframes` with `translate` and `scale`). Duration: 500ms.
3. The cart badge bounces (`scale(1.3)` then back to `1`, 200ms).
4. The button text returns to normal.

Implementation: CSS keyframes, no JS animation library needed. The flying thumbnail is a cloned element appended to the body, positioned fixed, animated, then removed.

### Pool Progress Animation (someone joins)

When viewing a pool page and a real-time event fires (or on page load):
1. The progress bar width animates from old value to new value over 700ms with `ease-out`.
2. A new avatar slides in from the right into the avatar stack (200ms, `translateX(20px)` to `translateX(0)`).
3. The participant count number animates: old number fades out (`opacity 0, translateY(-8px)`) and new number fades in (`opacity 1, translateY(0)`). Duration: 300ms.
4. If the pool just became "almost full" (1-2 spots), the entire progress section briefly pulses: border color flashes `--coral` for 500ms.

### WhatsApp Share Feedback

When user taps the WhatsApp share button:
1. Button scales down to 0.97 on press (150ms).
2. WhatsApp deep link opens (external).
3. When user returns to the app (visibilitychange event), show a brief toast at the top: "Link shared! Waiting for friends to join..." in Inter Semibold 13px, `--forest` background, white text. Auto-dismisses after 3 seconds with a slide-up exit.

### Timer Urgency States

The conversational countdown text changes color based on urgency:

| Time Remaining | Color | Copy Example |
|---|---|---|
| > 3 days | `--muted` | "Ends next Monday" |
| 1-3 days | `--text-secondary` | "Ends in 2 days" |
| 6-24 hours | `--gold` | "Ends tomorrow morning" |
| 1-6 hours | `--coral` | "Ends in 3 hours" |
| < 1 hour | `--coral` + pulse animation | "Ending very soon" |

The pulse animation for the final urgency state: `opacity` oscillates between 1 and 0.6 over 1.5s, infinite, `ease-in-out`.

### Pool Fill Celebration

When a pool reaches its target (100% filled):
1. Progress bar fill animates to 100% and turns `--forest`.
2. A confetti burst triggers from the progress bar center (CSS confetti using multiple small `div` elements with randomized `@keyframes` -- no library).
3. The "X of Y joined" text changes to "Pool filled!" in Inter Bold 16px `--forest`.
4. If the user is a participant, the sticky CTA changes to "Pool filled! Order processing..." with a subtle spinner.

---

## 8. Complete User Journeys

### Journey A: New User Discovers Product, Buys Instantly

**Screen 1: Landing Page (`/`)**
User arrives via a link or direct visit. Sees the social commerce landing page with value proposition. Taps "Start shopping" CTA.

**Screen 2: Discover Feed (`/discover`)**
- Location is auto-detected or defaulted to "Lagos" with a prompt to set area.
- User sees the category filter bar, the featured product card, and the 2-column product grid.
- User scrolls, sees a variety of products with both retail and pool prices.
- User taps on "Mama Nkechi's Jollof Rice" (standard product card).

**Screen 3: Product Detail (`/product/abc123`)**
- Hero image loads (300px).
- Price card shows: ₦2,500 retail, ₦1,375 pool price with "You save ₦1,125 (45%)".
- Two active pools are listed below.
- Sticky bottom bar shows: [Buy Now ₦2,500] and [Start Pool ₦1,375].
- User decides they want it now. Taps "Buy Now".

**Screen 4: Cart (`/cart`)**
- Jollof Rice appears in the "INSTANT BUY" section.
- Price breakdown: Subtotal ₦2,500, Service fee ₦150, Delivery Free (first order).
- Total: ₦2,650.
- User taps "Pay ₦2,650".

**Screen 5: Auth Bottom Sheet (appears over cart)**
- "Enter your phone number to continue" -- Inter Semibold 16px.
- Phone input with +234 prefix, auto-keyboard.
- User enters phone, taps "Send OTP".
- OTP input appears (4-6 digit), user enters code.
- Authentication completes, bottom sheet dismisses.

**Screen 6: Paystack Checkout (external)**
- Paystack payment page opens.
- User pays with card/bank transfer/USSD.

**Screen 7: Order Confirmation**
- Full-screen celebration:
  - Green checkmark in 64px circle.
  - "Order confirmed!" -- Outfit Bold 22px.
  - Order code: "CHD-7829" in Inter Bold 16px `--coral`.
  - "Your Jollof Rice is on its way."
  - Estimated delivery time.
  - [Track order] button and [Continue shopping] text link.

### Journey B: User Creates a Pool, Shares It, Pool Fills

**Screen 1: Discover Feed (`/discover`)**
User browses the feed, spots "Samsung Galaxy Buds3" in the grid. Notices:
- Retail: ₦45,000
- Pool: ₦29,250
- "Save 35%" green pill on the image.
User taps the card.

**Screen 2: Product Detail (`/product/xyz789`)**
- Hero image of the Galaxy Buds3.
- Price card: ₦45,000 retail, ₦29,250 with 10 people, save ₦15,750 (35%).
- No active pools exist for this product yet.
- Sticky CTA shows: [Buy Now ₦45,000] and [Start Pool ₦29,250].
- User taps "Start Pool".

**Screen 3: Create Pool Bottom Sheet (slides up over product detail)**
```
+------------------------------------------+
|  Start a pool                            |  Outfit Bold 20px --text
|                                          |
|  Product: Samsung Galaxy Buds3           |  Inter Regular 14px --text-secondary
|  Target: 10 people                       |
|  Pool price: ₦29,250 each               |
|  Deadline: 5 days from now               |
|                                          |
|  [optional: change area]                 |
|  Area: Lekki Phase 1                     |
|                                          |
|  You'll join automatically and pay       |
|  ₦29,250 now. If the pool doesn't       |
|  fill, you get a full refund.            |  Inter Regular 13px --text-secondary
|                                          |
|  [Create pool & pay ₦29,250         →]   |  Split-label button, --coral
+------------------------------------------+
```

- Bottom sheet with drag handle at top.
- Clear summary of what happens.
- Single CTA at the bottom.
- User taps "Create pool & pay ₦29,250".

**Screen 4: Auth (if needed) + Paystack Payment**
Same as Journey A.

**Screen 5: Pool Created Success**
```
(center-aligned -- celebration screen)

[Coral circle with rocket/lightning icon]

Pool started!
Share it to get 9 more people.

[Large WhatsApp share button]
"Share on WhatsApp"

[Copy link]

Your pool: chopdrop.ng/pool/galaxy-buds-lekki
```

- The WhatsApp button is the dominant CTA. The entire purpose of this screen is to get the user to share.
- The share message is pre-composed: "I just started a pool for Samsung Galaxy Buds3 on ChopDrop -- ₦29,250 instead of ₦45,000! 9 more people needed: chopdrop.ng/pool/galaxy-buds-lekki"
- User taps WhatsApp share. WhatsApp opens. They send to 3 group chats.

**Screen 6: Pool Detail (`/pool/galaxy-buds-lekki`) -- User Returns**
User returns to the app hours later. Navigates to "Pools" tab or gets a push notification "3 people joined your pool!"
- Progress bar: 4 of 10 (40%), `--gold` fill.
- 4 avatars visible.
- "6 more to unlock the group rate."
- "Ends in 4 days."
- Share CTA still prominent.

**Screen 7: Pool Fills (notification + revisit)**
User gets push: "Your Galaxy Buds3 pool is full! Order processing."
Opens the pool page:
- Progress bar: 10 of 10 (100%), `--forest` fill.
- "Pool filled!" celebration state.
- "Your order is being processed. We'll notify you with tracking details."

### Journey C: User Receives WhatsApp Link, Joins Pool

**Screen 1: WhatsApp**
User sees a message in their office WhatsApp group:
"I just started a pool for Samsung Galaxy Buds3 on ChopDrop -- ₦29,250 instead of ₦45,000! 7 more people needed: chopdrop.ng/pool/galaxy-buds-lekki"

The link shows an OG preview: product image, "Galaxy Buds3 Pool -- ₦29,250 (was ₦45,000) -- 7 spots left".

User taps the link.

**Screen 2: Pool Detail (`/pool/galaxy-buds-lekki`) -- Non-Authenticated**
This is the exact same page described in Section 3 above. The user is NOT logged in. They see:
- Hero product image.
- Price card: ₦45,000 struck-through, ₦29,250 in bold green.
- Dark progress card: 3 of 10 joined, 7 spots left.
- Avatar stack showing 3 participants.
- "How pools work" accordion (expanded for first-time visitors -- detected via localStorage).
- WhatsApp share section.
- Sticky CTA: "Join for ₦29,250".

Everything is visible and comprehensible WITHOUT being logged in. No gates, no "sign up to see the price" walls.

User taps "Join for ₦29,250".

**Screen 3: Auth Bottom Sheet**
Slides up over the pool page. The pool page is still visible underneath (the sheet covers ~60% of the screen).
- "Enter your phone to join" -- Outfit Semibold 16px.
- Phone input + OTP flow (same as Journey A, Screen 5).
- After auth, the sheet auto-transitions to payment.

**Screen 4: Paystack Payment**
Opens inline or redirects. User pays ₦29,250.

**Screen 5: Join Success (replaces pool page body)**
- "You're in!" celebration screen (described in Section 3 above).
- WhatsApp share button: "Tell friends, fill it faster" -- the share message now says "I just joined..." instead of "I just started...".
- "View my pools" link navigates to `/pools` filtered to "My pools".

**Screen 6: Waiting State**
User goes about their day. Over the next 2 days:
- Push notification: "2 more people joined your Galaxy Buds3 pool. 5 of 10 now."
- Push notification: "Almost there! 9 of 10 in the Galaxy Buds3 pool. 1 spot left."
- Final push: "Pool filled! Your Galaxy Buds3 order is confirmed. Delivery details coming soon."

**Screen 7: Pool Completion (revisit)**
User opens the app, goes to Pools tab. Their pool card shows:
- Green progress bar at 100%.
- "Pool filled!" badge.
- "Order processing" status.
- Eventually: delivery tracking or pickup instructions.

---

## Appendix: Component Inventory

All new components that need to be built:

| Component | File Path | Used On |
|---|---|---|
| ProductCard (grid) | `src/components/product-card.tsx` | `/discover` |
| ProductCardFeatured | `src/components/product-card-featured.tsx` | `/discover` |
| PoolSpotlightCard | `src/components/pool-spotlight-card.tsx` | `/discover` |
| PoolCard | `src/components/pool-card.tsx` | `/pools`, `/product/[id]` |
| PoolProgressBar | `src/components/pool-progress-bar.tsx` | Pool cards, pool detail |
| PoolAvatarStack | `src/components/pool-avatar-stack.tsx` | Pool cards, pool detail |
| PriceDisplay | `src/components/price-display.tsx` | Product detail, pool detail |
| SplitLabelButton | `src/components/split-label-button.tsx` | All CTAs |
| CategoryFilterBar | `src/components/category-filter-bar.tsx` | `/discover` |
| AreaPicker (bottom sheet) | `src/components/area-picker.tsx` | Header, `/pools` |
| CreatePoolSheet | `src/components/create-pool-sheet.tsx` | `/product/[id]` |
| SearchOverlay | `src/components/search-overlay.tsx` | `/discover` |
| WhatsAppShareButton | `src/components/whatsapp-share.tsx` | Pool detail, success screens |
| ConversationalTimer | `src/components/conversational-timer.tsx` | Pool cards, pool detail |
| CartItemInstant | `src/components/cart-item-instant.tsx` | `/cart` |
| CartItemPool | `src/components/cart-item-pool.tsx` | `/cart` |
| BottomNav (updated) | `src/components/bottom-nav.tsx` | All pages |

---

## Appendix: Page File Mapping

| Page | File | Phase |
|---|---|---|
| `/discover` | `src/app/discover/page.tsx` | 1 |
| `/product/[id]` | `src/app/product/[id]/page.tsx` | 1 |
| `/pool/[slug]` | `src/app/pool/[slug]/page.tsx` | 2 |
| `/pools` | `src/app/pools/page.tsx` | 2 |
| `/cart` (updated) | `src/app/cart/page.tsx` | 1 (instant), 2 (pool items) |

---

## Appendix: Design System Deltas from Current Codebase

The existing deals page (`/deals`) and deal detail page (`/deals/[id]`) use a "dark drop zone" aesthetic with `--dark` backgrounds for the card list area. The new social commerce pages should NOT use this pattern for the main feed. Reserve `--dark` backgrounds for:
1. The pool progress section on `/pool/[slug]` (the urgency engine).
2. Pool spotlight cards interspersed in the discover feed.
3. One "bold dark section" per page max (per the PiggyVest design pattern).

The existing deals page also uses `rounded-full` for buttons and badges. The pivot must correct this to:
- `rounded-[12px]` for action buttons (per design system: "NO pill-shaped buttons").
- `rounded-full` is acceptable ONLY for tag pills, filter pills, avatar circles, and small badges.

The existing code uses `--coral: #E8604C`. The design system mandates `--coral: #C4572A` (terracotta). This is a meaningful visual shift -- from a bright orangey-coral to a deeper, earthier terracotta. All new components must use the canonical value. The CSS variable update should happen as a Phase 0 prerequisite.