# ChopDrop — TODO

## Critique Fixes (Discover page — 29/40)

- [ ] **P1**: Add WhatsApp share icon on featured pool card
- [ ] **P1**: Add 1-line pooling explainer below section header ("Join before it fills. Everyone pays less.")
- [ ] **P2**: Hide "Pickup TBD" when location unset — show "Set area to see pickup" instead
- [ ] **P2**: Reduce featured card image 220px → 180px so compact cards peek on small phones
- [ ] **P3**: Add aria-labels on icon-only buttons (cart, location, search)
- [ ] **P3**: Add WhatsApp share to compact pool cards too

## Features to Build

### Vendor/Store Page Redesign (ChopChop Figma — Images 93-95)
- [ ] Vendor profile header: avatar, name, location, rating, review count, pools completed
- [ ] Vendor quote/description
- [ ] "Chop together first" — active pools section with featured card + Jump In CTA
- [ ] "The full menu" — category-filtered meal list (All meals, Rice, Swallows, Beans)
- [ ] Menu items: image, name, description, individual price, "Request Pool" CTA
- [ ] Demand signal per item: "12 students want a pool · 8 more to notify [vendor]"
- [ ] Review section: verified order reviews with photo + stars
- [ ] Trust copy: "Campus pickup only · Wait for vendor's ready alert"

### Phase 1 — Core Loop (make one purchase work end-to-end)
- [ ] Vendor pool creation — vendors create deals with prices, min orders, deadlines
- [ ] Pickup point on Pool model — users know where to collect
- [ ] Pool detail live join feed — "Tunde joined 1 min ago" (polling on focus)
- [ ] Post-pickup photo review prompt (Rating model exists, no UI)
- [ ] Solo buy flow — instant purchase at retail price with working checkout

### Phase 2 — Retention
- [ ] Push notifications (pool filling, food ready, beg clicks)
- [ ] Reorder flow
- [ ] Rewards system — scratch cards, streaks, points (page shell built)
- [ ] Demand voting page ("Tell the kitchens" — Craving card leads here)

### Phase 3 — Social
- [ ] Crews/Gangs — persistent social groups with invite links
- [ ] Gang pool views — "4 from Block C Foodies are in"
- [ ] Members + Activity tabs on pools page (placeholders built)

### Cleanup
- [ ] Remove legacy captain-dashboard.tsx + captain/[slug] route
- [ ] Remove legacy Deal/DealParticipant/DealCollectionPoint models
- [ ] Remove legacy Meal/DailyMenu/TimeSlot system + /menu route
- [ ] Remove storePoolCount() simulated badges from any remaining pages

## Design System Reference
- Colors: see globals.css (ChopDrop v9 — ChopChop tokens)
- Typography: Bricolage Grotesque 800 (display), Inter (body)
- Spacing: 22px card radius, 16px photo radius, 28px hero radius, 7px/9px progress bars
- Flat separation: no shadows, no gradients. Fills + borders + typography only.
