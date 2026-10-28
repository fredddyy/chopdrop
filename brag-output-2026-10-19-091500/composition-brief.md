# Hyperframes Composition Brief: ChopDrop

## Objective
Create a short app-store-style brag video for ChopDrop — a batch food ordering platform for Lagos offices.

## Output
- Composition directory: `brag-output-2026-10-19-091500/composition/`
- Rendered video: `brag-output-2026-10-19-091500/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 18 seconds

## Source Material
- Project root: C:\Users\GodfredBoakye\Desktop\Buzzpay
- Primary files read: src/app/globals.css, src/components/logo.tsx, prisma/seed.ts, chopdrop-motion/brand.md
- Product name: ChopDrop
- Tagline: "Work is stressful. Food shouldn't be."
- Key UI to recreate: Search bar with food icons, restaurant selection card, cart with Nigerian food items + Naira prices, address/office code input
- Copy that must appear verbatim:
  - "Lunch sorted."
  - "What's for lunch today?"
  - "Pick your restaurant"
  - "Ajisafe Kitchen"
  - "The Place"
  - "Mama T's Kitchen"
  - "Pepper Rice" / "₦2,500"
  - "Jollof Rice + Chicken" / "₦3,800"
  - "Victoria Island Office"
  - "Hot lunch, delivered to your desk"
  - "Arrives by 12:00 PM"
  - "ChopDrop"
  - "Order your office lunch"
  - "chopdrop-app.vercel.app"
  - "@chopdrop.ng"

## Creative Direction
- Tone preset: app-store
- Creative direction: premium Lagos food-tech launch — warm, confident, communal. Matches the Glovo Kenya promo motion style.
- Interpretation: Clean card reveals with spring easing. Smooth morphs between scenes (pill → card). Bold Manrope type. Fast entries with adequate read holds. No bounce-house energy. Tactile and precise.
- Angle: "Your office lunch, sorted." Not another delivery app — communal food for work. The hook is the problem everyone in a Lagos office knows.
- Hook: "Lunch sorted." big text slam, then ChopDrop logo with glove hand drag
- Outro: Dark green background, coral logo defocus-to-focus, tagline, URL
- Avoid:
  - Generic SaaS language ("streamline your workflow")
  - Abstract filler visuals
  - Stock photo people
  - The word "app" in headlines

## Visual Identity
- Background: #FAFAF8
- Text: #1A1A1A
- Accent: #F05F4B (coral)
- Secondary: #0F4030 (deep forest green)
- Amber: #F5C565
- Display font: Manrope 800
- Body font: DM Sans 400-700
- Logo: coral teardrop with white smile (SVG in public/icons/icon-512.svg)
- Visual references: dark green hero cards, flip-clock timers, warm Nigerian food photography

## Storyboard
Use brag-output-2026-10-19-091500/brag-plan.md as the creative contract.

1. Hook + Logo — 3.0s — "Lunch sorted." slam, ChopDrop logo with glove hand drag + typed wordmark
2. Search + Browse — 2.5s — black pill search, "What's for lunch today?" typed, 7 large food icons orbit, camera zooms 2.2x in then out
3. Pick Restaurant — 3.0s — dark card morph from search, 3 restaurant rows stagger on beats, yellow highlight scans, card zooms right
4. Cart — 2.0s — white card, Pepper Rice ₦2,500 + Jollof Rice + Chicken ₦3,800, green checkout button
5. Delivery — 2.5s — address bar types "Victoria Island Office", SVG teardrop pins drop, "Hot lunch, delivered to your desk" + arrival tag
6. Outro — 5.0s — yellow blur fills screen, dark green bg, coral logo drops, "ChopDrop" defocus reveal, tagline, URL, handle, hold

## Audio
- Audio role: warm bed with professional motion accents
- Audio arc: warm start → builds through search/restaurant → peaks at cart → resolves at outro → fade at 17s
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: full from 0s, steady presence, fade out 17-18s
- Music cue guidance: bundled preset at 110 BPM. Strong cues for major reveals: 8.74s (cart), 13.11s (delivery text), 17.47s (near outro hold). Beat grid for restaurant rows: 5.34s, 6.00s, 6.56s.
- Audio-reactive treatment: subtle; yellow blur opacity/scale breathes with RMS
- Audio-coupled moments:
  - Scene 1 logo drop — pop SFX
  - Scene 1 typing — subtle key ticks
  - Scene 2 cursor click — interface click
  - Scene 3 restaurant rows — card sounds on beat grid
  - Scene 4 checkout button — pop
  - Scene 5 pin drops — soft thuds
  - Scene 6 final logo — announcement cue
- SFX selection guidance: use sfx-analysis.md. Prefer low high-frequency-risk files. Card sounds for restaurant rows. Interface click for cursor. Key ticks for typing.
- SFX analysis guidance: <skill-dir>/assets/sfx/sfx-analysis.md
- Exact SFX choice: Hyperframes decides filenames, timestamps, density, volume.
- Audio files: copy music into composition/assets/music/

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, hyperframes-cli. /brag is its own workflow — do NOT enter the hyperframes entry-point intent interview or route into its promo/launch-video workflow.

Requirements:
- Show real UI from ChopDrop: restaurant names, food items, Naira prices
- Keep all text readable (0.8s minimum hold for labels, 0.3s/word for sentences)
- 18 seconds total
- Include music and SFX layer
- Beat-lock 1-3 major reveals to strong cues
- Run hyperframes check before render
- Keep local — no remote/publish
