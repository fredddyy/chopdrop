# Hyperframes Composition Brief: ChopDrop

## Objective
Create a short, unskippable vertical video for ChopDrop — a group food delivery app for Lagos offices. The video must feel like a raw screen recording leaked from a colleague's phone, not a studio production.

## Output
- Composition directory: `brag-output-2026-10-16-081500/composition/`
- Rendered video: `brag-output-2026-10-16-081500/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 21 seconds

## Source Material
- Project root: C:\Users\GodfredBoakye\Desktop\Buzzpay
- Live URL: https://chopdrop-app.vercel.app
- Product name: ChopDrop
- Tagline: "Good food. Less wahala."
- Key claim: ₦0 delivery for office batch orders (vs ₦800+ individual delivery)
- Key UI moments: Menu page with breakfast/lunch tabs, checkout with "Office Batch Drop FREE", confirmation code CD-B5AY
- Food image: https://res.cloudinary.com/rigeva3a/image/upload/v1791998598/chopdrop/ajisafe-pepper-rice.webp
- Restaurant image: https://res.cloudinary.com/rigeva3a/image/upload/v1792060589/chopdrop/the-place-restaurant.jpg

## Creative Direction
- Tone preset: deadpan
- Creative direction: sharp Lagos tech worker flexing a cheat code over lunch, casual Nigerian English, zero marketing fluff
- Interpretation: Unhurried, confident. Hard punch-cuts, not smooth fades. Every beat lands with space. The humor is dry — ₦32k just vanishes. Voice carries personality, visuals are premium but raw.
- Angle: "The Delivery Tax Cheat Code" — every office worker bleeds ₦32k/month on delivery without realizing it. ChopDrop deletes that line item.
- Hook: "₦32,000 every month. Just delivery fees."
- Outro: "Some people in your office deleted that expense last week. Nobody is talking."
- Avoid: corporate SaaS language, smooth crossfades, sterile white backgrounds, abstract filler

## Visual Identity
- Background: #0a0a0a (dark scenes), #ffffff (app UI scenes)
- Text: #ffffff on dark, #1a1a1a on light
- Accent: #f05f4b (coral)
- Success: #22c55e (green)
- Display font: Manrope (bold, tight tracking)
- Body font: DM Sans
- Visual references: flip-clock countdown, dark green hero card, food photo restaurant cards

## Motion Directives
- HARD PUNCH-CUTS on beats, no cross-dissolves
- Native iOS status bar on all phone frames: MTN-NG, 68% battery, 11:14 AM
- Exponential spring-back scale on tab taps (compress to 0.97, spring back)
- Translucent touch indicator on simulated taps (grey circle, expand + fade)
- Fake WhatsApp notification at ~12s: "Tunde: Abeg, did the ChopDrop Captain reach our floor yet?"
- Macro food texture behind checkout (shallow DOF feel)

## Storyboard
Use the storyboard in brag-plan.md as the creative contract.

1. "The Tax" — 3s — Bold ₦32,000 text on dark grain background, two-line stagger reveal
2. "The App" — 6s — iPhone frame with real ChopDrop menu, simulated tab switch breakfast→lunch, food cards
3. "The Free Drop" — 6s — Checkout screen, Office Batch Drop selected with green FREE, food in cart, fake WhatsApp notification slides in at 12s
4. "The Code" — 3s — Confirmation screen, CD-B5AY code drops in with spring animation
5. "The Flex" — 3s — Dark background, three text lines stagger in, logo fade

## Audio
- Audio role: warm bed with voice-over carrying the energy
- Audio arc: music enters low, sits under voice, subtle swell at confirmation, fades to silence for closing text
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: start at 0s, volume 0.15 (very low for deadpan), duck to 0.08 under voice, slight swell at 15s (code reveal), fade out by 18s
- Music cue guidance: detect at composition time via hyperframes beats
- Audio-reactive treatment: subtle; hero card and confirmation code may pulse gently with bass
- Voice-over: assets/voiceover.wav — 20.8s, covers scenes 1-4. Music ducks for voice duration.
- Audio-coupled moments:
  - Scene 1 (0.3s): impactSoft_medium_001 on "₦32,000" text punch
  - Scene 2 (3.5s): interface/click_003 on tab switch tap
  - Scene 3 (10s): interface/drop_001 on "FREE" badge selection
  - Scene 4 (15.5s): impactBell_heavy_000 on code reveal
- SFX selection guidance: sparse, motion-matched. Use impact for text punches, interface for UI taps, bell for the payoff. No SFX in scene 5 — silence is the punchline.
- Audio files: all copied to composition/assets/

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, hyperframes-cli. This is a /brag workflow — do not enter the hyperframes entry-point intent interview.

Requirements:
- All text readable in final render
- Show real UI from the ChopDrop app (menu page, checkout, confirmation)
- Real food photography from Cloudinary (not stock)
- 21 seconds total
- Include music + SFX + voice-over layers
- Hard cuts, no crossfades
- Native iOS status bar on phone frames
- Fake WhatsApp notification at 12s mark
