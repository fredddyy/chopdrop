---
target: group creation page
total_score: 16
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\GodfredBoakye\\Desktop\\Buzzpay\\src\\app\\pools\\create\\page.tsx"
target_fingerprint: "sha256:18229ea6610055a4a63b889e3a0d3dab7d7bca08d52103569ac8e5eb9b2f27f5"
target_path: "C:\\Users\\GodfredBoakye\\Desktop\\Buzzpay\\src\\app\\pools\\create\\page.tsx"
timestamp: 2026-11-09T14-49-19Z
slug: src-app-pools-create-page-tsx
---
## Design Health Score: 16/40 (Poor)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No loading state on submit |
| 2 | Match System / Real World | 3 | Culturally resonant, minor jargon leak |
| 3 | User Control and Freedom | 2 | No draft persistence |
| 4 | Consistency and Standards | 2 | Pill CTA, rogue colors, wrong dimensions |
| 5 | Error Prevention | 1 | No validation |
| 6 | Recognition Rather Than Recall | 3 | Placeholders help, emoji unlabeled |
| 7 | Flexibility and Efficiency | 1 | No keyboard submit |
| 8 | Aesthetic and Minimalist Design | 2 | Clean but barren |
| 9 | Error Recovery | 0 | alert() only |
| 10 | Help and Documentation | 1 | Minimal helper text |

## Priority Issues
- P0: Banned emojis used as gang avatars
- P0: Pill-shaped CTA button (rounded-full)
- P1: Error handling is alert() dialogs
- P1: No loading feedback on submit
- P2: Value proposition absent from conversion page

## Persona Red Flags
- Jordan: Jargon, no required field indicators
- Casey: No state persistence, missing areas
- Adunni: No savings info, IA priority inversion
