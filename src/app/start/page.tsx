"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

type Step = "intro" | "phone" | "name" | "pin" | "confirmPin";

export default function StartPage() {
  const [step, setStep] = useState<Step>("intro");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [pinCode, setPinCode] = useState(["", "", "", ""]);
  const [confirmPinCode, setConfirmPinCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSetPin(pin: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim().replace(/\s/g, ""), pin, firstName: firstName.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed"); setLoading(false); return; }
      if (data.data.firstName && data.data.firstName !== "User") { setFirstName(data.data.firstName); }
      window.location.href = "/discover";
    } catch { setError("Network error."); }
    setLoading(false);
  }

  async function handleSetName() {
    if (!firstName.trim()) return;
    setStep("pin");
  }

  function handlePinInput(arr: string[], setArr: (v: string[]) => void, i: number, v: string, prefix: string, onComplete?: (full: string) => void) {
    if (!/^\d*$/.test(v)) return;
    const c = [...arr]; c[i] = v.slice(-1); setArr(c);
    if (v && i < 3) document.getElementById(`${prefix}-${i + 1}`)?.focus();
    if (v && i === 3) { const full = c.join(""); if (full.length === 4 && onComplete) onComplete(full); }
  }

  function handlePinKeyDown(arr: string[], i: number, key: string, prefix: string) {
    if (key === "Backspace" && !arr[i] && i > 0) document.getElementById(`${prefix}-${i - 1}`)?.focus();
  }

  const btnPrimary = "w-full bg-[var(--coral)] text-white font-bold text-[16px] h-[56px] rounded-full active:scale-[0.97] transition-all hover:bg-[var(--coral-dark)] cursor-pointer disabled:bg-[var(--border)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:hover:bg-[var(--border)]";
  const btnOutline = "w-full bg-white text-[var(--text)] font-semibold text-[15px] h-[52px] rounded-full border-2 border-[var(--border)] hover:border-[var(--text-muted)] transition-colors cursor-pointer";
  const inputCls = "w-full px-5 h-[56px] bg-white border-2 border-[var(--border)] rounded-[16px] text-[16px] text-[var(--text)] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all placeholder:text-[var(--text-muted)]";
  const errorBox = (msg: string) => msg ? <div className="bg-red-50 text-[var(--coral)] text-[14px] font-medium px-4 py-3 rounded-[14px] mb-5">{msg}</div> : null;
  const shell = (children: React.ReactNode) => <main className="min-h-svh flex flex-col" style={{ background: "var(--bg)" }}><div className="flex-1 max-w-[440px] w-full mx-auto px-6 py-10">{children}</div></main>;
  const back = (to: Step) => (
    <button type="button" onClick={() => { setStep(to); setError(""); }} className="w-10 h-10 rounded-full bg-white border border-[var(--border)] flex items-center justify-center mb-8 hover:bg-[var(--sand)] transition-colors cursor-pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
    </button>
  );

  /* ═══════════════════════════════════════════════════ */
  /*  INTRO — the hero screen                            */
  /* ═══════════════════════════════════════════════════ */
  if (step === "intro") {
    return (
      <main className="min-h-svh flex flex-col" style={{ background: "var(--dark)" }}>
        {/* Dark hero top */}
        <div className="relative px-6 pt-12 pb-16 text-center overflow-hidden">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 50% 0%, var(--coral) 0%, transparent 70%)" }} />

          <div className="relative">
            <div className="flex justify-center mb-8">
              <Logo size={26} variant="white" />
            </div>
            <h1 className="text-[clamp(32px,8vw,44px)] font-extrabold text-white tracking-[-0.03em] leading-[1.05] mb-4">
              Buy together.<br />Pay less.
            </h1>
            <p className="text-[16px] text-white/50 max-w-[320px] mx-auto leading-relaxed">
              Join group deals near you. More people = lower prices for everyone.
            </p>
          </div>
        </div>

        {/* White content card — overlaps the dark hero */}
        <div className="flex-1 -mt-4 rounded-t-[28px] px-6 pt-8 pb-10" style={{ background: "var(--bg)" }}>
          {/* Social proof */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {[
                { bg: "var(--coral)", i: "AO" },
                { bg: "var(--emerald)", i: "CE" },
                { bg: "var(--gold)", i: "TK" },
                { bg: "var(--dark)", i: "BN" },
              ].map((a, idx) => (
                <div key={idx} className="w-8 h-8 rounded-full border-[2.5px] border-[var(--bg)] flex items-center justify-center text-[9px] font-bold text-white" style={{ background: a.bg, zIndex: 4 - idx }}>
                  {a.i}
                </div>
              ))}
            </div>
            <span className="text-[14px] font-medium text-[var(--text-secondary)]">Thousands of Lagosians saving</span>
          </div>

          {/* Steps — timeline aesthetic */}
          <div className="relative mb-8">
            {/* Vertical connector line */}
            <div className="absolute left-[19px] top-[44px] bottom-[44px] w-[2px]" style={{ background: "var(--border)" }} />

            <div className="space-y-5">
              {[
                { n: "1", color: "var(--coral)", t: "Browse deals near you", d: "See the group price on every product" },
                { n: "2", color: "#25d366", t: "Join or start a group", d: "Share the link on WhatsApp. Friends tap to join." },
                { n: "3", color: "var(--emerald)", t: "Group fills, everyone saves", d: "Didn\u2019t fill? Full refund. Zero risk." },
              ].map((s, i) => (
                <div key={i} className="flex gap-4 items-start relative">
                  <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] font-extrabold text-white shrink-0 relative z-10" style={{ background: s.color }}>
                    {s.n}
                  </div>
                  <div className="pt-1.5">
                    <div className="text-[16px] font-bold text-[var(--text)]">{s.t}</div>
                    <div className="text-[14px] text-[var(--text-secondary)] mt-0.5">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zero risk callout */}
          <div className="rounded-[20px] p-5 mb-8 relative overflow-hidden" style={{ background: "var(--dark)" }}>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--emerald)] mb-0.5">Zero risk</div>
                <div className="text-[16px] text-white font-semibold">Group didn&apos;t fill? Full refund.</div>
                <div className="text-[14px] text-white/50">No lock-in. No penalty. Every kobo back.</div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full border border-white/[0.04]" />
          </div>

          {/* CTA */}
          <button type="button" onClick={() => setStep("phone")} className={btnPrimary}>
            Get started
          </button>
          <p className="text-[14px] text-[var(--text-muted)] text-center mt-3">Free forever. No card needed.</p>

          <div className="mt-6 text-center">
            <span className="text-[14px] text-[var(--text-secondary)]">Already have an account? </span>
            <a href="/auth" className="text-[14px] font-bold text-[var(--coral)]">Log in</a>
          </div>
        </div>
      </main>
    );
  }

  /* ═══════════════════ PHONE ═══════════════════ */
  if (step === "phone") {
    return shell(<>
      {back("intro")}
      {/* Visual icon */}
      <div className="w-14 h-14 rounded-[16px] bg-[var(--coral)]/10 flex items-center justify-center mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
      </div>
      <div className="mb-8">
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">What&apos;s your<br />phone number?</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">You&apos;ll create a 4-digit PIN to log in</p>
      </div>
      {errorBox(error)}
      {/* Phone input — Nigerian flag as SVG */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 bg-white rounded-[16px] border-2 border-[var(--border)] px-4 h-[56px] shrink-0">
            {/* NG flag as inline SVG */}
            <svg width="24" height="16" viewBox="0 0 24 16" className="rounded-[2px] shrink-0">
              <rect width="8" height="16" fill="#008751" />
              <rect x="8" width="8" height="16" fill="white" />
              <rect x="16" width="8" height="16" fill="#008751" />
            </svg>
            <span className="text-[16px] font-semibold text-[var(--text)]">+234</span>
          </div>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="812 345 6789" className={inputCls} autoFocus />
        </div>
      </div>
      <button type="button" onClick={() => { setError(""); setStep("name"); }} disabled={phone.replace(/\s/g, "").length < 10} className={btnPrimary}>
        Continue
      </button>
      {/* Trust signal */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <span className="text-[13px] text-[var(--text-muted)]">Your number is encrypted and never shared</span>
      </div>
    </>);
  }

  /* ═══════════════════ PIN ═══════════════════ */
  if (step === "pin") {
    return shell(<>
      {back("name")}
      <div className="w-14 h-14 rounded-[16px] bg-[var(--coral)]/10 flex items-center justify-center mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      </div>
      <div className="mb-8">
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">Create your PIN</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">4 digits you&apos;ll use to log in</p>
      </div>
      {errorBox(error)}
      <div className="flex justify-center gap-3 mb-8">
        {pinCode.map((d, i) => (
          <input key={i} id={`pin-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
            onChange={(e) => handlePinInput(pinCode, setPinCode, i, e.target.value, "pin", () => { setStep("confirmPin"); setConfirmPinCode(["","","",""]); setTimeout(() => document.getElementById("cpin-0")?.focus(), 100); })}
            onKeyDown={(e) => handlePinKeyDown(pinCode, i, e.key, "pin")}
            className="w-[64px] h-[64px] text-center text-[24px] font-extrabold bg-white border-2 border-[var(--border)] rounded-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all"
            autoFocus={i === 0} />
        ))}
      </div>
      <p className="text-[13px] text-center text-[var(--text-muted)]">Choose something you&apos;ll remember</p>
    </>);
  }

  /* ═══════════════════ CONFIRM PIN ═══════════════════ */
  if (step === "confirmPin") {
    return shell(<>
      {back("pin")}
      <div className="w-14 h-14 rounded-[16px] bg-[var(--emerald)]/10 flex items-center justify-center mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      </div>
      <div className="mb-8">
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">Confirm your PIN</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">Enter it one more time</p>
      </div>
      {errorBox(error)}
      <div className="flex justify-center gap-3 mb-8">
        {confirmPinCode.map((d, i) => (
          <input key={i} id={`cpin-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
            onChange={(e) => handlePinInput(confirmPinCode, setConfirmPinCode, i, e.target.value, "cpin", (full) => {
              const original = pinCode.join("");
              if (full !== original) { setError("PINs don't match. Try again."); setConfirmPinCode(["","","",""]); setTimeout(() => document.getElementById("cpin-0")?.focus(), 100); }
              else { handleSetPin(full); }
            })}
            onKeyDown={(e) => handlePinKeyDown(confirmPinCode, i, e.key, "cpin")}
            className="w-[64px] h-[64px] text-center text-[24px] font-extrabold bg-white border-2 border-[var(--border)] rounded-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all"
            autoFocus={i === 0} />
        ))}
      </div>
      {loading && <p className="text-[15px] text-[var(--text-secondary)] text-center mb-4">Creating account...</p>}
    </>);
  }

  /* ═══════════════════ NAME ═══════════════════ */
  if (step === "name") {
    return shell(<>
      <div className="mb-10">
        <div className="w-14 h-14 rounded-full bg-[var(--coral)]/10 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">What should we<br />call you?</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">This is how others see you in groups</p>
      </div>
      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Amaka" className={`${inputCls} mb-6`} autoFocus />
      <button type="button" onClick={handleSetName} disabled={loading || !firstName.trim()} className={btnPrimary}>
        {loading ? "..." : "Continue"}
      </button>
    </>);
  }

  return null;
}
