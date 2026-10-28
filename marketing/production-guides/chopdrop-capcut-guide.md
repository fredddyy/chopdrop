# ChopDrop CapCut Video Guide

## What this guide is

A complete beginner's walkthrough for recreating the Glovo Kenya promo video as a ChopDrop-branded version in CapCut Desktop. You will upload the original Glovo video, then overlay ChopDrop text, logos, and content on top — keeping every original animation intact. No motion design skills needed. Total time: about 2 hours.

---

## Before you open CapCut

### Download CapCut Desktop

Go to capcut.com and download the free desktop app (Windows or Mac). The mobile app cannot do overlay replacement — you need Desktop.

### Gather your files

You need exactly 4 things on your desktop before starting:

1. **The Glovo video** — `WhatsApp Video 2026-10-16 at 6.21.34 PM.mp4` (the reference video you already have)
2. **ChopDrop logo PNG** — `public/icons/icon-512.png` from your project (512x512, coral teardrop with smile)
3. **A Lagos map screenshot** — open Google Maps, navigate to Victoria Island / Lekki area, take a screenshot, save as `lagos-map.png`
4. **Nigerian food photos** (optional) — `chopdrop-motion/app-capture/assets/ajisafe-pepper-rice.webp` and `the-place.jpg` from your project

### CapCut project settings

When you create a new project in CapCut:
- Set canvas to **16:9 Landscape**
- Set resolution to **1080p**
- Set frame rate to **30 FPS**

These match the Glovo video exactly (848x478 upscaled to 1080p).

---

## Step 1: Import the Glovo video

1. Open CapCut Desktop, click **New Project**
2. In the Media panel (top-left), click **Import** and select the Glovo MP4 file
3. Drag the video onto **Track 1** on the timeline (the bottom track)
4. The video is now your base layer — every animation plays from this layer, untouched

### The overlay strategy

You are NOT recreating animations. You are placing ChopDrop text and images ON TOP of the Glovo video at exact timestamps, covering the Glovo-specific content while the original animation plays underneath.

Think of it like putting stickers over a poster — the poster's design stays, you just cover the words and logos.

### Timeline orientation

The Glovo video is 18.87 seconds at 30fps. The timeline in CapCut shows seconds. You will be placing overlays at these key timestamps:

| Time | What to cover | What to place on top |
| --- | --- | --- |
| 0:00-0:02.8 | Glovo bag + "Glovo" text | ChopDrop icon + "ChopDrop" text |
| 0:02.8-0:06.2 | Search text + grocery icons | New search text (keep icons — they move too fast to replace) |
| 0:06.2-0:09.5 | Store names + "Select the store" | Restaurant names + "Pick your restaurant" |
| 0:09.5-0:12.0 | Cart items + KSh prices | Nigerian food + Naira prices |
| 0:12.0-0:14.0 | Address + map + delivery text | Lagos address + new delivery text |
| 0:14.0-0:18.9 | Glovo logo + @KREATIVELY.KE | ChopDrop outro |

Each section below tells you exactly what to do at each timestamp.

---

## Scene 1: Intro + Logo (0:00 — 0:02.8)

The "Introducing" text and yellow blur need no changes — they are generic. You only need to cover the Glovo logo.

### What to do

1. **Scrub to 0:01.3** — this is where the Glovo yellow bag icon appears center-screen
2. Click **Text > Add Text** in CapCut. Type nothing yet — you will use an image overlay instead
3. Click **Media > Import**, add your `icon-512.png` (ChopDrop logo)
4. Drag it onto **Track 2** above the video
5. **Set its start time** to `0:01.2` and **duration** to `1.6s` (it should end at `0:02.8`)
6. **Resize** the logo to match the Glovo bag size — about 120x132 pixels on screen. Use the preview canvas handles to scale it down
7. **Position** it exactly over the Glovo bag icon (center of screen, slightly left)
8. Add animation: select the logo clip, go to **Animation > In > Scale Up** with 0.3s duration

### Cover the "Glovo" wordmark

1. Click **Text > Add Text**
2. Type: **ChopDrop**
3. Set font to **Manrope** (if not available, use **Montserrat ExtraBold** — closest match)
4. Font size: **80px**, color: **#1C2B24** (dark green-ink), letter spacing: **-3**
5. Set start time to `0:02.0`, duration `0.8s`
6. Position it directly over where "Glovo" text appears — to the right of your ChopDrop logo
7. Add animation: **Typewriter** effect, speed fast

### Cover @KREATIVELY.KE watermark

1. This watermark appears throughout the entire video at the right side
2. Create a **solid rectangle** overlay: go to **Elements > Shape > Rectangle**
3. Color: match the background at each moment (white `#FFFFFF` for most scenes, dark for outro)
4. Position it over the watermark area (right side, middle)
5. Set duration: full video length (0:00 to 0:18.9)
6. You may need 2-3 rectangle overlays with different colors as the background changes

---

## Scene 2: Search + Icons (0:02.8 — 0:06.2)

The search bar and food icons are moving fast with a camera zoom — hard to overlay precisely. The strategy here is to cover only the TEXT inside the search bar.

### What to do

1. **Scrub to 0:03.5** — the search bar is visible with text being typed
2. The original text says "What do you want to order today?" — you want it to say "What's for lunch today?"
3. Since the text is typed character by character AND the camera is zooming, a text overlay won't track perfectly. **Two options:**
    - **Option A (easy):** Leave it as-is. "What do you want to order today?" is generic enough for ChopDrop. Move on to Scene 3.
    - **Option B (harder):** Add a text overlay "What's for lunch today?" at `0:04.2` (when the bar is zoomed out and fully visible), duration 0.8s, white text, font DM Sans 24px, positioned inside the search bar. Add **Fade In** animation 0.1s.
4. **The floating icons** — the shopping cart, lipstick, pharmacy icons zoom by too fast at this point to replace. Leave them. At normal playback speed nobody notices they aren't Nigerian food.

### Pro tip

Don't fight the camera zoom. The zoom makes everything blurry for 1-2 seconds. Let it pass and focus your overlays on the moments where things are STILL and readable.

---

## Scene 3: Store Selection (0:06.2 — 0:09.5)

This is the most important scene to get right — the store names are clearly visible for 3 seconds on a dark card.

### Cover the header

1. Scrub to `0:05.5` — the dark card has appeared with "Select the store" header
2. Add **Text**: type **Pick your restaurant**
3. Font: Manrope Bold, size 28px, color: **#F5C565** (amber/gold), center-aligned
4. Position over "Select the store" text at the top of the dark card
5. Start time: `0:05.2`, duration: `4.3s` (covers the whole card scene until exit)

### Cover the 5 store names (critical)

The original shows 5 Kenyan stores stacked vertically. You need to cover each name:

| Original text | Cover with | Position |
| --- | --- | --- |
| Carrefour | **Ajisafe Kitchen** | Row 1 — top of card |
| Java House | **The Place** | Row 2 |
| Naivas | **Mama T's Kitchen** | Row 3 |
| KFC | (cover with solid dark rectangle) | Row 4 |
| Big Square | (cover with solid dark rectangle) | Row 5 |

For each restaurant name:

1. Add **Text**, type the new name from the table above
2. Font: DM Sans SemiBold, size 22px, color: **#FFFFFF**
3. Position directly over the old store name
4. Start time: `0:05.4` (when row 1 appears), duration: `4.1s`
5. For rows 4 and 5 (KFC, Big Square): add a dark **Rectangle** shape, color `#1A1A1A`, sized to cover the entire row including the logo. This hides them completely.

### Cover the button

1. At the bottom of the card, "PURCHASE ITEMS" appears in a yellow button
2. Add **Text**: type **ORDER NOW**
3. Font: DM Sans ExtraBold, size 18px, color: **#19342d**
4. Position over "PURCHASE ITEMS"
5. Start time: `0:05.8`, duration: `3.7s`

### Cover the side text

1. At `0:06.7` text appears on the left: "Top restaurants and stores in Kenya"
2. Add **Text**: type **Top restaurants in Lagos**
3. Use two text layers — "restaurants" in color **#F05F4B** (coral), "in Lagos" in color **#F5C565** (amber)
4. Font: Manrope Bold, 48px
5. Start time: `0:06.5`, duration: `1.0s`

---

## Scene 4: Cart Items (0:09.5 — 0:12.0)

The cart card shows two food items with Kenyan restaurant names and KSh prices. Cover each.

### Item 1 — top row

1. Scrub to `0:08.2` — the cart card is fully visible
2. Cover the restaurant label "Big Square" with text: **Ajisafe Kitchen**, color **#F05F4B** (coral), font DM Sans 14px
3. Cover the item name "Paneer Tikka Square" with text: **Pepper Rice**, font DM Sans Bold 20px, color **#19342d**
4. Cover the price "KSh800.00" with text: **₦2,500**, font DM Sans SemiBold 16px, color **#666666**
5. All three text layers: start `0:08.0`, duration `1.2s`

### Item 2 — bottom row

1. Cover "Kentucky Fried Chicken" with text: **The Place**, color **#216c4e** (green), font DM Sans 14px
2. Cover "9 Piece Chicken Bucket" with text: **Jollof Rice + Chicken**, font DM Sans Bold 20px, color **#19342d**
3. Cover "KSh1,900.00" with text: **₦3,800**, font DM Sans SemiBold 16px, color **#666666**
4. All three text layers: start `0:08.0`, duration `1.2s`

### How to type the Naira sign ₦

On Windows: hold **Alt** and type **8358** on the numpad, then release Alt. Or copy-paste from here: **₦**

### The checkout button

The green "PROCEED TO CHECKOUT" button text is generic — it works for ChopDrop too. Leave it, or cover with **PAY WITH PAYSTACK** if you want.

---

## Scene 5: Address + Map (0:12.0 — 0:14.0)

### Cover the address bar text

1. Scrub to `0:09.5` — the address bar appears with "What's your address?" placeholder
2. Add **Text**: type **Enter your office code**, font DM Sans 22px, color **#19342d**
3. Position over the placeholder text inside the address bar
4. Start time: `0:09.4`, duration: `1.0s`

### Cover the typed address

1. At `0:10.4` the address "Royal Park Estat" is being typed
2. Add **Text**: type **Victoria Island Office**, font DM Sans 22px, color **#19342d**
3. Position in the same spot (over the address field)
4. Start time: `0:10.2`, duration: `0.8s`
5. Add **Typewriter** animation, 0.04s per character

### Cover the confirm button

1. The button says "Confirm" / "Confirm Location"
2. Add **Text**: type **Confirm Office**, font DM Sans SemiBold 16px, color **#216c4e**
3. Position over the button on the right side of the address bar
4. Start time: `0:09.4`, duration: `1.6s`

### Cover the delivery text

1. At `0:11.4` the text "Fast and secure delivery, at your doorstep" appears over the map
2. Add **Text**: type **Hot lunch, delivered to your desk**, font Manrope ExtraBold 44px, color **#19342d**
3. Position center-screen over the original text
4. Start time: `0:11.2`, duration: `1.0s`

### Cover the delivery stats

1. The bottom-left shows "12 min" and "9.7 km"
2. Add **Text**: type **Arrives by 12:00 PM · 4.2 km**, font DM Sans Bold 20px, color **#19342d**
3. Position over the stats tag
4. Start time: `0:11.4`, duration: `0.8s`

### The map itself

The map shows Nairobi, Kenya (Kibera, Langata area). To replace it properly you would need to mask the entire map area and place a Lagos screenshot behind it. This is the hardest single swap. Two options:

- **Option A (skip it):** The map is on screen for about 1.5 seconds, zoomed in, with text overlaid on top. Most viewers won't recognize it as Nairobi. Focus your effort on the text overlays above — they are what people read.
- **Option B (full replace):** Take a Google Maps screenshot of Victoria Island, Lagos. Import it as an image overlay on Track 3. Position it over the map area. Start time: `0:10.9`, duration: `1.3s`. Resize to cover the map. Add a short **Fade In** animation (0.2s). The text overlays go on Track 4 above it.

---

## Scene 6: Outro (0:14.0 — 0:18.9)

The outro is the easiest scene to replace because you can cover the entire screen with a solid overlay.

### Option A: Full screen replacement (recommended)

1. **Split the video** at `0:14.0` — right-click the video clip on the timeline, choose **Split**
2. On the second half (0:14.0 onward), add a **full-screen rectangle overlay** on Track 2:
    - Go to **Elements > Shape > Rectangle**, color **#19342d** (ChopDrop dark green)
    - Resize to fill the entire canvas
    - Start time: `0:14.2`, duration: `4.7s` (to end of video)
    - Add **Fade In** animation, 0.3s
3. On Track 3 above it, add the **ChopDrop logo** (`icon-512.png`):
    - Position: center-top, about 25% from the top
    - Size: about 160x176px
    - Start time: `0:14.6`, duration: `4.3s`
    - Animation: **Scale Up** (0.3s, bounce feel)
4. On Track 4, add **Text**: **ChopDrop**
    - Font: Manrope ExtraBold, 72px, color **#F05F4B** (coral)
    - Position: center, below the logo (about 52% from top)
    - Start time: `0:14.9`, duration: `4.0s`
    - Animation: **Fade In** 0.3s
5. On Track 5, add **Text**: **Order your office lunch**
    - Font: DM Sans, 28px, color **#F5C565** (amber)
    - Position: center, below "ChopDrop" (about 65% from top)
    - Start time: `0:15.3`, duration: `3.6s`
    - Animation: **Fade In** 0.2s
6. On Track 6, add **Text**: **chopdrop-app.vercel.app**
    - Font: DM Sans Bold, 22px, color **#FFFFFF**
    - Add a **rounded rectangle** behind it in coral `#F05F4B` as a button shape
    - Position: center, about 75% from top
    - Start time: `0:15.6`, duration: `3.3s`
7. On Track 7, add **Text**: **@chopdrop.ng**
    - Font: DM Sans, 20px, color **#888888**
    - Position: center-bottom, about 88% from top
    - Start time: `0:15.8`, duration: `3.1s`

### Option B: Text overlays only

If the full-screen replacement feels like too many layers, just cover the Glovo text:

1. Cover "Glovo" (large green text at 0:13.0) with **ChopDrop** in coral
2. Cover "made by kreatively" with **Order your office lunch**
3. Cover "@KREATIVELY.KE" with **@chopdrop.ng**
4. Leave the dark background as-is (it's already dark gray, close enough to dark green)

---

## Copy-paste text replacement table

Every text swap in the video, ready to copy-paste into CapCut. Sorted by timestamp.

| Time | Glovo original | ChopDrop replacement | Font | Size | Color |
| --- | --- | --- | --- | --- | --- |
| 0:02.0 | Glovo | ChopDrop | Manrope ExtraBold | 80px | #1C2B24 |
| 0:03.5 | What do you want to order today? | What's for lunch today? | DM Sans | 24px | #FFFFFF |
| 0:05.2 | Select the store | Pick your restaurant | Manrope Bold | 28px | #F5C565 |
| 0:05.4 | Carrefour | Ajisafe Kitchen | DM Sans SemiBold | 22px | #FFFFFF |
| 0:05.4 | Java House | The Place | DM Sans SemiBold | 22px | #FFFFFF |
| 0:05.4 | Naivas | Mama T's Kitchen | DM Sans SemiBold | 22px | #FFFFFF |
| 0:05.8 | PURCHASE ITEMS | ORDER NOW | DM Sans ExtraBold | 18px | #19342d |
| 0:06.5 | Top restaurants and stores in Kenya | Top restaurants in Lagos | Manrope Bold | 48px | #888 / #F05F4B / #F5C565 |
| 0:08.0 | Big Square | Ajisafe Kitchen | DM Sans | 14px | #F05F4B |
| 0:08.0 | Paneer Tikka Square | Pepper Rice | DM Sans Bold | 20px | #19342d |
| 0:08.0 | KSh800.00 | ₦2,500 | DM Sans SemiBold | 16px | #666666 |
| 0:08.0 | Kentucky Fried Chicken | The Place | DM Sans | 14px | #216c4e |
| 0:08.0 | 9 Piece Chicken Bucket | Jollof Rice + Chicken | DM Sans Bold | 20px | #19342d |
| 0:08.0 | KSh1,900.00 | ₦3,800 | DM Sans SemiBold | 16px | #666666 |
| 0:09.4 | What's your address? | Enter your office code | DM Sans | 22px | #19342d |
| 0:10.2 | Royal Park Estat | Victoria Island Office | DM Sans | 22px | #19342d |
| 0:09.4 | Confirm / Confirm Location | Confirm Office | DM Sans SemiBold | 16px | #216c4e |
| 0:11.2 | Fast and secure delivery, at your doorstep | Hot lunch, delivered to your desk | Manrope ExtraBold | 44px | #19342d |
| 0:11.4 | 12 min · 9.7 km | Arrives by 12:00 PM · 4.2 km | DM Sans Bold | 20px | #19342d |
| 0:13.0 | Glovo (large green) | ChopDrop | Manrope ExtraBold | 72px | #F05F4B |
| 0:14.9 | made by kreatively | Order your office lunch | DM Sans | 28px | #F5C565 |
| 0:15.4 | @KREATIVELY.KE | @chopdrop.ng | DM Sans | 20px | #888888 |

---

## CapCut tips and common mistakes

### How to position overlays precisely

1. **Zoom the timeline** — scroll your mouse wheel over the timeline to zoom in. You need frame-level precision for text placement.
2. **Use the preview canvas** — drag your text/image directly on the preview window to position it. Hold Shift to constrain movement.
3. **Match text size** — start with the font size from the table above, then adjust visually until it covers the original text exactly. The preview canvas is your alignment tool.
4. **Snap to center** — CapCut shows blue guide lines when an element is centered. Use these.

### Common mistakes to avoid

- **Text appears too early/late** — scrub frame-by-frame (arrow keys) to find the exact moment the original text appears. Your overlay should start 1-2 frames before.
- **Font mismatch** — if Manrope isn't available in CapCut, use Montserrat ExtraBold (closest match). For DM Sans, use Inter or Roboto.
- **Wrong layer order** — overlays must be on HIGHER tracks (Track 2, 3, 4...) than the video (Track 1). Higher track number = shows on top.
- **Overlay shows during transitions** — the Glovo video morphs between scenes. Your text overlays should END before the morph starts and START after it finishes. Leave 0.2s gaps at transitions.
- **Forgetting the watermark** — the @KREATIVELY.KE text is on screen the ENTIRE video. You need a cover rectangle from 0:00 to 0:14 (it disappears in the dark outro).

### Export settings

When you're done, click **Export** (top-right):

1. Resolution: **1080p**
2. Frame rate: **30fps**
3. Format: **MP4**
4. Quality: **High**
5. Codec: **H.264** (recommended) or H.265 (smaller file)

The final file will be about 5-10 MB for an 18-second video at 1080p.

### Total layers you'll have

- Track 1: Glovo video (base)
- Track 2: Watermark cover rectangle (full duration)
- Track 3: Logo/image overlays (ChopDrop icon, Lagos map)
- Track 4-8: Text overlays (restaurant names, prices, addresses, outro text)
- Track 9: Outro background rectangle (dark green, 0:14.2 onward)

About 15-20 overlay elements total. Budget 2 hours for your first attempt.
