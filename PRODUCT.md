# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone in Lagos, Nigeria who buys food, electronics, fashion, or groceries — from Gen Z teens to young professionals to families. The common thread: they want to save money and they're comfortable with mobile-first social apps. Primary device is a smartphone; primary context is ordering food during the day or shopping for deals.

## Product Purpose

ChopDrop makes buying together the default. Users browse stores, find products, and either buy solo at full price or join/start a group buy with other people nearby to unlock 15-35% discounts. More people join = lower price for everyone. Success means users habitually check ChopDrop before buying anything, because the group price is always better than buying alone.

## Positioning

Two things no Lagos competitor can truthfully copy:

1. **Group buying mechanics on every product** — every item has a retail price and a group price. The price drops as more people join. Chowdeck, Glovo, and Jumia sell to individuals; ChopDrop sells to groups.
2. **Social shopping layer** — users see what others are buying in real time, join active groups, share pool links on WhatsApp, and watch prices drop. It's not a catalog with a discount; it's a social experience where participation is the product.

## Operating Context

- Users order food during work hours (10am-2pm peak) and shop for electronics/fashion/groceries throughout the day
- Pool links shared primarily via WhatsApp groups (office groups, friend groups, family groups)
- Delivery to office collection points or home addresses
- Payment via Paystack (cards, bank transfers, USSD)
- Nigerian Naira (₦), prices stored in kobo (smallest unit)

## Capabilities and Constraints

- Categories: Food, Electronics, Fashion, Groceries (expandable)
- Store-first discovery: users browse stores, then products within stores
- Pool system: join existing groups or start new ones; pool fills → everyone pays group price; doesn't fill → full refund
- Auth: phone + OTP via Termii
- Images: Cloudinary CDN
- Database: PostgreSQL via Neon, Prisma 7 ORM
- Hosting: Vercel auto-deploy on push to master
- Mobile-first: max-width 480px, centered on desktop
- PWA: installable, service worker registered

## Brand Commitments

Nothing locked. Name, colors, typography, and visual identity are all open to change.

## Evidence on Hand

- Seed data with 5 named Lagos stores, 22 products with Unsplash food photography
- Simulated social proof (ratings, order counts, pool activity) — not real user data
- No real testimonials, reviews, or case studies exist yet
- No logo or brand assets beyond the "ChopDrop" wordmark in Outfit font

## Product Principles

1. **Buying together is the default, not a feature** — group pricing is not a discount layer; it's how the product works
2. **Show activity, not explanations** — users learn pooling by seeing others do it, not by reading how-it-works sections
3. **Every price tells a story** — solo vs group price on every product communicates the value without a single word of copy
4. **Zero-risk participation** — if a group doesn't fill, full refund. No lock-in, no penalty, no risk
5. **Lagos energy** — vibrant, confident, social. Not corporate, not minimal, not austere

## Accessibility & Inclusion

WCAG 2.2 AA target. 4.5:1 contrast minimum for text. 44px minimum touch targets on mobile. prefers-reduced-motion respected. Nigerian English copy (not American, not British).
