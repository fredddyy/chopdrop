# ChopDrop App Promo Video — Brief

## Intent
Recreate the Glovo Kenya promo video (reference: `../chopdrop-frames/dense/`) as a ChopDrop-branded app showcase. Keep every animation, morph, and easing curve identical; swap only brand assets, text, and content for Lagos/Nigeria context. This is a show-the-product promo.

## Workflow
product-launch-video

## Flow
autonomous

## Format
- Duration: ~15s (trim the 4s creator outro from original 19s)
- Resolution: 848x478 (16:9)
- FPS: 30

## Brand
Read `../chopdrop-motion/brand.md` for full brand spec.
- Primary: coral `#F05F4B` (ChopDrop accent)
- Secondary: deep green `#0F4030`
- Text: `#1A1A1A`
- Background: `#FAFAF8`
- Amber: `#F5C565`
- Fonts: Manrope 700/800 (headlines), DM Sans 400-700 (body)

## Logo
- Icon: `../public/icons/icon-512.svg` (coral teardrop with white smile)
- Wordmark: "ChopDrop" in Manrope 800, tracking -0.03em

## Scenes (millisecond-precision from forensic analysis)

### Scene 1: 0:00.000 — 0:02.800 | INTRO
- Yellow blur circle (`#FFCC00`, 900px, blur 120px) at Y 85%, rotates 0-15deg over full video, scales 0.6→1.4
- "Introducing" text: 12 letters scatter-in with elastic-out, Y-bounce -4px per letter
- Text scale-through exit: 1.0→4.0x with opacity fade
- ChopDrop icon drop-in with ease-out-back overshoot (1.15→1.0)
- Yellow radial glow emerges behind icon
- Hand grabs icon, drags left with coral ghost trail (3 layers at 20% opacity)
- "ChopDrop" typed letter-by-letter at 0.04s/letter, Y-bounce per letter, revealed behind icon mask
- Hand flicks out downward, logo settles with 2deg rotation wobble

### Scene 2: 0:02.800 — 0:04.800 | SEARCH + ICONS
- Logo cross-dissolves to black pill search bar (#0A0A0A, 440x56px, radius 28px)
- "What's for lunch today?" typed at 0.04s/char with blinking cursor
- Camera zooms 1.0→2.2x then pulls back
- 7 food icons orbit the bar (radius ~100px, 45deg/s):
  1. Jollof rice bowl (replacing shopping cart)
  2. Takeaway bag (replacing shopping bags)
  3. Burger (keep)
  4. Moi moi wrap (replacing lipstick/pharmacy)
  5. Pepper soup bowl (replacing Glovo bag)
  6. Pounded yam + egusi (replacing +18 bottle)
  7. Delivery scooter (keep)
- Yellow background wash returns

### Scene 3: 0:04.800 — 0:06.200 | STORE SELECTION
- Search bar morphs to dark card: width→380px, height→400px, fill #0A0A0A→#1A1A1A, radius 28→20px
- Specular highlight sweep across card face
- "Pick your restaurant" header in amber #F5C565
- 3 restaurant rows stagger in from right:
  1. Ajisafe Kitchen (coral circle icon)
  2. The Place (green circle icon)
  3. Mama T's Kitchen (purple circle icon)
- Yellow highlight rectangle scans down through rows
- "ORDER NOW" amber button pops from bottom

### Scene 4: 0:06.200 — 0:07.600 | ZOOM RIGHT + TEXT
- Card scales 1.0→1.4, shifts right to X 72%
- "Top restaurants in Lagos" appears left: "restaurants" in coral, "Lagos" in amber
- Diagonal stripe wipe transition

### Scene 5: 0:07.600 — 0:09.200 | CART
- Green blob background fades in
- White cart card materializes (420x260px, radius 16px, soft shadow)
- Item 1: Ajisafe Kitchen | Pepper Rice | ₦2,500 (food photo, pale yellow row)
- Item 2: The Place | Jollof Rice + Chicken | ₦3,800
- "PROCEED TO CHECKOUT" green #216c4e button
- Cursor clicks checkout with green ripple
- Paper shapes fly out

### Scene 6: 0:09.200 — 0:12.000 | ADDRESS + MAP
- Address bar: "Enter your office code" placeholder, types "Victoria Island Office"
- "Confirm Office" button
- 6 pins scatter with elastic bounce, red→orange color morph
- Map morph: Lagos map screenshot, amber route line draws (trim-path 0→100%)
- "Hot lunch, delivered to your desk" overlay text
- "Arrives by 12:00 PM · 4.2 km" info tag pops with bounce

### Scene 7: 0:12.000 — 0:15.000 | OUTRO
- Map fades. "ChopDrop" in coral #F05F4B, large, defocus-to-focus reveal
- ChopDrop drop-mark icon drops with bounce
- Hold 1.5s
- Dark background #19342d transition
- ChopDrop icon centered, "Order your office lunch" in amber
- "chopdrop-app.vercel.app" URL
- "@chopdrop.ng" with Instagram + WhatsApp icons

## Audio
- Music: `../brag-output-2026-10-16-081500/composition/assets/voiceover-elevenlabs.mp3` (optional — can be audio bed only)
- BGM: `../brag-output-2026-10-16-081500/composition/assets/` (check for music file)

## Reference Frames
Dense 10fps extraction at `../chopdrop-frames/dense/f_0001.jpg` through `f_0189.jpg`.

## Assets Available
- `../public/icons/icon-512.png` — ChopDrop icon 512px
- `../public/icons/icon-512.svg` — ChopDrop icon SVG
- `../chopdrop-motion/brand/logo.svg` — ChopDrop mark
- `../chopdrop-motion/app-capture/assets/ajisafe-pepper-rice.webp` — food photo
- `../chopdrop-motion/app-capture/assets/the-place.jpg` — restaurant photo
- `../chopdrop-motion/app-capture/assets/fonts/` — local font files
