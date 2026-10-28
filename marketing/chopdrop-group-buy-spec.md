# ChopDrop — "Chop Together" (Group Buy Feature)

## The Concept

Restaurants post special dishes with tiered pricing that drops as more people order. Users see a live counter, a countdown timer, and the current price tier. The more people join, the cheaper everyone's meal gets. Window closes at a set time — after that, everyone gets charged at whatever tier the group reached.

This turns ordering from a solo act into a social event.

---

## How It Works

### For the restaurant:
1. Restaurant (via ops dashboard) creates a Group Buy deal
2. Sets: dish name, base price, tier thresholds + prices, minimum orders, time window
3. Example:
   - Peppered Goat Meat
   - Base price: ₦4,500
   - Tier 1 (10+ orders): ₦3,500
   - Tier 2 (20+ orders): ₦2,800
   - Tier 3 (30+ orders): ₦2,200
   - Minimum to proceed: 10 orders
   - Window: 7:00 AM – 10:00 AM

### For the user:
1. Opens ChopDrop, sees "Chop Together" section on menu page
2. Sees the deal: dish, current price, next tier, how many more people needed, countdown
3. Taps "Join" — enters the group buy (not charged yet)
4. Shares to WhatsApp/office group to recruit more people
5. Watches the counter climb and price drop in real-time
6. When window closes:
   - If minimum met → everyone is charged at the final tier price
   - If minimum NOT met → nobody is charged, everyone is notified "Didn't reach minimum. Try again tomorrow!"

### The key insight:
**Users are not waiting passively.** They are actively recruiting colleagues because every person they bring in makes their OWN meal cheaper. The user becomes your salesperson.

---

## UI Design — Menu Page Integration

### Where it appears:

Between the promo banner and the regular menu items. A new section:

```
┌─────────────────────────────────────────┐
│  🔥 CHOP TOGETHER                       │
│  Join the group buy. More people =      │
│  cheaper food.                          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │  [food image — wide, 160px]     │    │
│  │                                 │    │
│  │  Peppered Goat Meat             │    │
│  │  Ajisafe Pepper Rice            │    │
│  │                                 │    │
│  │  ₦2,800  ̶₦̶4̶,̶5̶0̶0̶               │    │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░  14/20      │    │
│  │                                 │    │
│  │  🕐 Closes in 1h 23m            │    │
│  │  6 more people → ₦2,200 each   │    │
│  │                                 │    │
│  │  [  Join this deal  ]  [ Share ]│    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### The card anatomy:

1. **Food image** — wide landscape, appetizing
2. **Dish name + restaurant** — clear identification
3. **Current price** (large, coral) + ~~original price~~ (strikethrough)
4. **Progress bar** — visual, shows current tier, fills as people join
5. **Counter** — "14/20" — how many joined vs next tier
6. **Countdown** — "Closes in 1h 23m" — urgency
7. **Next tier teaser** — "6 more people → ₦2,200 each" — the carrot
8. **Two buttons:**
   - "Join this deal" (coral, primary)
   - "Share" (outline, secondary) — opens share sheet with pre-written message

### Progress bar tiers (visual):

```
When at 14 out of 30 max:

₦3,500          ₦2,800         ₦2,200
  10 ━━━━━━━━━━━━ 20 ─────────── 30
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ░░░░░░░░░░░░░ ░░░
                 ↑
            YOU ARE HERE
         "6 more → next tier"
```

The progress bar shows ALL tiers so users can see exactly how close they are to the next price drop. Each unlocked tier is coral, upcoming tiers are grey.

---

## The Share Mechanic (Viral Loop)

When a user taps "Share," generate a pre-written message:

```
WhatsApp share text:

🔥 Peppered Goat Meat for ₦2,800 (normally ₦4,500)

14 people already joined. 6 more and the price drops to ₦2,200!

Join before 10 AM → chopdrop-app.vercel.app/menu

The more people who join, the cheaper it gets for everyone 👀
```

This is the viral loop:
1. User joins deal (self-interest: cheaper food)
2. User shares to get more people (self-interest: price drops for THEM)
3. New users join (self-interest: cheap food)
4. They share too
5. Repeat until window closes

The user is doing your marketing for you because it's in THEIR financial interest.

---

## Database Schema Addition

```prisma
model GroupBuy {
  id            String    @id @default(cuid())
  restaurantId  String
  name          String    // "Peppered Goat Meat"
  description   String?
  imageUrl      String?
  basePrice     Int       // kobo — full price before any discount
  tiers         Json      // [{min: 10, price: 350000}, {min: 20, price: 280000}, {min: 30, price: 220000}]
  minOrders     Int       // minimum to proceed (usually = first tier)
  maxOrders     Int?      // cap (optional)
  windowStart   DateTime
  windowEnd     DateTime
  status        String    @default("ACTIVE") // ACTIVE | SUCCEEDED | FAILED | CANCELLED
  currentOrders Int       @default(0)
  createdAt     DateTime  @default(now())

  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  entries       GroupBuyEntry[]
}

model GroupBuyEntry {
  id          String   @id @default(cuid())
  groupBuyId  String
  userId      String?
  customerName  String
  customerPhone String
  quantity    Int      @default(1)
  priceLocked Int?     // set when window closes — the final tier price
  paymentRef  String?
  paymentStatus String @default("PENDING") // PENDING | SUCCESS | FAILED | REFUNDED
  createdAt   DateTime @default(now())

  groupBuy    GroupBuy @relation(fields: [groupBuyId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])
}
```

---

## API Endpoints

```
GET  /api/group-buys/active
  → Returns active group buys with current order count and tier info

POST /api/group-buys/join
  → User joins a group buy (reserves spot, not charged yet)
  → Body: { groupBuyId, customerName, customerPhone, quantity }

GET  /api/group-buys/[id]/status  
  → Real-time status: current count, current tier, time remaining

POST /api/admin/group-buys
  → Create a new group buy (ops dashboard)

PUT  /api/admin/group-buys/[id]
  → Update / cancel a group buy

POST /api/group-buys/[id]/close
  → Called by cron or admin when window ends
  → If min met: charge everyone at final tier price via Paystack
  → If min not met: cancel all entries, notify users
```

---

## Payment Flow

This is different from regular orders because you DON'T charge immediately:

```
1. User joins       → Entry created, paymentStatus = "PENDING"
                      No Paystack charge yet.

2. Window closes    → System checks if minOrders met

3a. If YES (min met):
    → Calculate final tier price
    → Charge each entry via Paystack
    → Create regular Orders for fulfillment
    → Notify users: "Deal locked! You're paying ₦2,800"

3b. If NO (min not met):
    → Set status = "FAILED"  
    → Notify users: "Didn't reach 10 orders. No charge."
    → Clean up entries
```

**Alternative (simpler, for v1):**
Charge immediately at current tier price. If the tier improves by window close, refund the difference. This is simpler but involves partial refunds.

**Recommended for v1:**
Don't charge until window closes. Show a "reserved" state. This is cleaner and users feel safer joining.

---

## Notification System

```
When someone joins:
  → All existing participants see: "15th person just joined! 
     5 more and price drops to ₦2,200"
  (Real-time update on the card, or push notification)

30 minutes before close:
  → "Peppered Goat Meat closes in 30 mins. 
     You're at ₦2,800 — 6 more people gets you ₦2,200. 
     Share now!"

When window closes (success):
  → "DEAL LOCKED 🎉 Peppered Goat Meat — ₦2,800. 
     Arriving at 12 PM."

When window closes (failed):
  → "Didn't reach 10 orders this time. 
     No charge. Try again tomorrow!"
```

---

## What Makes This NOT Boring

| Boring version | Exciting version |
|---------------|-----------------|
| Static "10 minimum" text | Live counter climbing: "14... 15... 16!" |
| No urgency | Countdown timer: "1h 23m left" |
| No incentive to share | "Share with 6 more people and YOUR price drops ₦600" |
| Binary pass/fail | Tiered pricing — every person makes it better |
| Wait and check later | Real-time progress bar with tier markers |
| Generic product | Special dishes ONLY available through group buy |

### The killer detail:
**Some dishes should ONLY be available through Chop Together.** The restaurant won't cook peppered goat meat for 1 person — it's not worth their time. But for 20? Absolutely. This creates exclusivity: "You can't get this anywhere else. You can only get it if enough people want it."

That's not boring. That's FOMO.

---

## Example Group Buys to Launch With

| Deal | Base | Tier 1 (10) | Tier 2 (20) | Tier 3 (30) | Window |
|------|------|-------------|-------------|-------------|--------|
| Peppered Goat Meat + Rice | ₦4,500 | ₦3,500 | ₦2,800 | ₦2,200 | 7–10 AM |
| Asun + Jollof Special | ₦5,000 | ₦4,000 | ₦3,200 | ₦2,500 | 7–10 AM |
| Friday Suya Platter (sharing) | ₦8,000 | ₦6,000 | ₦4,500 | ₦3,500 | 7–11 AM |
| Small Chops Box (15 pieces) | ₦3,500 | ₦2,800 | ₦2,200 | ₦1,800 | 1–3 PM |

---

## The Name

Options:

| Name | Vibe |
|------|------|
| **Chop Together** | Collective, Nigerian, active. "We chop together, we save together." |
| **Group Buy** | Clear, global, understood. Less personality. |
| **Office Deal** | Direct, functional. Less exciting. |
| **The Drop** | Cool, exclusive. "Today's Drop: Peppered Goat for ₦2,200 if 30 of you want it." |
| **Squad Buy** | Fun, young, social. |
| **Bulk Up** | Play on "bulky" — still sounds wholesale though. |

**Recommendation: "Chop Together"** — it's Nigerian, it's social, it describes the mechanic, and it pairs with ChopDrop perfectly.
