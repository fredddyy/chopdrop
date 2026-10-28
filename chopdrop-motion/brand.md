# Brand: ChopDrop

Written 2026-10-16 from the live site at chopdrop-app.vercel.app. Claude reads this file before every piece. Change it by hand or ask Claude to; the colour and font tables are read by a script, so keep their layout.

## Colours

| Role | Hex | Use |
|---|---|---|
| Background | #FAFAF8 | app background, light warm off-white |
| Surface | #FFFFFF | cards, panels, bottom sheets |
| Text | #1A1A1A | headlines, primary body text, charcoal |
| Muted text | #9CA3AF | secondary labels, captions, metadata |
| Accent | #F05F4B | coral — CTAs, deals, urgency, primary action buttons |
| Second accent | #0F4030 | deep forest green — drop cards, timers, trust, active states |
| Third accent | #22C55E | emerald — success confirmations, live indicators, progress |
| Border | #F0EFEB | hairlines, dividers, card edges |

Supporting colours (not in the script table but used in pieces):
- Cream #F8F4E9 — landing page hero, warm tinted backgrounds
- Amber #F5C565 — deal progress gradient end, warning accents
- Lime #DFF24D — lime flash on dark green surfaces (sparse, high-contrast moments only)

## Fonts

| Role | Font | Weights | Where it comes from |
|---|---|---|---|
| Headlines | Manrope | 400, 700, 800 | Google Fonts |
| Body | DM Sans | 400, 500, 600, 700 | Google Fonts |
| Numbers and labels | DM Sans | 700 | Google Fonts |

Manrope is used for all display headings, prices, and big numbers. Tight letter-spacing (-0.03em to -0.05em) on headlines — editorial weight, not generic SaaS. DM Sans is the workhorse — body, labels, buttons, everything else.

## Logo

- brand/logo.svg: the ChopDrop teardrop mark (coral drop with white smile curve). Use on dark backgrounds. On light backgrounds the drop is coral (#F05F4B) with white smile.
- Wordmark: "ChopDrop" in Manrope 700, tracking -0.03em. Logo mark + wordmark sit side by side.

## Look

Premium mobile-first food tech. Clean, confident, Nigerian. The visual DNA borrows the institutional trust of Moniepoint and PiggyVest, the editorial precision of Linear, and the food-forward warmth of Chowdeck — then makes it communal.

- Generous white space. One idea per frame.
- Rounded corners everywhere (16-20px on cards, full-round on buttons and pills).
- Subtle layered shadows (0 1px 2px rgba(0,0,0,0.04)) — never heavy drop shadows.
- Dark green gradient hero cards (#0F4030 to #0A2E20) with decorative white/3% opacity circles for depth.
- Flip-clock countdown digits — individual character boxes, monospace, white on dark green. Pulsing seconds.
- Food photography is warm, close-up, Nigerian cuisine — jollof rice, grilled chicken, fried plantain, beans. Shot on banana leaf or dark ceramic. Never on white plates in a studio.
- Progress bars use coral-to-amber gradients with spring-eased fills.
- Motion: spring easing on entries (cubic-bezier(0.16, 1, 0.3, 1)), scale-in for success states, slide-down for sticky bars. Never linear. Never bouncy. Precise and tactile — like tapping glass on a premium device.

## Words

- Short, direct, no jargon. Sentence case.
- Nigerian English — "wahala", "sorted", "no wahala", "your drop", "chop".
- Tagline: "Work is stressful. Food shouldn't be."
- Hero: "Meals for Your Team, Sorted."
- Voice: confident peer, not a brand talking down. Like a friend who figured out lunch and is sharing the hack.
- Numbers are concrete: naira amounts, discount spots, arrival times, order counts — never vague promises.
- Urgency is structural, not marketing: "14/20 claimed" is a real count, not a fake timer.

## Avoid

- Stock photo people (no smiling office workers at a table, no handshake photos).
- Neon glows, thick gradients, or glossy 3D renders.
- Centred paragraph text on gradient backgrounds.
- Generic food delivery visuals (scooters, GPS pins, route maps, dotted delivery lines).
- The word "app" in headlines — it is a service, not software.
- Digital execution phrasing ("uploading", "processing", "database", "system architecture").
- Any animation that feels slow, floaty, or corporate. This brand moves fast.
- Infinite scrolling carousels or autoplay anything. Every interaction is intentional.
- Fake social proof with made-up names when real data exists.

## Sound

Upbeat, warm, West African-inflected beats. 100-120 BPM. Percussion-forward — shakers, light afrobeats rhythm, talking drum accents. No vocals. Energetic but not chaotic. The audio equivalent of fresh jollof rice — warm, confident, makes you hungry.

Existing voiceover asset: brag-output-2026-10-16-081500/composition/assets/voiceover-elevenlabs.mp3 (Bonnie voice, 22.9s)

## Our rules

- Social Proof Anchor: Every screen or promo frame showing an open Drop must feature a concrete, localized, real-time social indicator (e.g. "12 orders placed on your floor" or "Join Tunde, Fola + 8 others"). Never display the service in a social vacuum; communal momentum is the core product value.
- Absolute Scarcity Principle: Discount metrics and progress bars are structural scarcity clocks, not infinite marketing promotions. Progress tracks must show exact filled states (e.g. "14/20 discount slots taken" using the coral-to-amber gradient) to trigger fast-acting morning FOMO before the 8:00 AM / 10:30 AM drop locks.
- Anti-Software Vocabulary: Never describe service mechanics using digital phrasing ("uploading files", "processing databases", "digital system"). All micro-copy stays anchored in the physical reality of the Lagos workplace: "Sorted", "Drop time", "Your Captain", "Collection code". The customer feels the texture of the food, not the code of the platform.
