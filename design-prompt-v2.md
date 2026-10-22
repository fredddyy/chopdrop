# ChopDrop — Design Prompt v2 (The UI/UX Director's Blueprint)

## THE UX MANIFESTO: DEFEATING THE AI DEFAULT

This document defines the strict, human-centric design system for ChopDrop. When generating UI components or code, do not default to standard AI design tropes.

Mirror the typographic confidence, negative space mastery, and architectural discipline of **Paystack, Chowdeck, and Piggyvest**.

## BRAND DNA

### Paystack's Typographic Tension
* Extreme scale contrast — heavy data anchors adjacent to whisper-light metadata
* Whitespace sovereignty — major sections breathe immensely
* Restrained highlights — accent colors as precious commodities

### Chowdeck's Food-Forward Sensory Rhythm
* Hero images — cards architected around photography, not text blocks
* Asymmetric visual balance — left-aligned labels paired with right-aligned values
* Bottom-sheet logic — secondary modifications offloaded to tactile sheets

### Glovo's Conversational Urgency
* Humanized friction — natural descriptive phrases, not robotic countdowns
* Frictionless social proof — micro-copy indicators blended into surfaces

## THE MASTER PALETTE

```
Page Background    #FAF7F2     Warm cream canvas. Never white, never cool gray.
Surface Card       #FFFFFF     Pure white. Zero box-shadows. Border contrast only.
Surface Border     #E8E2DA     Warm sand (1px). Never cool grays.
Primary Accent     #C4572A     Terracotta. Max 3-4 elements per viewport.
                               Hover: #A8471F
Monetary Success   #1A7D4B     Forest green. Savings, discounts, cash saved.
Honorific Token    #D4A24E     Warm gold. Captain badges, tier achievements.
Text Primary       #2D2A26     Warm charcoal. Never pure black.
Text Secondary     #6B6560     Medium warm gray.
Text Tertiary      #9C9590     Light warm gray. Whispers.
```

## TYPOGRAPHY MATRIX

```
Header Context       Plus Jakarta Sans | Semibold | 17px | #2D2A26
Pool Countdown       Inter | Semibold | 15px | #2D2A26
Vendor Heading       Plus Jakarta Sans | Semibold | 17px | #2D2A26
Cuisine Subtitle     Inter | Regular | 13px | #9C9590
Anchor Price         Inter | Bold | 20px | #2D2A26 | tabular-nums
Struck Price         Inter | Regular | 14px | #9C9590 | line-through
Savings Metric       Inter | Bold | 22px | #1A7D4B
Macro Savings        Inter | Bold | 32px | #1A7D4B
Form Group Label     Inter | Semibold | 12px | uppercase | tracking 0.1em
Navigation Label     Inter | Medium | 11px | Active: #C4572A
```

### Ironclad Rules:
1. Avoid uniform sizing. Stark scale shifts (11px descriptor above 22px number).
2. All monetary values use font-variant-numeric: tabular-nums.

## COMPONENT ATOMICS

### Vendor Card
* 160px top food photo, full-bleed
* Vendor name overlaid on photo with dark gradient scrim
* Rating badge: pill on photo, rgba(0,0,0,0.5) background
* Discount badge: top-right on photo, #1A7D4B background
* Below photo: cuisine tags, progress bar (6px, color-coded), price + CTA
* Price is bold 20px left-aligned — the card's visual anchor

### Split-Label Action Button
* 50px height, 12px border-radius
* Text left-aligned, price right-aligned within bounds
* Background: #C4572A, press: #A8471F + scale(0.98)

### Tier Progress Bar
* 6px height, flat solid fills
* States: Gray → Gold → Terracotta → Forest Green
* Adjacent text: "3 more → 20% off" in tier color, 13px

### Quick Reorder Card
* 3px solid #C4572A left border (signature detail)
* "⚡ Your usual" heading
* Component list, not combo name
* Split: price left, [Reorder] button right

### Bottom Navigation
* White bg, 1px #E8E2DA top border
* 22px outline icons, 1.5px stroke
* Labels: Pool | My Plate | Orders | Me
* Active: #C4572A fill + 4px dot indicator
* Invisible infrastructure — if someone notices it, it's over-designed

## AI ANTI-PATTERNS (ZERO TOLERANCE)

* NO box-shadows anywhere
* NO gradients anywhere
* NO cool grays (#F5F5F5, slate, zinc)
* NO uniform font weights
* NO pill-shaped buttons (use 12px radius)
* NO emoji as food icons
* NO digital countdown timers (use "21 min left")
* NO skeleton loading screens
* NO center-aligned body text
* NO identical card heights
* NO data shown twice on same viewport
* NO wrapping every text in badge pills
