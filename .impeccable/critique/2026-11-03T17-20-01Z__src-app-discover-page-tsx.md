---
target: src/app/discover/page.tsx
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:C:\\Users\\GodfredBoakye\\Desktop\\Buzzpay\\src\\app\\discover\\page.tsx"
target_fingerprint: "sha256:754e0ee26410c84db86d4b090bf6a131539ff0c1f75a8ec6df918c348ab16eac"
target_path: "C:\\Users\\GodfredBoakye\\Desktop\\Buzzpay\\src\\app\\discover\\page.tsx"
timestamp: 2026-11-03T17-20-01Z
slug: src-app-discover-page-tsx
---
Method: dual-agent (A: design-review · B: detector-scan)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Pool progress bar 3px invisible. No join success state. |
| 2 | Match System / Real World | 3 | Lagos language strong. Delivery estimates ambiguous for pools. |
| 3 | User Control and Freedom | 3 | Escape works. No undo after joining. |
| 4 | Consistency and Standards | 3 | Borderless consistent. Pool 13px vs store 16px names. |
| 5 | Error Prevention | 2 | No address confirm on join. Silent geolocation failure. |
| 6 | Recognition Rather Than Recall | 3 | Categories visible. Simulated names erode trust. |
| 7 | Flexibility and Efficiency | 2 | No sort/filter beyond categories. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean borderless. No visual signature beyond palette. |
| 9 | Error Recovery | 2 | Retry exists. Join failure ambiguous. |
| 10 | Help and Documentation | 1 | Onboard fires once, vanishes. No help accessible. |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity
PASS with caveats. Differentiation lives in copy not visual language. Dark pool block is owned. Store cards could be any food app.

Detector: page.tsx clean. globals.css 4x bounce-easing advisory (lines 108,142,151,177).

## Priority Issues
- P0: No success state after pool join
- P1: Onboard tooltip fires once, vanishes forever
- P2: Pool progress bar invisible at 3px
- P2: No WhatsApp share on pool cards (viral loop buried)
- P3: Simulated social proof will get caught

## Persona Red Flags
- Casey: Location modal friction, sticky header eats viewport
- Jordan: No explanation of pools beyond dismissable tooltip
- Chioma: Fake names will get caught, no share on cards, location unclear

## Minor
- Bounce easing 4x dated
- Delivery estimates ambiguous for pools
- Search hint patronizing
- Pool vs store name size inconsistent
