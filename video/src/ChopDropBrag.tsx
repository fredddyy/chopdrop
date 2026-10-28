import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Shared styles ──
const manrope = { fontFamily: "Manrope, sans-serif" };
const dmSans = { fontFamily: "DM Sans, sans-serif" };

// ── Scene 1: The Tax (0-3s = frames 0-89) ──
const SceneTax: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter: 0 → 32000 over 1.4s (42 frames), accelerating
  const counterProgress = interpolate(frame, [3, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const counterValue = Math.round(32000 * Math.pow(counterProgress, 2.5));

  // Number opacity
  const numOpacity = interpolate(frame, [2, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Accent line
  const lineScale = interpolate(frame, [45, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineOpacity = interpolate(frame, [44, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "every month" slides up
  const subY = interpolate(frame, [48, 56], [25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [48, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "Just delivery fees" fades in
  const whisperOpacity = interpolate(frame, [63, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Grain drift
  const grainX = interpolate(frame, [0, 89], [0, -30], { extrapolateRight: "clamp" });
  const grainY = interpolate(frame, [0, 89], [0, -20], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Lagos backdrop */}
      <Img src="https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=1080&h=1920&fit=crop"
        style={{ position: "absolute", inset: 0, width: "115%", height: "115%", objectFit: "cover", filter: "blur(20px) brightness(0.12) saturate(0.7)", transform: `scale(1.15) translate(-5%, -5%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.7) 100%)" }} />

      {/* Grain */}
      <div style={{ position: "absolute", inset: "-20%", width: "140%", height: "140%", opacity: 0.05, mixBlendMode: "overlay", transform: `translate(${grainX}px, ${grainY}px)`,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)'/%3E%3C/svg%3E")` }} />

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", zIndex: 3, position: "relative" }}>
        <div style={{ ...manrope, fontWeight: 800, fontSize: 140, color: "#f05f4b", letterSpacing: "-0.05em", textAlign: "center", lineHeight: 1, opacity: numOpacity }}>
          ₦{counterValue.toLocaleString()}
        </div>
        <div style={{ width: 120, height: 4, background: "#f05f4b", borderRadius: 2, marginTop: 14, transform: `scaleX(${lineScale})`, opacity: lineOpacity }} />
        <div style={{ ...manrope, fontWeight: 600, fontSize: 44, color: "#fff", textAlign: "center", marginTop: 8, transform: `translateY(${subY}px)`, opacity: subOpacity }}>
          every month.
        </div>
        <div style={{ ...dmSans, fontSize: 28, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 10, opacity: whisperOpacity }}>
          Just delivery fees.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Phone Frame Component ──
const PhoneFrame: React.FC<{ children: React.ReactNode; bgColor?: string }> = ({ children, bgColor = "#fff" }) => (
  <div style={{ width: 460, height: 940, background: "#111", borderRadius: 52, padding: 12, position: "relative",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.7), 0 60px 120px rgba(0,0,0,0.3)" }}>
    {/* Notch */}
    <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 140, height: 36, background: "#0a0a0a", borderRadius: 20, zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: bgColor }}>
      {/* iOS Status Bar */}
      <div style={{ height: 54, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 30px 8px", fontSize: 15, fontWeight: 600, color: "#1a1a1a", background: bgColor }}>
        <span>11:51</span>
        <span style={{ fontSize: 13 }}>MTN-NG &nbsp; <span style={{ color: "#f05f4b" }}>14%</span></span>
      </div>
      {children}
    </div>
  </div>
);

// ── Scene 2: Menu (3-9s = frames 90-269) ──
const SceneMenu: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - 90;

  // Phone enters from below with spring
  const phoneY = spring({ frame: localFrame, fps, config: { damping: 15, mass: 0.8, stiffness: 80 } });
  const entryY = interpolate(phoneY, [0, 1], [400, 0]);
  const entryScale = interpolate(phoneY, [0, 1], [0.9, 1]);

  // Micro drift
  const driftX = Math.sin(localFrame * 0.03) * 3;
  const driftR = Math.sin(localFrame * 0.025) * 0.3;

  // Tab switch at localFrame 105 (6.5s absolute)
  const isLunch = localFrame > 105;
  const tabSpring = spring({ frame: Math.max(0, localFrame - 105), fps, config: { damping: 8, stiffness: 200 } });
  const tabScaleX = isLunch ? interpolate(tabSpring, [0, 0.3, 1], [0.94, 0.94, 1]) : 1;

  // Touch indicator
  const touchOpacity = interpolate(localFrame, [102, 105, 108, 112], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const touchScale = interpolate(localFrame, [102, 105, 112], [0.3, 1, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Office backdrop */}
      <Img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080&h=1920&fit=crop"
        style={{ position: "absolute", inset: 0, width: "115%", height: "115%", objectFit: "cover", filter: "blur(28px) brightness(0.3) saturate(1.1)", transform: "scale(1.15) translate(-5%, -5%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.6) 100%)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", transform: `translateY(${entryY}px) translateX(${driftX}px) scale(${entryScale}) rotate(${driftR}deg)` }}>
        <PhoneFrame>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ width: 24, height: 26, background: "#f05f4b", borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", marginRight: 8 }} />
            <span style={{ ...manrope, fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>ChopDrop</span>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, margin: "12px 20px" }}>
            <div style={{ flex: 1, padding: 13, borderRadius: 14, textAlign: "center", fontSize: 14, fontWeight: 600,
              background: isLunch ? "#f5f5f3" : "#1a1a1a", color: isLunch ? "#9ca3af" : "#fff" }}>☀️ Breakfast</div>
            <div style={{ flex: 1, padding: 13, borderRadius: 14, textAlign: "center", fontSize: 14, fontWeight: 600,
              background: isLunch ? "#1a1a1a" : "#f5f5f3", color: isLunch ? "#fff" : "#9ca3af",
              transform: `scaleX(${tabScaleX})` }}>🍛 Lunch</div>
          </div>
          {/* Hero card */}
          <div style={{ margin: "8px 20px", background: "linear-gradient(135deg, #0f4030, #0a2e20)", borderRadius: 18, padding: "16px 18px", color: "#fff" }}>
            <div style={{ ...manrope, fontWeight: 700, fontSize: 16 }}>{isLunch ? "Lunch Drop" : "Breakfast Drop"}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{isLunch ? "Arrives 12:30 PM · Prepaid" : "Arrives 8:30 AM · Prepaid"}</div>
            <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
              {["0", "2", ":", "4", "1", ":", "0", "7"].map((d, i) =>
                d === ":" ? <span key={i} style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "flex", alignItems: "center", margin: "0 2px" }}>:</span>
                : <span key={i} style={{ width: 20, height: 24, background: "rgba(255,255,255,0.15)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#fff" }}>{d}</span>
              )}
            </div>
          </div>
          {/* Social proof */}
          <div style={{ margin: "8px 20px", display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#6b7280" }}>
            <div style={{ width: 5, height: 5, background: "#22c55e", borderRadius: "50%" }} />
            <span>12 orders placed for this drop</span>
          </div>
          {/* Restaurant cards */}
          {[
            { name: "Ajisafe Pepper Rice", meta: "3 meals · Ikeja", img: "https://res.cloudinary.com/rigeva3a/image/upload/v1791998598/chopdrop/ajisafe-pepper-rice.webp" },
            { name: "The Place", meta: "4 meals · Ikeja GRA", img: "https://res.cloudinary.com/rigeva3a/image/upload/v1792060589/chopdrop/the-place-restaurant.jpg" },
          ].map((r, i) => (
            <div key={i} style={{ margin: `${i === 0 ? 6 : 4}px 20px`, borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}>
              <Img src={r.img} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "10px 14px" }}>
                <div style={{ ...manrope, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{r.name}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{r.meta}</div>
              </div>
            </div>
          ))}
          {/* Touch indicator */}
          <div style={{ position: "absolute", left: 300, top: 210, width: 56, height: 56, background: "rgba(0,0,0,0.08)", borderRadius: "50%", opacity: touchOpacity, transform: `scale(${touchScale})`, zIndex: 50 }} />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: Checkout (9-15s = frames 270-449) ──
const SceneCheckout: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - 270;

  // Phone slides in from right
  const slideSpring = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 90 } });
  const entryX = interpolate(slideSpring, [0, 1], [500, 0]);

  // Drift
  const driftX = Math.sin(localFrame * 0.025) * -2;
  const driftR = Math.sin(localFrame * 0.02) * -0.2;

  // WhatsApp notification (at localFrame 90 = 12s absolute)
  const waFrame = localFrame - 90;
  const waY = waFrame < 0 ? -110 :
    waFrame < 12 ? interpolate(waFrame, [0, 9, 10, 11], [-110, 130, 124, 126], { extrapolateRight: "clamp" }) :
    waFrame < 156 ? 126 :
    interpolate(waFrame, [156, 165], [126, -110], { extrapolateRight: "clamp" });

  // Badge appears after WA dismisses
  const badgeOpacity = waFrame > 165 ? 1 : 0;
  const badgeScale = waFrame > 165 ? spring({ frame: waFrame - 165, fps, config: { damping: 6, stiffness: 200 } }) : 0;

  // Batch option glow (at localFrame 30 = 10s)
  const glowOpacity = interpolate(localFrame, [30, 38, 54, 62], [0, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&h=1920&fit=crop"
        style={{ position: "absolute", inset: 0, width: "115%", height: "115%", objectFit: "cover", filter: "blur(28px) brightness(0.3) saturate(1.1)", transform: "scale(1.15) translate(-5%, -5%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.6) 100%)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", transform: `translateX(${entryX + driftX}px) rotate(${driftR}deg)` }}>
        <PhoneFrame bgColor="#fafaf8">
          <div style={{ padding: "50px 22px 12px" }}>
            <div style={{ ...manrope, fontWeight: 700, fontSize: 20, color: "#1a1a1a", letterSpacing: "-0.03em" }}>Checkout</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>2 items · ₦1,600</div>
          </div>
          {/* Cart item */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 22px", padding: 14, background: "#fff", borderRadius: 16 }}>
            <Img src="https://res.cloudinary.com/rigeva3a/image/upload/v1791998598/chopdrop/ajisafe-pepper-rice.webp"
              style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>Jollof Rice & Beef</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Ajisafe Pepper Rice</div>
            </div>
            <div style={{ ...manrope, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>₦1,600</div>
          </div>
          {/* Delivery */}
          <div style={{ margin: "12px 22px 0" }}>
            <div style={{ ...manrope, fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>Delivery</div>
            <div style={{ padding: 14, borderRadius: 12, border: "2px solid #0f4030", background: "rgba(15,64,48,0.03)", display: "flex", alignItems: "center", gap: 12, marginBottom: 6,
              boxShadow: `0 0 0 ${glowOpacity > 0 ? 3 : 0}px rgba(34,197,94,${glowOpacity})` }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #0f4030", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 8, height: 8, background: "#0f4030", borderRadius: "50%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>Office Batch Drop <span style={{ background: "rgba(15,64,48,0.1)", color: "#0f4030", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase" as const, marginLeft: 6 }}>Free</span></div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Arrives together at 12:30 PM</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#22c55e" }}>FREE</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, border: "2px solid #f0efeb", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #d1d5db" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>Express Delivery</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Delivered to your address</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>₦1,200</div>
            </div>
          </div>
          {/* Tip */}
          <div style={{ margin: "10px 22px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ ...manrope, fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>Captain tip</span>
              <span style={{ fontSize: 9, color: "#9ca3af" }}>100% to assistant</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["₦100", "₦200", "₦500"].map((t, i) => (
                <div key={t} style={{ background: i === 0 ? "#1a1a1a" : "#f5f5f3", color: i === 0 ? "#fff" : "#1a1a1a", padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{t}</div>
              ))}
            </div>
          </div>
          {/* Summary */}
          <div style={{ margin: "10px 22px", padding: 12, background: "#fff", borderRadius: 12, fontSize: 11 }}>
            {[["Subtotal", "₦1,600", "#1a1a1a"], ["Delivery", "FREE", "#22c55e"]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#9ca3af" }}>{l}</span><span style={{ fontWeight: 600, color: c }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0efeb", paddingTop: 6, marginTop: 4 }}>
              <span style={{ fontWeight: 600 }}>Total</span><span style={{ ...manrope, fontWeight: 700, fontSize: 15 }}>₦1,780</span>
            </div>
          </div>
          {/* WhatsApp notification */}
          <div style={{ position: "absolute", top: 16, left: 18, right: 18, background: "rgba(255,255,255,0.97)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 28px rgba(0,0,0,0.12)", zIndex: 100, transform: `translateY(${waY}px)` }}>
            <div style={{ width: 36, height: 36, background: "#25D366", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>W</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>WhatsApp · Tunde</div>
              <div style={{ fontSize: 12, color: "#1a1a1a", marginTop: 1, lineHeight: 1.3 }}>Abeg, did the ChopDrop Captain reach our floor yet?</div>
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", alignSelf: "flex-start" }}>now</div>
          </div>
          {/* Badge */}
          <div style={{ position: "absolute", top: 58, right: 22, width: 18, height: 18, background: "#25D366", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", zIndex: 90, opacity: badgeOpacity, transform: `scale(${badgeScale})` }}>3</div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Confirmation (15-18s = frames 450-539) ──
const SceneConfirm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - 450;

  const scaleSpring = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 80 } });
  const phoneScale = interpolate(scaleSpring, [0, 1], [0.7, 1]);
  const phoneOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const checkScale = spring({ frame: Math.max(0, localFrame - 9), fps, config: { damping: 6, stiffness: 150 } });
  const titleOpacity = interpolate(localFrame, [18, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardSpring = spring({ frame: Math.max(0, localFrame - 27), fps, config: { damping: 8, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <Img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&h=1920&fit=crop"
        style={{ position: "absolute", inset: 0, width: "115%", height: "115%", objectFit: "cover", filter: "blur(28px) brightness(0.3) saturate(1.1)", transform: "scale(1.15) translate(-5%, -5%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.6) 100%)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", transform: `scale(${phoneScale})`, opacity: phoneOpacity }}>
        <PhoneFrame bgColor="#fafaf8">
          <div style={{ padding: "16px 22px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "#0f4030", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "8px 0", transform: `scale(${checkScale})` }}>
              <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, stroke: "#fff", fill: "none", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }}><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <div style={{ ...manrope, fontWeight: 700, fontSize: 20, color: "#1a1a1a", marginTop: 6, opacity: titleOpacity }}>You're all set!</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3, opacity: titleOpacity }}>Food arrives at 12:30</div>
          </div>
          <div style={{ margin: "0 22px", background: "#fff", borderRadius: 16, padding: 20, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", transform: `scale(${interpolate(cardSpring, [0, 1], [0.85, 1])})`, opacity: interpolate(cardSpring, [0, 1], [0, 1]) }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Collection code</div>
            <div style={{ ...manrope, fontWeight: 800, fontSize: 44, color: "#1a1a1a", letterSpacing: "0.04em", marginTop: 4, lineHeight: 1 }}>CD-B5AY</div>
            <div style={{ fontSize: 11, color: "#0f4030", fontWeight: 600, marginTop: 6 }}>Show this to your captain</div>
          </div>
          {/* What happens next */}
          <div style={{ margin: "12px 22px", padding: 12, background: "#fff", borderRadius: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>What happens next</div>
            {["Restaurant prepares your food", "Batch delivery at 12:30 PM", "Collect with code CD-B5AY"].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < 2 ? 6 : 0, alignItems: "flex-start" }}>
                <div style={{ minWidth: 18, height: 18, background: "#0f4030", borderRadius: "50%", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{step}</div>
              </div>
            ))}
          </div>
          <div style={{ margin: "8px 22px", display: "flex", gap: 6 }}>
            <div style={{ flex: 1, background: "#1a1a1a", color: "#fff", fontWeight: 600, fontSize: 12, padding: 11, borderRadius: 10, textAlign: "center" }}>Track order</div>
            <div style={{ flex: 1, background: "#f5f5f3", color: "#1a1a1a", fontWeight: 600, fontSize: 12, padding: 11, borderRadius: 10, textAlign: "center" }}>Order more</div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: The Flex (18-23s = frames 540-689) ──
const SceneFlex: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - 540;

  // Slow upward drift
  const driftY = interpolate(localFrame, [0, 150], [20, -10]);

  // Setup text
  const setupOpacity = interpolate(localFrame, [9, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const setupY = interpolate(localFrame, [9, 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Punchline SLAM
  const punchSpring = spring({ frame: Math.max(0, localFrame - 33), fps, config: { damping: 10, stiffness: 200 } });
  const punchScale = interpolate(punchSpring, [0, 1], [1.2, 1]);
  const punchOpacity = interpolate(punchSpring, [0, 1], [0, 1]);

  // Logo + tag
  const logoOpacity = interpolate(localFrame, [66, 81], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOpacity = interpolate(localFrame, [78, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pill
  const pillOpacity = interpolate(localFrame, [90, 98], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Cursor
  const cursorX = interpolate(localFrame, [102, 116], [250, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(localFrame, [102, 116], [350, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorOpacity = interpolate(localFrame, [102, 108, 116, 120], [0, 0.4, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pill tap
  const pillScale = interpolate(localFrame, [115, 117, 122], [1, 0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Swipe up exit
  const exitY = interpolate(localFrame, [141, 150], [0, -1920], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Grain
  const grainX = interpolate(localFrame, [0, 150], [0, -20]);

  return (
    <AbsoluteFill style={{ transform: `translateY(${exitY}px)` }}>
      <Img src="https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=1080&h=1920&fit=crop"
        style={{ position: "absolute", inset: 0, width: "115%", height: "115%", objectFit: "cover", filter: "blur(20px) brightness(0.12) saturate(0.7)", transform: "scale(1.15) translate(-5%, -5%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.7) 100%)" }} />
      <div style={{ position: "absolute", inset: "-20%", width: "140%", height: "140%", opacity: 0.05, mixBlendMode: "overlay" as const, transform: `translate(${grainX}px, ${grainX * 0.75}px)`,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)'/%3E%3C/svg%3E")` }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", zIndex: 3, position: "relative", transform: `translateY(${driftY}px)` }}>
        <div style={{ ...manrope, fontWeight: 500, fontSize: 40, color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 1.35, maxWidth: 820, opacity: setupOpacity, transform: `translateY(${setupY}px)` }}>
          Some people in your office<br />deleted that expense last week.
        </div>
        <div style={{ ...manrope, fontWeight: 800, fontSize: 80, color: "#f05f4b", textAlign: "center", lineHeight: 1, marginTop: 16, opacity: punchOpacity, transform: `scale(${punchScale})` }}>
          Nobody is talking.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32, opacity: logoOpacity }}>
          <div style={{ width: 40, height: 44, background: "#f05f4b", borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
          <span style={{ ...manrope, fontWeight: 800, fontSize: 30, color: "#fff", letterSpacing: "-0.03em" }}>ChopDrop</span>
        </div>
        <div style={{ fontSize: 16, color: "#6b7280", marginTop: 8, opacity: tagOpacity }}>Live in Ikeja</div>
        <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "10px 26px", marginTop: 20, display: "flex", alignItems: "center", gap: 8, opacity: pillOpacity, transform: `scale(${pillScale})` }}>
          <span style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>chopdrop-app.vercel.app</span>
        </div>
      </div>
      {/* Ghost cursor */}
      <div style={{ position: "absolute", width: 48, height: 48, background: "rgba(255,255,255,0.12)", borderRadius: "50%", zIndex: 10, left: "50%", top: "72%", marginLeft: -24, opacity: cursorOpacity, transform: `translate(${cursorX}px, ${cursorY}px)` }} />
    </AbsoluteFill>
  );
};

// ── Main Composition ──
export const ChopDropBrag: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Audio */}
      <Audio src={staticFile("music.mp3")} volume={0.12} />
      <Audio src={staticFile("voiceover.mp3")} volume={1} />

      {/* Scenes — hard cuts, no transitions */}
      {frame < 90 && <SceneTax />}
      {frame >= 90 && frame < 270 && <SceneMenu />}
      {frame >= 270 && frame < 450 && <SceneCheckout />}
      {frame >= 450 && frame < 540 && <SceneConfirm />}
      {frame >= 540 && <SceneFlex />}
    </AbsoluteFill>
  );
};
