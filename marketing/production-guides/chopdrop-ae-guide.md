# ChopDrop After Effects Video Guide — Novice Edition

**Total time:** 2-3 hours
**What you'll make:** An 18-second vertical (1080x1920) promo video in the Chowdeck style
**What you need open:** After Effects with the "ChopDrop Promo" project

---

## HOW TO READ THIS GUIDE

- Every step is ONE action — one click, one keystroke, one value to type
- **Bold** means something you click or type
- `Frame 30` means go to that frame number in the time display
- When I say "stopwatch" I mean the little clock icon ⏱ next to a property name
- When I say "F9" I mean press the F9 key on your keyboard
- If you mess up, press **Ctrl+Z** to undo (you can undo many times)

---

## BEFORE YOU START

### Check your composition settings
1. Press **Ctrl+K**
2. Verify: Width **1080**, Height **1920**, Frame Rate **30**, Duration **0:00:18:00**
3. Background Color should be **#0F4030** (dark green)
4. If anything is wrong, fix it now. Click **OK**

### Delete all existing layers
1. Click on any layer in the timeline
2. Press **Ctrl+A** (selects all layers)
3. Press **Delete**
4. You should now have an empty timeline with just the dark green canvas

### Save the project
1. Press **Ctrl+S**
2. Save as **ChopDrop Promo.aep** on your Desktop if you haven't already

---

## PART 1: THE YELLOW BLUR CIRCLE (background, entire video)

This is the warm yellow glow that sits at the bottom of the screen throughout the entire video, like in the Glovo reference.

### Step 1.1: Create the circle
1. Look at the top toolbar. Find the shape tools (rectangle icon area)
2. Click and **hold** on the shape tool to see a dropdown
3. Select **Ellipse Tool** (circle icon)
4. Look to the right of the tools — you'll see **Fill** and **Stroke**
5. Click the word **Fill** — a panel appears. Click **Solid Color**, then click the color swatch
6. In the color picker, find the hex field at the bottom. Type **FFCC00** and press Enter
7. Click **OK** to close the color picker
8. Click the word **Stroke** — set it to **None** (the red diagonal line)
9. Now make sure **NO layers are selected** in the timeline (click empty gray area in timeline)
10. Go to the canvas (the big dark green area)
11. Hold **Shift** on your keyboard (this forces a perfect circle)
12. Click in the center-bottom area of the canvas and drag outward to draw a circle about half the canvas width
13. Release the mouse, then release Shift
14. You should see a yellow circle on the canvas

### Step 1.2: Name it
1. In the timeline, you'll see a new layer called "Shape Layer 1"
2. Double-click the name **Shape Layer 1**
3. Type **Yellow Blur** and press Enter

### Step 1.3: Add the blur effect
1. Make sure the **Yellow Blur** layer is selected (click it in the timeline — it turns blue)
2. Go to the top menu bar: **Effect**
3. Hover over **Blur & Sharpen**
4. Click **Gaussian Blur**
5. Look at the top-left panel — it now shows "Effect Controls Yellow Blur" with Gaussian Blur settings
6. Find **Blurriness** — click the number next to it
7. Type **120** and press Enter
8. Find the checkbox **Repeat Edge Pixels** — click it to check it
9. The yellow circle should now be a soft blurry glow

### Step 1.4: Position it at the bottom
1. Click the **Yellow Blur** layer in the timeline
2. Press the **P** key on your keyboard (this shows the Position property)
3. You'll see two numbers like "540.0, 960.0" — these are X and Y
4. Click on the **first number** (X). Type **540** and press **Tab**
5. The cursor moves to the second number (Y). Type **918** and press **Enter**
6. The yellow glow should now be at the bottom-center of the canvas

### Step 1.5: Set opacity
1. Click the **Yellow Blur** layer
2. Press the **T** key (shows Opacity)
3. Click the number next to Opacity
4. Type **60** and press Enter
5. The glow is now semi-transparent

### Step 1.6: Animate the scale (grows on entry)
1. Click the **Yellow Blur** layer
2. Press the **S** key (shows Scale)
3. Look at the time indicator (blue vertical line in the timeline) — make sure it's at the very start
4. To go to frame 0: click the time display in the top-left of the timeline (it shows something like "0:00:00:00"). Type **0** and press Enter
5. Now click the **stopwatch icon** ⏱ next to the word "Scale" — a small diamond appears in the timeline. This is your first keyframe
6. Click the Scale value and type **60** and press Enter
7. Now go to frame 24: click the time display, type **24**, press Enter
8. Click the Scale value and type **140** and press Enter — a second diamond appears automatically
9. Now select both keyframes: click the first diamond, then hold **Shift** and click the second diamond. Both should be highlighted
10. Press **F9** on your keyboard — this makes the animation smooth (Easy Ease)

### Step 1.7: Animate the rotation (slow spin over 18 seconds)
1. Click the **Yellow Blur** layer
2. Press the **R** key (shows Rotation)
3. Go to frame 0: click time display, type **0**, Enter
4. Click the **stopwatch** ⏱ next to Rotation
5. Make sure it says **0** degrees
6. Go to frame 540 (18 seconds): click time display, type **540**, Enter
7. Click the rotation value and type **15** and press Enter
8. The blur will now rotate slowly from 0 to 15 degrees over the entire video

### Step 1.8: Save
1. Press **Ctrl+S**

**Checkpoint:** You should see a soft yellow glow at the bottom of the dark green canvas. The timeline shows one layer called "Yellow Blur" with keyframes on Scale and Rotation. If you scrub the time indicator left and right, the glow should grow and rotate slightly.

---

## PART 2: THE PHONE MOCKUP (Scene 1, 0-5 seconds)

### Step 2.1: Import the phone image
1. Press **Ctrl+I** (or go to File > Import > File)
2. Navigate to where you saved the iPhone mockup PNG
3. Click the file, click **Import**
4. It appears in the **Project panel** (top-left area, where you see the composition name)

### Step 2.2: Add it to the timeline
1. In the Project panel, find the phone PNG file
2. Click and drag it down onto the **timeline** area
3. A new layer appears. It should be ABOVE the Yellow Blur layer
4. If it's below, click and drag the layer UP in the timeline stack

### Step 2.3: Scale the phone
1. Click the phone layer in the timeline
2. Press **S** (Scale)
3. Click the Scale value
4. Type **28** and press Enter (or adjust until the phone fills about 60% of the canvas width)

### Step 2.4: Position the phone
1. Press **P** (Position)
2. Click the first value (X), type **540**, Tab
3. Type **1250** for Y, press Enter
4. The phone should be centered horizontally, with the bottom half going off the canvas

### Step 2.5: Animate the phone sliding up
1. Go to frame 0: click time display, type **0**, Enter
2. Click the **stopwatch** ⏱ next to Position
3. Click the Y value (second number), type **2200**, Enter — the phone is now below the canvas (invisible)
4. Go to frame 30 (1 second): click time display, type **30**, Enter
5. Click the Y value, type **1250**, Enter — the phone slides up to its resting position
6. A second keyframe diamond appears
7. Select both keyframes (click first, Shift+click second)
8. Press **F9** (Easy Ease)

### Step 2.6: Make the phone hold, then exit
1. Go to frame 120 (4 seconds): click time display, type **120**, Enter
2. Look at the Position property — between the left/right arrows next to the word "Position" there's a small diamond icon. Click it — this adds a keyframe at the current position (holding the phone in place)
3. Go to frame 150 (5 seconds): type **150**, Enter
4. Click the Y value, type **2200**, Enter — the phone slides back down
5. Select the last two keyframes, press **F9**

### Step 2.7: Trim the phone layer
1. Move your cursor to the **right edge** of the phone layer bar in the timeline
2. Your cursor changes to a bracket shape **]**
3. Click and drag the right edge to the **5 second mark** on the timeline
4. The phone layer now only exists from 0 to 5 seconds

### Step 2.8: Save
1. Press **Ctrl+S**

**Checkpoint:** Scrub the timeline from 0 to 5 seconds. The phone should:
- 0-1s: Slide up from below
- 1-4s: Stay in place
- 4-5s: Slide back down
- After 5s: Disappear

---

## PART 3: SCENE 2 — "LUNCH IS BROKEN." (5-7 seconds)

### Step 3.1: Create a black background for this scene
1. Right-click in the empty area of the timeline (not on a layer)
2. Click **New > Solid...**
3. In the dialog:
   - Name: **Black BG 1**
   - Width: **1080**
   - Height: **1920**
   - Click the color swatch — type **0A0A0A** in the hex field, OK
4. Click **OK**
5. A black rectangle fills the canvas

### Step 3.2: Set the timing for this background
1. Click the **Black BG 1** layer in the timeline
2. Move the left edge of the layer bar to **5 seconds**: hover over the left edge until you see a bracket **[**, then drag it to the 5s mark
3. Move the right edge to **7 seconds**: hover over right edge, drag to 7s
4. Move this layer to the **bottom** of the layer stack: click and drag it below all other layers

### Step 3.3: Create the "LUNCH IS BROKEN." text
1. Go to frame 150 (5 seconds): click time display, type **150**, Enter
2. Press **Ctrl+T** (Type Tool)
3. Click in the center of the canvas and **drag** a text box about 900px wide and 200px tall
4. Type: **LUNCH IS BROKEN.**
5. Press **Ctrl+A** to select all the text
6. In the Character panel (right side):
   - Font: type **Manrope** in the font field (if not available, use **Montserrat**)
   - Style: **ExtraBold** (or 800)
   - Size: click the size field, type **100**
   - Color: click the color swatch, type **FFFFFF** (white), OK
7. In the Paragraph panel: click the **Center Align** button (middle icon)
8. Press **V** (switch to Selection Tool)

### Step 3.4: Position the text
1. Click the text layer in the timeline
2. Press **P** (Position)
3. Set Position to **540, 960** (center of canvas)

### Step 3.5: Trim the text layer
1. Drag the left edge of the text layer to **5 seconds**
2. Drag the right edge to **7 seconds**

### Step 3.6: Animate the text slamming in
1. Go to frame 150 (5 seconds)
2. Press **S** (Scale) — click the **stopwatch** ⏱, set Scale to **0**
3. Also press **T** (Opacity) — click the **stopwatch** ⏱, set Opacity to **0**
4. Go to frame 156 (5.2 seconds): type **156**, Enter
5. Set Scale to **115** (overshoot — bigger than final size)
6. Set Opacity to **100**
7. Go to frame 165 (5.5 seconds): type **165**, Enter
8. Set Scale to **100** (settles to final size)
9. Select all Scale keyframes (click first diamond on Scale row, Shift+click last)
10. Press **F9**

### Step 3.7: Save
1. Press **Ctrl+S**

**Checkpoint:** Scrub from 5s to 7s. "LUNCH IS BROKEN." should slam in from nothing, overshoot slightly, then settle. White text on black background.

---

## PART 4: SCENE 3 — MENU CARDS (7-12 seconds)

### Step 4.1: Create another black background
1. Right-click timeline → **New > Solid**
2. Name: **Black BG 2**, Size: 1080x1920, Color: **#0A0A0A**
3. Drag left edge to **7s**, right edge to **12s**
4. Move to bottom of layer stack

### Step 4.2: Create the header text
1. Go to frame 210 (7 seconds): type **210**, Enter
2. Ctrl+T, drag a text box, type: **Everyone picks. Everyone pays.**
3. Ctrl+A, set: Manrope, Bold, **48px**, **#FFFFFF**, Center
4. Press **V**, set Position: **540, 250**
5. Trim layer: **7s to 12s**
6. Animate:
   - At frame 210 (7s): Stopwatch on Opacity → **0%**, Position Y → **210** (slightly above)
   - At frame 225 (7.5s): Opacity → **100%**, Position Y → **250** (resting)
   - F9 on all

### Step 4.3: Create Meal Row 1
1. Go to frame 225 (7.5s)
2. Ctrl+T, drag text box, type: **Smoky jollof & beef — ₦3,800**
3. Ctrl+A: DM Sans, Bold, **36px**, **#FFFFFF**, Center
4. Press **V**, Position: **540, 500**
5. Trim: **7s to 12s**
6. Animate:
   - At frame 225 (7.5s): Opacity **0%**, Y **560** (below resting)
   - At frame 240 (8s): Opacity **100%**, Y **500**
   - F9

### Step 4.4: Create Meal Row 2
1. Go to frame 240 (8s)
2. Ctrl+T, type: **Fried rice & chicken — ₦4,200**
3. DM Sans, Bold, **36px**, **#FFFFFF**, Center
4. Position: **540, 620**
5. Trim: **7s to 12s**
6. Animate:
   - At frame 240 (8s): Opacity **0%**, Y **680**
   - At frame 255 (8.5s): Opacity **100%**, Y **620**
   - F9

### Step 4.5: Create Meal Row 3
1. Go to frame 255 (8.5s)
2. Ctrl+T, type: **Amala & ewedu — ₦2,800**
3. DM Sans, Bold, **36px**, **#FFFFFF**, Center
4. Position: **540, 740**
5. Trim: **7s to 12s**
6. Animate:
   - At frame 255 (8.5s): Opacity **0%**, Y **800**
   - At frame 270 (9s): Opacity **100%**, Y **740**
   - F9

### Step 4.6: Create restaurant label
1. Ctrl+T, type: **Ajisafe Kitchen · The Place · Mama T's**
2. DM Sans, **20px**, color **#F05F4B** (coral), Center
3. Position: **540, 400**
4. Trim: **7s to 12s**
5. Animate: Opacity 0 at 7.3s → 100 at 7.8s

### Step 4.7: Save
1. Press **Ctrl+S**

**Checkpoint:** Scrub 7-12s. Header fades in, then 3 meal cards stagger up one after another on the black background. Restaurant names in coral above.

---

## PART 5: SCENE 4 — CONFIRMED + STATS (12-16 seconds)

### Step 5.1: Background
1. New > Solid: **Green BG 2**, 1080x1920, **#0F4030**
2. Trim: **12s to 16s** (drag left edge to 12s, right edge to 16s)
3. Move to bottom

### Step 5.2: "CONFIRMED" text
1. Go to frame 360 (12s)
2. Ctrl+T, type: **CONFIRMED**
3. Manrope, ExtraBold, **110px**, **#FFFFFF**, Center
4. Position: **540, 400**
5. Trim: **12s to 16s**
6. Animate Scale:
   - Frame 360 (12s): Scale **0%** (stopwatch on)
   - Frame 366 (12.2s): Scale **115%**
   - Frame 375 (12.5s): Scale **100%**
   - F9

### Step 5.3: Collection code
1. Ctrl+T, type: **CD 028**
2. DM Sans, Bold, **36px**, **#FFFFFF**, Center
3. Position: **540, 560**
4. Trim: **12s to 16s**
5. Animate:
   - Frame 375 (12.5s): Opacity **0%**, Scale **50%** (stopwatches on)
   - Frame 384 (12.8s): Opacity **100%**, Scale **100%**
   - F9

### Step 5.4: Time text
1. Ctrl+T, type: **by 12:00 PM**
2. Manrope, ExtraBold, **72px**, **#FFFFFF**, Center
3. Position: **540, 720**
4. Trim: **12s to 16s**
5. Animate:
   - Frame 390 (13s): Opacity **0%**, Y **750**
   - Frame 399 (13.3s): Opacity **100%**, Y **720**
   - F9

### Step 5.5: Delivery fee
1. Ctrl+T, type: **₦0 DELIVERY**
2. Manrope, ExtraBold, **56px**, **#F5C565** (amber), Center
3. Position: **540, 880**
4. Trim: **12s to 16s**
5. Animate Scale:
   - Frame 405 (13.5s): Scale **0%**
   - Frame 411 (13.7s): Scale **115%**
   - Frame 420 (14s): Scale **100%**
   - F9

### Step 5.6: Save
1. Press **Ctrl+S**

**Checkpoint:** Scrub 12-16s. "CONFIRMED" slams in big, then code appears, then "by 12:00 PM" fades up, then "₦0 DELIVERY" bounces in amber. All on dark green.

---

## PART 6: SCENE 5 — OUTRO (16-18 seconds)

### Step 6.1: Background
1. New > Solid: **Black BG 3**, 1080x1920, **#0A0A0A**
2. Trim: **16s to 18s**
3. Move to bottom
4. Animate Opacity: at 16s **0%** → at 16.3s **100%** (fades in from green)

### Step 6.2: Import the ChopDrop logo
1. Press **Ctrl+I**
2. Navigate to your project: **C:\Users\GodfredBoakye\Desktop\Buzzpay\public\icons\icon-512.png**
3. Click **Import**
4. Drag it to the timeline
5. Trim: **16s to 18s**
6. Scale: **15%**
7. Position: **540, 550**
8. Animate Scale:
   - Frame 480 (16s): Scale **0%**
   - Frame 486 (16.2s): Scale **18%** (overshoot)
   - Frame 495 (16.5s): Scale **15%** (settle)
   - F9

### Step 6.3: "ChopDrop" text
1. Ctrl+T, type: **ChopDrop**
2. Manrope, ExtraBold, **96px**, **#F05F4B** (coral), Center
3. Position: **540, 780**
4. Trim: **16s to 18s**
5. Animate:
   - Frame 489 (16.3s): Opacity **0%**, Y **810**
   - Frame 498 (16.6s): Opacity **100%**, Y **780**
   - F9

### Step 6.4: Tagline
1. Ctrl+T, type: **Your office lunch — disrupted.**
2. DM Sans, **28px**, **#999999** (light gray), Center
3. Position: **540, 920**
4. Trim: **16s to 18s**
5. Animate: at frame 498 (16.6s) Opacity **0%** → frame 507 (16.9s) Opacity **100%**

### Step 6.5: URL
1. Ctrl+T, type: **chopdrop-app.vercel.app**
2. DM Sans, Bold, **24px**, **#FFFFFF**, Center
3. Position: **540, 1060**
4. Trim: **16s to 18s**
5. Animate: at frame 510 (17s) Opacity **0%** → frame 519 (17.3s) Opacity **100%**

### Step 6.6: Handle
1. Ctrl+T, type: **@chopdrop.ng**
2. DM Sans, **20px**, **#888888**, Center
3. Position: **540, 1160**
4. Trim: **16s to 18s**
5. Animate: at frame 516 (17.2s) Opacity **0%** → frame 525 (17.5s) Opacity **50%**

### Step 6.7: Save
1. Press **Ctrl+S**

**Checkpoint:** Scrub 16-18s. Black fades in, logo bounces, "ChopDrop" in coral fades up, tagline, URL, and handle stagger in. Clean outro.

---

## PART 7: EXPORT THE VIDEO

### Step 7.1: Preview the whole video first
1. Go to frame 0 (time display, type **0**, Enter)
2. Press **Numpad 0** (or click Play in the Preview panel on the right)
3. Wait for it to cache — then watch the whole 18 seconds
4. If anything looks wrong, go back and fix it

### Step 7.2: Add to Render Queue
1. Go to top menu: **Composition > Add to Render Queue** (or press **Ctrl+M**)
2. The Render Queue panel opens at the bottom

### Step 7.3: Set output format
1. In the Render Queue, find **Output Module** — click the blue text next to it (probably says "Lossless")
2. Change **Format** to **H.264** 
3. If H.264 is not in the list, change Format to **QuickTime** and set codec to H.264
4. Click **OK**

### Step 7.4: Set output location
1. Click the blue text next to **Output To**
2. Navigate to your **Desktop**
3. Name the file: **ChopDrop-Promo.mp4**
4. Click **Save**

### Step 7.5: Render
1. Click the **Render** button on the right side of the Render Queue
2. Wait for the progress bar to complete (should take 30-60 seconds)
3. When done, you'll hear a chime and see "Done" in the status

### Step 7.6: Watch your video
1. Go to your Desktop
2. Double-click **ChopDrop-Promo.mp4**
3. Watch it. You made a promo video.

---

## TROUBLESHOOTING

### "I can't find the stopwatch"
- Make sure the layer is selected (clicked, highlighted blue in timeline)
- Make sure the property is visible (press P for Position, S for Scale, T for Opacity, R for Rotation)
- The stopwatch ⏱ is the small clock icon to the LEFT of the property name

### "My text is going vertical"
- You clicked instead of clicking-and-dragging. Delete the text layer, try again: Ctrl+T, then DRAG a wide box on the canvas before typing

### "I can't see my layer"
- Check if the time indicator is within the layer's time range
- Check if the layer's opacity is 0 (you may have set it to 0 for animation)
- Check if the layer is hidden (eye icon in timeline)

### "My animation looks jerky"
- Select the keyframes and press F9 (Easy Ease)
- For even smoother motion: right-click a keyframe > Keyframe Assistant > Easy Ease

### "I typed the wrong frame number"
- Click the time display (top-left of timeline), type the correct number, press Enter
- Remember: 30 frames = 1 second. So 5 seconds = frame 150, 12 seconds = frame 360

### Frame number cheat sheet
| Time | Frame number |
|---|---|
| 0 seconds | 0 |
| 0.5 seconds | 15 |
| 1 second | 30 |
| 2 seconds | 60 |
| 3 seconds | 90 |
| 4 seconds | 120 |
| 5 seconds | 150 |
| 6 seconds | 180 |
| 7 seconds | 210 |
| 8 seconds | 240 |
| 9 seconds | 270 |
| 10 seconds | 300 |
| 11 seconds | 330 |
| 12 seconds | 360 |
| 13 seconds | 390 |
| 14 seconds | 420 |
| 15 seconds | 450 |
| 16 seconds | 480 |
| 17 seconds | 510 |
| 18 seconds | 540 |

### Keyboard shortcut cheat sheet
| Key | What it does |
|---|---|
| P | Show Position |
| S | Show Scale |
| T | Show Opacity |
| R | Show Rotation |
| U | Show all keyframed properties |
| F9 | Easy Ease selected keyframes |
| Ctrl+T | Type Tool |
| V | Selection Tool (arrow) |
| Ctrl+Z | Undo |
| Ctrl+S | Save |
| Ctrl+I | Import file |
| Ctrl+M | Add to Render Queue |
| Ctrl+K | Composition Settings |
| Ctrl+D | Duplicate layer |
| Spacebar or Numpad 0 | Preview/Play |
| Home | Go to frame 0 |
| End | Go to last frame |

---

## WHAT YOU'LL HAVE AT THE END

A vertical 1080x1920 video, 18 seconds, with:

1. **0-5s:** Dark green background, yellow glow at bottom, phone mockup slides up from below then slides back down
2. **5-7s:** Black background, "LUNCH IS BROKEN." slams in with overshoot
3. **7-12s:** Black background, "Everyone picks. Everyone pays." header, three meal cards stagger in (jollof ₦3,800, fried rice ₦4,200, amala ₦2,800), restaurant names in coral
4. **12-16s:** Dark green, "CONFIRMED" slams in, code "CD 028", "by 12:00 PM", "₦0 DELIVERY" in amber
5. **16-18s:** Black, ChopDrop logo bounces in, "ChopDrop" in coral, tagline, URL, handle

Total layers: ~20
Total keyframes: ~50
Export: H.264 MP4

Good luck. Send me a screenshot if you get stuck.
