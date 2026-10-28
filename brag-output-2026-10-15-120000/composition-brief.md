# Hyperframes Composition Brief: ChopDrop

## Objective
Create a short, deadpan brag video positioning ChopDrop as a financial cheat code — not a food app ad. The "Daily Tax" framework: ₦32,000/month in delivery fees that nobody questions, until someone deletes it.

## Output
- Composition directory: `brag-output-2026-10-15-120000/composition/`
- Rendered video: `brag-output-2026-10-15-120000/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 23 seconds

## Source Material
- Project root: C:\Users\GodfredBoakye\Desktop\Buzzpay
- Primary files read: src/app/page.tsx, src/app/cart/page.tsx, src/components/menu-content.tsx, src/app/globals.css
- Product name: ChopDrop
- Tagline / strongest claim: "₦32,000 a month. Just to eat at your desk."
- Key UI or visual moment to recreate: checkout screen showing "Office Batch Drop — FREE", order confirmation with code CD-B5AY
- Copy that must appear verbatim:
  - "₦32,000 a month."
  - "Just to eat at your desk."
  - "₦800 morning"
  - "₦800 afternoon"
  - "₦1,600 / day × 20 days"
  - "= ₦32,000 / month"
  - "FREE"
  - "CD-B5AY"
  - "Some people in your office deleted that expense last week."
  - "Nobody said a word."
  - "ChopDrop"
  - "Ikeja"

## Creative Direction
- Tone preset: deadpan (overridden)
- Creative direction: CMO-grade growth copy. Financial wake-up call disguised as a screen recording. The ego play is discovering you can permanently delete a monthly expense. Minimalist, raw, Apple-bold text screens between high-fidelity UI captures.
- Interpretation: Slow, confident pacing. Let numbers sit. Plain white screens with heavy black Manrope Bold type. UI captures are clean and untouched. No swooping animations. Hard cuts only.
- Angle: This is not about food. It's about ₦32,000/month in delivery fees that every Lagos office worker pays without thinking. Some people figured out how to delete that expense. They didn't tell anyone. This video is the moment you find out.
- Hook: "₦32,000 a month. Just to eat at your desk."
- Outro / punchline: "Some people in your office deleted that expense last week. Nobody said a word." then "ChopDrop. Ikeja."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Food photography as hero content
  - Anything that looks like a brand account or an ad
  - Swooping transitions, scale animations, gradient backgrounds

## Visual Identity
- Background: #ffffff (text screens), #fafaf8 (app UI captures)
- Text: #1a1a1a (Manrope Bold, -0.03em tracking, large)
- Accent: #f05f4b (coral — only appears inside app UI, never on text screens)
- Secondary accent: #0f4030 (deep green — for the checkout FREE badge)
- Display font: Manrope (700/800 weight)
- Body font: DM Sans
- Visual references from the project: checkout "Office Batch Drop — FREE" card, order confirmation screen with CD-B5AY code, the teardrop logo with smile

## Storyboard
Use the storyboard in `brag-output-2026-10-15-120000/brag-plan.md` as the creative contract.

Scene summary:
1. The Number — 4s — "₦32,000 a month." then "Just to eat at your desk."
2. The Math — 4s — ₦800 morning / ₦800 afternoon / ₦1,600 × 20 = ₦32,000 breakdown
3. The Delete Button — 5s — Checkout screen showing FREE delivery
4. Proof — 3.5s — Order confirmed, code CD-B5AY
5. The Punchline — 6.5s — "Some people in your office deleted that expense..." + logo

## Audio
- Audio role: warm bed, barely there — wallpaper not feature
- Audio arc: enters soft, stays very low throughout, fades to silence at punchline
- Music: happy-beats-business-moves-vol-10-by-ende-dot-app.mp3 (used at very low volume as lo-fi texture)
- Music treatment: volume at 0.08-0.12, fade in over 1s, constant low level, fade to 0 starting at scene 5
- Music cue guidance: detect at composition time; no strong cue locks needed — the pacing is voice-driven not beat-driven
- Audio-reactive treatment: none — rawness is the point
- Audio-coupled moments:
  - Scene 4 checkmark — soft confirmation chime
- SFX selection guidance: one soft UI chime for the confirmation. Nothing else. Restraint is the brand.
- Exact SFX choice: Hyperframes should choose one confirmation/success sound from the interface or ui SFX set
- Audio files: music copied to composition/assets/music/

## Voiceover
Voice is enabled (--voice flag). Generate via Kokoro:
- Scene 1: "Thirty-two thousand naira. Every month. Just delivery fees."
- Scene 2: "Eight hundred in the morning. Eight hundred in the afternoon. Twenty working days."
- Scene 3: (silence)
- Scene 4: "Done. Food's coming by twelve."
- Scene 5: (silence)

Voice: af_heart (or Nigerian-sounding option if available). Conversational, dry, like doing mental math. Not selling.

Music ducks to 0.04 during voiceover, returns to 0.10 during silent scenes.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills. /brag is its own workflow — do not enter the hyperframes entry-point intent interview.

Requirements:
- Show the real ChopDrop checkout UI showing FREE delivery
- Show the real order confirmation with code CD-B5AY
- Keep all text readable — the math breakdown needs time to land
- Keep video at 23 seconds
- Hard cuts only between scenes — no crossfades, no wipes
- Text screens are plain white (#ffffff) with black (#1a1a1a) Manrope Bold text
- UI screens use actual app colors from the project
- The ChopDrop logo (teardrop with smile curve) appears only in the final 1.5s
- Run hyperframes check before render
