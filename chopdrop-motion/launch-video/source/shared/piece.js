/* ChopDrop Launch Video v2 — Premium Motion Physics
   Every element has its own entrance physics. Zero uniform fades. */

window.buildPieceTimeline = function () {
  var tl = gsap.timeline({ paused: true });

  // Easing library — no linear, no uniform
  var slam = "power4.out";
  var elastic = "elastic.out(1, 0.5)";
  var spring = "back.out(1.7)";
  var gentle = "power2.out";
  var sharp = "power3.in";

  // ═══════════════════════════════════════════════
  // SCENE 1: "The Tax" (0–3s)
  // ₦32,000 SLAMS from 150% scale with blur feel
  // Flash on impact. Sub wipes in from left.
  // ═══════════════════════════════════════════════

  // Impact flash fires first
  tl.fromTo("#s1-flash",
    { opacity: 0 },
    { opacity: 1, duration: 0.08 },
    0.08
  );
  tl.to("#s1-flash",
    { opacity: 0, duration: 0.4, ease: gentle },
    0.16
  );

  // Main number SLAMS down from 150% — punch-in kinetic text
  tl.fromTo("#s1-line1",
    { opacity: 0, scale: 1.5, y: -30 },
    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: slam },
    0.1
  );

  // Subtle camera shake on impact
  tl.fromTo("#scene1",
    { x: 0 },
    { x: 8, duration: 0.04 },
    0.12
  );
  tl.to("#scene1",
    { x: -5, duration: 0.04 },
    0.16
  );
  tl.to("#scene1",
    { x: 3, duration: 0.04 },
    0.20
  );
  tl.to("#scene1",
    { x: 0, duration: 0.06 },
    0.24
  );

  // Sub text slides in from left — NOT a fade
  tl.fromTo("#s1-sub",
    { opacity: 0, x: -60 },
    { opacity: 0.65, x: 0, duration: 0.5, ease: gentle },
    0.8
  );

  // Exit: entire scene scales down and fades — "sucked away"
  tl.to("#scene1",
    { scale: 0.92, opacity: 0, duration: 0.35, ease: sharp },
    2.65
  );

  // ═══════════════════════════════════════════════
  // SCENE 2: "The App" (3–9s)
  // Phone springs up from below with elastic overshoot
  // Label words stagger in. Phone floats on sine wave.
  // ═══════════════════════════════════════════════

  // Phone springs up with overshoot
  tl.fromTo("#phone-frame",
    { opacity: 0, y: 200, scale: 0.85, rotation: -3 },
    { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 0.9, ease: elastic },
    3.1
  );

  // Label slides up with spring
  tl.fromTo("#s2-label",
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.6, ease: spring },
    4.0
  );

  // Phone continuous sine-wave float
  tl.to("#phone-frame", {
    y: -12, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: 2
  }, 4.5);

  // Exit: phone slides down and away
  tl.to("#phone-frame",
    { y: 80, opacity: 0, scale: 0.9, duration: 0.4, ease: sharp },
    8.4
  );
  tl.to("#s2-label",
    { opacity: 0, y: -20, duration: 0.25, ease: sharp },
    8.4
  );
  tl.to("#scene2",
    { opacity: 0, duration: 0.2 },
    8.8
  );

  // ═══════════════════════════════════════════════
  // SCENE 3: "The Free Drop" (9–15s)
  // Card materializes with frost blur. FREE explodes
  // from zero with elastic overshoot + glow expansion.
  // Comparison slashes in.
  // ═══════════════════════════════════════════════

  // Card drops in with spring
  tl.fromTo("#free-card",
    { opacity: 0, scale: 0.7, y: 60 },
    { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: spring },
    9.2
  );

  // FREE explodes from zero — elastic overshoot
  tl.fromTo("#free-badge",
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.6, ease: elastic },
    9.9
  );

  // Glow ring expands outward from FREE
  tl.fromTo("#free-glow",
    { opacity: 0, scale: 0.3 },
    { opacity: 1, scale: 1.5, duration: 0.5, ease: gentle },
    10.0
  );
  tl.to("#free-glow",
    { opacity: 0, scale: 2, duration: 0.8, ease: gentle },
    10.5
  );

  // FREE subtle breathing pulse
  tl.to("#free-badge", {
    scale: 1.08, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3
  }, 10.8);

  // Comparison line slashes in from right
  tl.fromTo("#s3-compare",
    { opacity: 0, x: 80 },
    { opacity: 1, x: 0, duration: 0.5, ease: slam },
    11.5
  );

  // Exit scene 3
  tl.to("#free-card",
    { y: -40, opacity: 0, duration: 0.3, ease: sharp },
    14.3
  );
  tl.to("#s3-compare",
    { opacity: 0, duration: 0.2 },
    14.4
  );
  tl.to("#scene3",
    { opacity: 0, duration: 0.2 },
    14.6
  );

  // ═══════════════════════════════════════════════
  // SCENE 4: "The Code" (15–18s)
  // Checkmark snaps with scale overshoot.
  // Code card drops from above like a physical ticket
  // with shadow growing beneath.
  // ═══════════════════════════════════════════════

  // Checkmark snaps in — scale from 0 with overshoot
  tl.fromTo("#s4-check",
    { opacity: 0, scale: 0, rotation: -90 },
    { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: spring },
    15.1
  );

  // Title slides up
  tl.fromTo("#s4-title",
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.4, ease: gentle },
    15.5
  );

  // Code card drops from above — physical ticket physics
  tl.fromTo("#s4-code-card",
    { opacity: 0, y: -80, scale: 1.05 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: spring },
    15.9
  );

  // Sub text fades up
  tl.fromTo("#s4-sub",
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.35, ease: gentle },
    16.5
  );

  // Exit: scene fades with slight scale
  tl.to("#scene4",
    { opacity: 0, scale: 0.96, duration: 0.3, ease: sharp },
    17.7
  );

  // ═══════════════════════════════════════════════
  // SCENE 5: "The Flex" (18–21s)
  // Lines WIPE in from left (not fade). Each line has
  // its own delay. Coral accent hits with weight.
  // Logo scales up incrementally. Silence is the design.
  // ═══════════════════════════════════════════════

  // Line 1 wipes from left
  tl.fromTo("#s5-line1",
    { opacity: 0, x: -50 },
    { opacity: 1, x: 0, duration: 0.35, ease: slam },
    18.1
  );

  // Line 2 wipes from left — slightly delayed
  tl.fromTo("#s5-line2",
    { opacity: 0, x: -50 },
    { opacity: 1, x: 0, duration: 0.35, ease: slam },
    18.6
  );

  // Coral accent SLAMS in — this is the punchline
  tl.fromTo("#s5-line3",
    { opacity: 0, scale: 1.15, y: 10 },
    { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: spring },
    19.1
  );

  // Logo scales up gently — premium editorial
  tl.fromTo("#s5-logo",
    { opacity: 0, scale: 0.85 },
    { opacity: 0.7, scale: 1, duration: 0.6, ease: gentle },
    19.7
  );

  // Slow continuous scale — breathing, alive
  tl.to("#s5-logo", {
    scale: 1.02, duration: 1, ease: "sine.inOut"
  }, 20.0);

  // Location fades in last
  tl.fromTo("#s5-location",
    { opacity: 0 },
    { opacity: 1, duration: 0.4, ease: gentle },
    20.0
  );

  return tl;
};
