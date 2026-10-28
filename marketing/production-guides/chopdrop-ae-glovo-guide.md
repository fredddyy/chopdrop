# ChopDrop After Effects Video Guide — Glovo Style (Landscape)

**Total time:** 3-4 hours
**What you'll make:** An 18-second landscape (1920x1080) promo video with morphing UI elements, typed text, camera zoom, and premium motion
**What you need open:** After Effects

---

## HOW TO READ THIS GUIDE

- Every step is ONE action
- **Bold** = click or type this
- `Frame 30` = go to that frame (1 second = 30 frames)
- "Stopwatch" = the clock icon ⏱ next to a property
- **Ctrl+Z** = undo if you mess up

### Frame cheat sheet (30fps)

| Time | Frame |
|---|---|
| 0s | 0 |
| 0.5s | 15 |
| 0.8s | 24 |
| 1s | 30 |
| 1.2s | 36 |
| 1.5s | 45 |
| 2s | 60 |
| 2.8s | 84 |
| 3s | 90 |
| 4s | 120 |
| 4.8s | 144 |
| 5s | 150 |
| 5.5s | 165 |
| 6s | 180 |
| 6.2s | 186 |
| 7s | 210 |
| 7.6s | 228 |
| 8s | 240 |
| 9s | 270 |
| 9.2s | 276 |
| 10s | 300 |
| 10.5s | 315 |
| 11s | 330 |
| 12s | 360 |
| 13s | 390 |
| 14s | 420 |
| 15s | 450 |
| 18s | 540 |

### Keyboard shortcuts

| Key | What it does |
|---|---|
| P | Show Position |
| S | Show Scale |
| T | Show Opacity |
| R | Show Rotation |
| U | Show all animated properties |
| F9 | Easy Ease keyframes |
| Ctrl+T | Type Tool |
| V | Selection Tool |
| Ctrl+Z | Undo |
| Ctrl+S | Save |
| Ctrl+I | Import file |
| Ctrl+M | Add to Render Queue |
| Ctrl+K | Composition Settings |
| Ctrl+D | Duplicate layer |

---

## STEP 0: CREATE THE COMPOSITION

1. Open After Effects
2. Go to **Composition > New Composition** (or Ctrl+N)
3. Set these values:
   - Composition Name: **ChopDrop Glovo**
   - Width: **1920**
   - Height: **1080**
   - Frame Rate: **30**
   - Duration: type **0:00:18:00**
   - Background Color: click the swatch, type **FAFAF8** (warm cream)
4. Click **OK**
5. Press **Ctrl+S**, save as **ChopDrop-Glovo.aep** on your Desktop

You now have an empty cream canvas, 1920x1080, 18 seconds long.

---

## PART 1: YELLOW BLUR CIRCLE (persistent background, 0-18s)

This yellow glow sits at the bottom of the screen the entire video.

### 1.1 Create the circle
1. Look at the top toolbar. Click and **hold** the shape tool (rectangle icon)
2. Select **Ellipse Tool** from the dropdown
3. Click the word **Fill** in the toolbar → **Solid Color** → click color swatch → type **FFCC00** → OK
4. Click the word **Stroke** → set to **None**
5. Click in the **empty gray area** of the timeline so nothing is selected
6. On the canvas, hold **Shift** and drag to draw a big circle (about 500px wide)
7. Release mouse, then Shift

### 1.2 Name it
1. Double-click the layer name "Shape Layer 1" in the timeline
2. Type **Yellow Blur** → Enter

### 1.3 Add blur
1. Click the Yellow Blur layer
2. Top menu: **Effect > Blur & Sharpen > Gaussian Blur**
3. In Effect Controls (top-left panel): set **Blurriness** to **120**
4. Check **Repeat Edge Pixels**

### 1.4 Position, opacity
1. Press **P** → set Position to **960, 918**
2. Press **T** → set Opacity to **60%**

### 1.5 Animate scale
1. Press **S** (Scale)
2. Go to frame 0 (time display → type **0** → Enter)
3. Click **stopwatch** ⏱ next to Scale → set to **60%**
4. Go to frame 24 (type **24** → Enter) → set Scale to **140%**
5. Select both keyframes → **F9**

### 1.6 Animate rotation
1. Press **R** (Rotation)
2. Frame 0 → **stopwatch** on → **0°**
3. Frame 540 (18s) → **15°**

### 1.7 Save: Ctrl+S

---

## PART 2: "INTRODUCING" TEXT (0 — 1.2 seconds)

The word "Introducing" appears with letter scatter, holds, then scale-throughs (zooms past camera).

### 2.1 Create the text
1. Go to frame 0
2. Press **Ctrl+T** (Type Tool)
3. On the canvas, **click and drag** a text box about 1200px wide and 150px tall in the center
4. Type: **Introducing**
5. **Ctrl+A** to select all text
6. Character panel:
   - Font: **Manrope** (or Montserrat)
   - Style: **ExtraBold**
   - Size: **72**
   - Color: click swatch → **1A1A1A** (dark)
7. Paragraph panel: **Center Align**
8. Press **V** (Selection Tool)

### 2.2 Position and trim
1. Press **P** → set to **960, 540** (dead center)
2. Trim layer: drag right edge to **1.2 seconds** (frame 36)

### 2.3 Animate entry
1. Go to frame 2 (type **2** → Enter)
2. Press **S** → click **stopwatch** → set Scale to **80%**
3. Press **T** → click **stopwatch** → set Opacity to **0%**
4. Go to frame 8 (type **8** → Enter)
5. Set Scale to **100%**
6. Set Opacity to **100%**
7. Select all 4 keyframes → **F9**

### 2.4 Animate scale-through exit
1. Go to frame 27 (0.9s) → add a keyframe on Scale (click the diamond button between arrows) at **100%**. Add Opacity keyframe at **100%**
2. Go to frame 36 (1.2s) → Scale **400%**, Opacity **0%**
3. Right-click the frame 27→36 keyframes → **Keyframe Assistant > Easy Ease In**

### 2.5 Save: Ctrl+S

**Test:** Scrub 0-1.2s. "Introducing" fades in at normal size, holds, then zooms past camera and disappears.

---

## PART 3: CHOPDROP LOGO + WORDMARK (1.2 — 2.8 seconds)

### 3.1 Import the logo
1. **Ctrl+I** → navigate to **C:\Users\GodfredBoakye\Desktop\Buzzpay\public\icons\icon-512.png**
2. Click **Import**

### 3.2 Add logo to timeline
1. Drag **icon-512.png** from Project panel to timeline
2. Trim: drag left edge to **frame 36** (1.2s), right edge to **frame 84** (2.8s)

### 3.3 Scale and position
1. Click the logo layer → press **S** → set to **12%**
2. Press **P** → set to **860, 540** (left of center — the wordmark will go to the right)

### 3.4 Animate logo drop-in
1. Go to frame 36 (1.2s)
2. Press **S** → click **stopwatch** → set **0%**
3. Press **T** → click **stopwatch** → set **0%**
4. Go to frame 42 (1.4s) → Scale **14%**, Opacity **100%** (overshoot)
5. Go to frame 48 (1.6s) → Scale **12%** (settle)
6. Select all Scale keyframes → **F9**

### 3.5 Create ghost trails (optional — skip if tired)
1. Click the logo layer → **Ctrl+D** (duplicate) → name it **Ghost 1**
2. Set Ghost 1 Opacity to **20%**
3. Press **P** → set Position to **900, 540** (slightly right of final logo position)
4. Trim: frame 57 (1.9s) to frame 69 (2.3s)
5. Animate Opacity: at 1.9s **20%** → at 2.3s **0%**
6. Duplicate again → **Ghost 2**, Opacity **15%**, Position **930, 540**
7. Trim: frame 59 to frame 69
8. Animate same way

### 3.6 Create "ChopDrop" wordmark
1. Go to frame 60 (2s)
2. **Ctrl+T** → drag text box → type: **ChopDrop**
3. Ctrl+A: Manrope, ExtraBold, **80px**, color **#1C2B24**, Left Align
4. Press **V** → Position: **980, 540** (right of the logo)
5. Trim: frame 60 (2s) to frame 84 (2.8s)

### 3.7 Animate text typing (the AE text animator — powerful feature)
1. In the timeline, click the **triangle** next to the ChopDrop text layer to expand it
2. Click the triangle next to **Text**
3. You'll see **Source Text** and an **Animate** button/dropdown
4. Click **Animate** → select **Opacity**
5. A new section appears: **Animator 1**
6. Expand **Animator 1** → you'll see **Opacity** and **Range Selector 1**
7. Set **Opacity** to **0%** (this makes all characters invisible by default)
8. Expand **Range Selector 1** → you'll see **Start**, **End**, **Offset**
9. Click the **stopwatch** next to **End**
10. At frame 60 (2s) → set End to **0%** (no characters visible)
11. At frame 72 (2.4s) → set End to **100%** (all characters visible)
12. This makes the text "type" character by character over 0.4 seconds

### 3.8 Animate logo + text exit
1. Go to frame 81 (2.7s)
2. Click the logo layer → press **T** → add keyframe at **100%**
3. Go to frame 84 (2.8s) → Opacity **0%**
4. Do the same for the ChopDrop text layer: Opacity 100% at 2.7s → 0% at 2.8s

### 3.9 Save: Ctrl+S

**Test:** Scrub 1.2-2.8s. Logo pops in with overshoot. Ghost trails appear briefly. "ChopDrop" types out letter by letter. Everything fades at 2.8s.

---

## PART 4: SEARCH BAR + FOOD ICONS (2.8 — 4.8 seconds)

### 4.1 Create the search bar (pill shape)
1. Select **Rounded Rectangle Tool** from toolbar (click and hold shape tool)
2. Fill: **#0A0A0A** (near black), Stroke: **None**
3. Make sure nothing is selected in timeline
4. On the canvas, draw a horizontal pill about 500px wide and 72px tall in the center
5. Name the layer: **Search Bar**

### 4.2 Adjust roundness
1. In the timeline, expand the Search Bar layer → Contents → Rectangle 1 → Rectangle Path 1
2. Find **Roundness** → set to **100** (fully rounded ends, pill shape)

### 4.3 Position and trim
1. Press **P** → **960, 540**
2. Trim: frame 84 (2.8s) to frame 144 (4.8s)

### 4.4 Animate search bar entry
1. Frame 84 (2.8s) → **S** → stopwatch → **0%**, **T** → stopwatch → **0%**
2. Frame 90 (3s) → Scale **105%**, Opacity **100%**
3. Frame 93 (3.1s) → Scale **100%**
4. F9 on all

### 4.5 Create search text
1. Frame 90 (3s) → **Ctrl+T** → drag text box inside the search bar area
2. Type: **What's for lunch today?**
3. Ctrl+A: DM Sans, **24px**, **#FFFFFF**, Left
4. Position: **960, 540** (same center as search bar)
5. Trim: frame 90 to frame 144

### 4.6 Animate typing (same text animator trick)
1. Expand text layer → Text → click **Animate** → **Opacity**
2. Animator 1 → Opacity: **0%**
3. Range Selector 1 → End: stopwatch
   - Frame 90 (3s): End **0%**
   - Frame 117 (3.9s): End **100%**

### 4.7 Create 7 food icon layers
For each icon, do these steps:

**Icon 1: Jollof Rice**
1. Ctrl+T, click canvas, type: **🍚**
2. Size: **80px**
3. Position: **560, 340**
4. Trim: frame 87 (2.9s) to frame 144 (4.8s)
5. Animate: Frame 87 Scale 0%/Opacity 0% → Frame 96 Scale 110%/Opacity 100% → Frame 99 Scale 100%. F9.

**Icon 2: Curry**
1. Same steps. Type: **🍛**
2. Position: **730, 290**
3. Trim starts at frame 89. Same animation offset by 2 frames.

**Icon 3: Burger**
1. Type: **🍔**, Position: **1100, 310**, Trim from frame 91

**Icon 4: Stew**
1. Type: **🍲**, Position: **520, 680**, Trim from frame 93

**Icon 5: Noodles**
1. Type: **🍜**, Position: **760, 720**, Trim from frame 95

**Icon 6: Rice bowl**
1. Type: **🍛**, Position: **1050, 700**, Trim from frame 97

**Icon 7: Scooter**
1. Type: **🛵**, Position: **1300, 620**, Trim from frame 99

### 4.8 Animate camera zoom (optional — advanced)
This fakes the zoom-in the Glovo video does. Skip if this is too complex.

If you want to try:
1. Select ALL layers in Scene 2 (search bar, text, all 7 icons) — click first, Shift+click last
2. Right-click → **Pre-compose** → name it **Scene 2 Group** → OK
3. Now you have one layer containing everything
4. Press **S** → stopwatch:
   - Frame 90 (3s): Scale **100%**
   - Frame 120 (4s): Scale **220%** (zoom in)
   - Frame 132 (4.4s): Scale **100%** (zoom back out)
5. F9

### 4.9 Exit Scene 2
1. If you pre-composed: animate the pre-comp layer Scale 100%→300%, Opacity 100%→0% at frame 138-144
2. If you didn't pre-compose: on each layer, at frame 138 (4.6s) animate Opacity 100%→0% and Scale to 50% over 6 frames

### 4.10 Save: Ctrl+S

**Test:** Scrub 2.8-4.8s. Search bar pops in, text types, 7 food icons pop in one by one around the bar. Optional: everything zooms in then back out. Then exits.

---

## PART 5: RESTAURANT SELECTION CARD (4.8 — 7.6 seconds)

### 5.1 Create the dark card background
1. Select **Rounded Rectangle Tool**
2. Fill: **#1A1A1A**, Stroke: None
3. Draw a rectangle about 480px wide, 420px tall, centered
4. Name: **Store Card**
5. Expand → Rectangle Path → Roundness: **24**
6. Position: **960, 500**
7. Trim: frame 144 (4.8s) to frame 228 (7.6s)

### 5.2 Animate card morphing in
1. Frame 144 (4.8s) → Scale stopwatch → **30%**, Opacity stopwatch → **0%**
2. Frame 150 (5s) → Scale **105%**, Opacity **100%**
3. Frame 156 (5.2s) → Scale **100%**
4. F9

### 5.3 Create "Pick your restaurant" header
1. Ctrl+T → type: **Pick your restaurant**
2. Manrope, Bold, **28px**, **#F5C565** (amber), Center
3. Position: **960, 340**
4. Trim: frame 150 (5s) to frame 228 (7.6s)
5. Animate: Frame 150 Opacity 0% → Frame 156 Opacity 100%

### 5.4 Restaurant Row 1
1. Ctrl+T → type: **🍳  Ajisafe Kitchen**
2. DM Sans, SemiBold, **24px**, **#FFFFFF**, Left
3. Position: **960, 420**
4. Trim: frame 153 (5.1s) to frame 228
5. Animate: Frame 153 Opacity 0%, X **1000** → Frame 161 (5.35s) Opacity 100%, X **960**. F9.

### 5.5 Restaurant Row 2
1. Ctrl+T → type: **🍽️  The Place**
2. Same style. Position: **960, 480**
3. Trim from frame 155 (5.18s). Same animation.

### 5.6 Restaurant Row 3
1. Ctrl+T → type: **👩‍🍳  Mama T's Kitchen**
2. Same style. Position: **960, 540**
3. Trim from frame 158 (5.26s). Same animation.

### 5.7 Yellow highlight rectangle
1. Select **Rounded Rectangle Tool**
2. Fill: **#FFCC00**, Stroke: None
3. Draw a rectangle 440px wide, 55px tall
4. Roundness: **12**
5. Position: **960, 420** (behind Row 1)
6. Trim: frame 162 (5.4s) to frame 228
7. Move this layer BELOW the restaurant text layers (so text shows on top)
8. Opacity: **80%**
9. Animate Position Y (the highlight scanning down):
   - Frame 162 (5.4s): Y **420** (row 1) → stopwatch
   - Frame 171 (5.7s): Y **480** (row 2)
   - Frame 180 (6s): Y **540** (row 3)
   - F9

### 5.8 "ORDER NOW" button text
1. Ctrl+T → type: **ORDER NOW**
2. DM Sans, ExtraBold, **18px**, **#19342d**, Center
3. Position: **960, 630**
4. Trim: frame 165 (5.5s) to frame 228
5. Animate: Y+20/Opacity 0 at 5.5s → Y resting/Opacity 100 at 5.7s. F9.

### 5.9 Card zooms right + side text appears (6.3s)
1. Click the **Store Card** layer
2. Go to frame 189 (6.3s) → add Position keyframe (click diamond) and Scale keyframe
3. Go to frame 207 (6.9s):
   - Position X: **960 → 1200** (moves right)
   - Scale: **100% → 130%**
4. F9
5. To make the restaurant rows move with the card: for each row layer, hold **Alt** and click the **Parent pick whip** (spiral icon in Parent column) and drag it to the Store Card layer. This parents them — they'll follow the card.
6. Do the same for the header, highlight, and ORDER NOW layers — parent them all to Store Card.

### 5.10 Side text
1. Ctrl+T → type two lines:
   Line 1: **Top restaurants**
   Line 2: **in Lagos**
2. Manrope, Bold, **48px**
3. Select "restaurants" → color **#F05F4B** (coral)
4. Select "Lagos" → color **#F5C565** (amber)
5. Select the rest → color **#888888**
6. Left Align
7. Position: **350, 500**
8. Trim: frame 192 (6.4s) to frame 222 (7.4s)
9. Animate: X from 320/Opacity 0 → X 350/Opacity 100 over 0.3s. F9.

### 5.11 Exit everything at 7.3s
1. Store Card layer: at frame 219 (7.3s) animate Opacity 100% → 0%, Scale 130% → 150% over 0.2s
2. Side text: Opacity 100% → 0% at 7.3s
3. (The parented layers will disappear with the card)

### 5.12 Save: Ctrl+S

**Test:** Scrub 4.8-7.6s. Dark card morphs in from small. Header appears. Three restaurant rows stagger in from right. Yellow highlight scans down through them. Card zooms right. "Top restaurants in Lagos" slides in left. Everything fades out.

---

## PART 6: CART (7.6 — 9.2 seconds)

### 6.1 Create white cart card
1. Rounded Rectangle Tool → Fill: **#FFFFFF**, Stroke: None
2. Draw: 560px wide, 280px tall
3. Roundness: **20**
4. Name: **Cart Card**
5. Position: **960, 500**
6. Trim: frame 228 (7.6s) to frame 276 (9.2s)
7. Add drop shadow: **Effect > Perspective > Drop Shadow**
   - Opacity: **8%**
   - Distance: **8**
   - Softness: **40**

### 6.2 Animate cart entry
1. Frame 228 (7.6s): Scale **70%**, Opacity **0%** (stopwatches)
2. Frame 237 (7.9s): Scale **100%**, Opacity **100%**
3. F9

### 6.3 Cart Item 1
1. Ctrl+T → type: **Ajisafe Kitchen  ·  Pepper Rice  ·  ₦2,500**
2. DM Sans, **20px**, **#19342d**, Center
3. Position: **960, 450**
4. Trim: frame 228 to frame 276
5. Animate: Frame 228 X from 940/Opacity 0 → Frame 233 (7.75s) X 960/Opacity 100. F9.

### 6.4 Cart Item 2
1. Ctrl+T → type: **The Place  ·  Jollof Rice + Chicken  ·  ₦3,800**
2. Same style. Position: **960, 510**
3. Trim: frame 231 (7.7s) to frame 276
4. Same animation starting at frame 231

### 6.5 Checkout button
1. First create the button background:
   - Rounded Rectangle Tool → Fill: **#216c4e** (green), Stroke: None
   - Draw: 280px wide, 48px tall
   - Roundness: **100** (pill)
   - Position: **960, 580**
2. Then create the text:
   - Ctrl+T → type: **PROCEED TO CHECKOUT**
   - DM Sans, ExtraBold, **16px**, **#FFFFFF**, Center
   - Position: **960, 580**
3. Trim both: frame 240 (8s) to frame 276
4. Animate both: Y+20/Opacity 0 at 8s → Y resting/Opacity 100 at 8.2s. F9.

### 6.6 Exit at 8.9s
1. Cart Card: at frame 267 (8.9s) Scale 100%→85%, Opacity 100%→0% over 9 frames
2. Parent the text layers and button to Cart Card (drag pick whip)

### 6.7 Save: Ctrl+S

---

## PART 7: ADDRESS + DELIVERY (9.2 — 12 seconds)

### 7.1 Address bar
1. Rounded Rectangle → Fill: **#F5F5F0**, Stroke: None
2. Draw: 600px wide, 64px tall
3. Roundness: **100** (pill)
4. Name: **Address Bar**
5. Position: **960, 540**
6. Trim: frame 276 (9.2s) to frame 324 (10.8s)
7. Animate: Frame 276 Scale 0% → Frame 285 (9.5s) Scale 100%. F9.

### 7.2 Address text (typed)
1. Ctrl+T → type: **Victoria Island Office**
2. DM Sans, **22px**, **#19342d**, Left
3. Position: **960, 540**
4. Trim: frame 285 (9.5s) to frame 324
5. Text Animator typing:
   - Expand text layer → Text → **Animate** → Opacity
   - Animator 1 → Opacity: **0%**
   - Range Selector → End: stopwatch
   - Frame 285 (9.5s): End **0%**
   - Frame 309 (10.3s): End **100%**

### 7.3 "Confirm Office" button text
1. Ctrl+T → type: **Confirm Office**
2. DM Sans, SemiBold, **16px**, **#216c4e**
3. Position: **1160, 540**
4. Trim: frame 276 to frame 324

### 7.4 Map pins (5 small circles)
Create 5 ellipse shape layers:
1. Ellipse Tool → Fill: **#E53935** (red), Stroke: None
2. Draw a small circle ~16px
3. Position each at different spots around the address bar:
   - Pin 1: **480, 320**, trim from frame 276
   - Pin 2: **1250, 340**, trim from frame 278
   - Pin 3: **300, 680**, trim from frame 280
   - Pin 4: **860, 700**, trim from frame 282
   - Pin 5: **1540, 640**, trim from frame 284
4. For each pin, animate: Y-40/Opacity 0 → Y resting/Opacity 100 over 10 frames. F9.

### 7.5 Pin color change (optional)
1. At frame 294 (9.8s): for each pin, change fill from red to orange **#F57C00**
2. To animate fill color: expand pin layer → Contents → Ellipse → Fill → Color
3. Stopwatch on Color at 9.8s (red) → at 10.1s (orange)

### 7.6 Exit address elements at 10.6s
1. Address bar, text, button, all pins: Opacity 100% → 0% at frame 318 (10.6s) over 6 frames

### 7.7 Delivery text
1. Ctrl+T → type: **Hot lunch, delivered to your desk**
2. Manrope, ExtraBold, **44px**, **#19342d**, Center
3. Position: **960, 480**
4. Trim: frame 324 (10.8s) to frame 360 (12s)
5. Animate: Y+20/Opacity 0 at 10.8s → Y 480/Opacity 100 at 11.1s. F9.

### 7.8 Delivery tag
1. First make background pill: Rounded Rect → Fill **#FFFFFF**, 420x48, Roundness 100
2. Add drop shadow (same settings as cart card)
3. Position: **960, 600**
4. Text on top: **🛵  Arrives by 12:00 PM  ·  4.2 km**
5. DM Sans, Bold, **20px**, **#19342d**, Center, Position: **960, 600**
6. Trim both: frame 330 (11s) to frame 360 (12s)
7. Animate both: Scale 0% → 110% → 100% (bounce) at 11s. F9.

### 7.9 Exit at 11.7s
1. Both layers: Opacity 100% → 0% at frame 351 (11.7s) over 6 frames

### 7.10 Save: Ctrl+S

---

## PART 8: OUTRO (12 — 18 seconds)

### 8.1 Create dark green background
1. Right-click timeline → **New > Solid**
2. Name: **Outro BG**, Size: 1920x1080, Color: **#19342d**
3. Trim: frame 360 (12s) to frame 540 (18s)
4. Move to BOTTOM of layer stack
5. Animate Opacity: frame 360 **0%** → frame 372 (12.4s) **100%**

### 8.2 Yellow blur fills screen (transition effect)
1. Click the **Yellow Blur** layer (your very first layer)
2. Go to frame 360 (12s) → add Scale keyframe at current value
3. Frame 369 (12.3s) → Scale **400%** (fills the screen yellow)
4. Frame 375 (12.5s) → Scale **140%** (recedes), Opacity **0%** (fades out)
5. This creates: yellow glow expands to fill the screen, then shrinks and fades as the dark outro appears behind it

### 8.3 ChopDrop Logo
1. The icon-512.png is already in the project panel
2. Drag it to timeline again (creates a second instance)
3. Trim: frame 378 (12.6s) to frame 540 (18s)
4. Scale: **10%**, Position: **960, 380**
5. Animate Scale:
   - Frame 378 (12.6s): **0%**
   - Frame 384 (12.8s): **13%** (overshoot)
   - Frame 390 (13s): **10%** (settle)
   - F9

### 8.4 "ChopDrop" name
1. Ctrl+T → type: **ChopDrop**
2. Manrope, ExtraBold, **72px**, **#F05F4B** (coral), Center
3. Position: **960, 530**
4. Trim: frame 384 (12.8s) to frame 540
5. Animate: Frame 384 Opacity 0%/Y 560 → Frame 393 (13.1s) Opacity 100%/Y 530. F9.

### 8.5 Tagline
1. Ctrl+T → type: **Order your office lunch**
2. DM Sans, **28px**, **#F5C565** (amber), Center
3. Position: **960, 640**
4. Trim: frame 396 (13.2s) to frame 540
5. Animate: Opacity 0% at 13.2s → 100% at 13.5s

### 8.6 URL button
1. Rounded Rectangle → Fill: **#F05F4B**, 380x50px, Roundness 100
2. Position: **960, 740**
3. Text on top: **chopdrop-app.vercel.app**, DM Sans Bold **22px** **#FFFFFF** Center
4. Position text: **960, 740**
5. Trim both: frame 405 (13.5s) to frame 540
6. Animate both: Scale 90%/Opacity 0 → Scale 100%/Opacity 100 at 13.5-13.8s. F9.

### 8.7 Handle
1. Ctrl+T → type: **@chopdrop.ng**
2. DM Sans, **20px**, **#888888**, Center
3. Position: **960, 830**
4. Trim: frame 414 (13.8s) to frame 540
5. Animate: Opacity 0% → 50% at 13.8-14.1s

### 8.8 Save: Ctrl+S

---

## PART 9: EXPORT

### 9.1 Preview
1. Press **Home** key (goes to frame 0)
2. Press **Numpad 0** (or click Play in Preview panel)
3. Watch the whole 18 seconds
4. If anything looks wrong, fix it now

### 9.2 Render
1. **Ctrl+M** (Add to Render Queue)
2. Click blue text next to **Output Module** → Format: **H.264** → OK
3. Click blue text next to **Output To** → save as **ChopDrop-Glovo-Style.mp4** on Desktop → Save
4. Click **Render**
5. Wait 30-60 seconds
6. Done! Watch your video on the Desktop.

---

## SUMMARY: WHAT EACH SCENE LOOKS LIKE

| Time | Scene | What happens |
|---|---|---|
| 0-1.2s | Intro | "Introducing" fades in, holds, zooms past camera |
| 1.2-2.8s | Logo | ChopDrop icon pops in with overshoot, ghost trails, "ChopDrop" types out |
| 2.8-4.8s | Search | Black pill search bar, "What's for lunch today?" types, 7 food icons pop around it |
| 4.8-7.6s | Restaurants | Dark card morphs in, 3 restaurant rows stagger, yellow highlight scans down, card zooms right, "Top restaurants in Lagos" |
| 7.6-9.2s | Cart | White card, Pepper Rice ₦2,500, Jollof Rice + Chicken ₦3,800, green checkout button |
| 9.2-12s | Delivery | Address bar types "Victoria Island Office", red pins drop, "Hot lunch, delivered to your desk", arrival tag |
| 12-18s | Outro | Yellow blur fills screen, dark green BG, ChopDrop logo bounces, name in coral, tagline, URL, handle |

**Total layers:** ~30
**Total keyframes:** ~80
**Export:** H.264 MP4, 1920x1080, 18 seconds

You did it.
