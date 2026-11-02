# ChopDrop Pivot Plan: Pinduoduo + Groupon Social Commerce

**Created:** 2026-11-02
**Status:** Planning — awaiting confirmation to start Phase 1

---

## The Shift

**Current:** Office lunch ordering with volume discounts
**New:** Social commerce — browse items, buy full price OR create/join pools for group discounts

Users can:
1. **Pay full price** — instant purchase, no waiting
2. **Create a pool** — start a group buy, set a target, share with friends via WhatsApp
3. **Join an existing pool** — see active pools near them, join to unlock group price

---

## Phase 1: Product Catalog + Instant Buy (MVP)

**Goal:** Users can browse products and buy at full price. App is useful without pools.

| Step | What | Files | Risk |
|------|------|-------|------|
| 1.1 | Add `Product` + `InstantOrder` models | `prisma/schema.prisma` | Low |
| 1.2 | Admin product CRUD API | `src/app/api/admin/products/**` | Low |
| 1.3 | Public product listing API (search, filter, paginate) | `src/app/api/products/**` | Low |
| 1.4 | `/discover` page — product feed with categories + search | `src/app/discover/page.tsx`, `src/components/product-card.tsx` | Medium |
| 1.5 | `/product/[id]` — detail with "Buy Now" + "Start Pool" CTAs | `src/app/product/[id]/page.tsx` | Medium |
| 1.6 | Instant-buy checkout (Paystack) | `src/app/api/instant-orders/**`, modify `src/lib/cart.tsx` | Medium |
| 1.7 | Webhook handles `instant_` payment refs | `src/app/api/payments/webhook/route.ts` | **High** |
| 1.8 | Bottom nav: Discover, Pools, Cart, Me | `src/components/bottom-nav.tsx` | Low |
| 1.9 | Rewrite landing page for social commerce | `src/app/page.tsx` | Medium |

---

## Phase 2: Pool System (Core Innovation)

**Goal:** Users can create pools, share them on WhatsApp, others join. Payment escrow on join, refund if pool doesn't fill.

| Step | What | Files | Risk |
|------|------|-------|------|
| 2.1 | Add `Pool`, `PoolParticipant`, `PoolCollectionPoint` models | `prisma/schema.prisma` | Low |
| 2.2 | Pool creation API (auto-slug, deadline, creator auto-joins) | `src/app/api/pools/route.ts` | Medium |
| 2.3 | Pool join API with Paystack escrow | `src/app/api/pools/[slug]/join/route.ts` | **High** |
| 2.4 | `/pool/[slug]` — shareable detail page with OG tags | `src/app/pool/[slug]/page.tsx` | **High** |
| 2.5 | `/pools` — "Pools near you" with area filter | `src/app/pools/page.tsx` | Medium |
| 2.6 | Cron: pool lifecycle (expire→refund, fill→confirm) | `src/app/api/cron/pool-lifecycle/route.ts` | **High** |
| 2.7 | Webhook handles `pool_` refs + refunds | `src/app/api/payments/webhook/route.ts` | **High** |
| 2.8 | WhatsApp deep links with OG meta previews | Pool page `generateMetadata`, `src/lib/share.ts` | Medium |
| 2.9 | Push notifications (filling, filled, expired) | `src/lib/notifications.ts` | Low |

---

## Phase 3: Migration + Vendor Self-Service

- Migrate existing `Meal` data → `Product` catalog
- Legacy `/menu` keeps working during transition
- Vendor dashboard for self-service product management (`src/app/vendor/**`)
- Area-based pool discovery (string matching, not GPS)
- Progressive pool pricing with credit refunds (reuse CreditWallet)
- Remove legacy code once migration complete

---

## Phase 4: Growth

- Referral system (share pool → friend joins → you get credit)
- Pool templates for popular products ("One-tap pool")
- Analytics dashboard for admin
- Push notification optimization (timing, WhatsApp nudges)

---

## Database Schema: New Models

### Product (replaces Meal as central item)
```
id, vendorId, name, description, imageUrl
category (Food/Electronics/Fashion/Groceries)
subcategory, retailPrice (kobo), groupPrice (kobo)
minPoolSize, poolTiers (JSON), maxQuantity
isActive, sortOrder, tags, createdAt, updatedAt
```

### Pool (evolves from Deal)
```
id, productId, creatorId, slug (unique, shareable)
targetSize, currentPrice (kobo), deadline
status (OPEN/FILLING/FILLED/COMPLETED/EXPIRED/CANCELLED)
areaName, zoneId, pickupInfo, createdAt, updatedAt
```

### PoolParticipant (evolves from DealParticipant)
```
id, poolId, userId, quantity, priceLocked (kobo)
totalAmount (kobo), paymentRef, paymentStatus
collectionPointId, refundAmount, refundStatus
paidAt, createdAt
@@unique([poolId, userId])
```

### InstantOrder (full-price purchases)
```
id, orderCode, productId, userId, quantity
unitPrice (kobo), totalAmount (kobo)
deliveryAddress, deliveryFee, serviceFee
paymentRef, paymentStatus, status
paidAt, createdAt
```

---

## What Stays / Changes / New

### Stays (reuse as-is)
- Auth system (JWT, PIN login)
- Paystack integration
- Image upload, push notifications
- Design system ("Warm Editorial Realism")
- CreditWallet/CreditTransaction models
- Zone model

### Changes
- Cart → supports instant-buy + pool items
- Webhook → handles `instant_`, `pool_`, `chopdrop_` refs
- Bottom nav → Discover, Pools, Cart, Me
- Landing page → social commerce pitch

### New
- Product model + catalog
- Pool system (create, join, lifecycle, refunds)
- Discovery feed (`/discover`)
- Pool detail page (`/pool/[slug]`)
- Instant order flow
- Vendor dashboard (Phase 3)
- WhatsApp share deep links with OG meta

---

## Top Risks

1. **Payment escrow** — Users pay on pool join, need refund if pool expires. Paystack refunds take 5-10 days. Mitigation: offer in-app credit as instant refund.
2. **Cold start** — No pools on day 1. Mitigation: Phase 1 ships instant-buy first, admin seeds pools.
3. **Pool fill rate** — Pools expiring kills trust. Mitigation: small targets (5-10), progressive pricing.
4. **Existing users disrupted** — Mitigation: legacy routes work through Phase 3.

---

## New API Routes

### Phase 1
```
GET  /api/products          — list (public, filterable)
GET  /api/products/[id]     — detail
POST /api/instant-orders    — create order + Paystack
GET  /api/instant-orders/[code] — status
POST /api/admin/products    — create (admin)
GET  /api/admin/products    — list (admin)
PATCH /api/admin/products/[id] — update (admin)
```

### Phase 2
```
POST /api/pools             — create a pool
GET  /api/pools             — list active (filterable)
GET  /api/pools/[slug]      — pool detail
POST /api/pools/[slug]/join — join + Paystack escrow
GET  /api/pools/nearby      — pools near user's area
GET  /api/cron/pool-lifecycle — manage expiry/fill/refund
```

---

## New Pages

| Route | Purpose | Phase |
|-------|---------|-------|
| `/discover` | Product discovery feed | 1 |
| `/product/[id]` | Product detail + buy/pool CTAs | 1 |
| `/pools` | Active pools listing | 2 |
| `/pool/[slug]` | Pool detail + join (shareable) | 2 |
| `/vendor/*` | Vendor self-service | 3 |
