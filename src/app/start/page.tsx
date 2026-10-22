"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";

type Step = "intro" | "phone" | "otp" | "name" | "choose" | "office" | "benefits" | "share";

export default function StartPage() {
  const [step, setStep] = useState<Step>("intro");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", ""]);
  const [testCode, setTestCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officeSize, setOfficeSize] = useState("20-40");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [officeData, setOfficeData] = useState<{ name: string; code: string; slug: string; joinLink: string; captainLink: string } | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function handleSendOtp() {
    const cleanPhone = phone.trim().replace(/\s/g, "");
    if (cleanPhone.length < 10) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: cleanPhone }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed to send code"); setLoading(false); return; }
      setOtpToken(data.data.otpToken);
      if (data.data.testCode) setTestCode(data.data.testCode);
      setResendTimer(60);
      setStep("otp");
    } catch { setError("Network error."); }
    setLoading(false);
  }

  async function handleVerifyOtp(code: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otpToken, code, firstName: firstName || undefined }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Wrong code"); setLoading(false); return; }
      if (data.data.firstName && data.data.firstName !== "User") { setFirstName(data.data.firstName); setStep("choose"); }
      else { setStep("name"); }
    } catch { setError("Network error."); }
    setLoading(false);
  }

  async function handleSetName() {
    if (!firstName.trim()) return;
    setLoading(true);
    try { await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otpToken, code: otpCode.join(""), firstName: firstName.trim() }) }); } catch {}
    setLoading(false);
    setStep("choose");
  }

  async function handleCreateOffice() {
    if (!officeName.trim() || !officeAddress.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/offices/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: officeName.trim(), address: officeAddress.trim(), size: officeSize }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed"); setLoading(false); return; }
      setOfficeData(data.data);
      setStep("share");
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function handleOtpInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const c = [...otpCode]; c[index] = value.slice(-1); setOtpCode(c);
    if (value && index < 3) document.getElementById(`otp-${index + 1}`)?.focus();
    if (value && index === 3) { const full = c.join(""); if (full.length === 4) handleVerifyOtp(full); }
  }

  function handleOtpKeyDown(index: number, key: string) {
    if (key === "Backspace" && !otpCode[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
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
              Your office eats<br />cheaper together
            </h1>
            <p className="text-[16px] text-white/50 max-w-[320px] mx-auto leading-relaxed">
              Become the Pool Captain. Set up in 2 minutes. Everyone saves.
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
            <span className="text-[14px] font-medium text-[var(--text-secondary)]">20+ Lagos offices onboard</span>
          </div>

          {/* Steps — timeline aesthetic */}
          <div className="relative mb-8">
            {/* Vertical connector line */}
            <div className="absolute left-[19px] top-[44px] bottom-[44px] w-[2px]" style={{ background: "var(--border)" }} />

            <div className="space-y-5">
              {[
                { n: "1", color: "var(--coral)", t: "Create your office pool", d: "Name & address — takes 30 seconds" },
                { n: "2", color: "#25d366", t: "Share via WhatsApp", d: "Colleagues tap to join. No app needed." },
                { n: "3", color: "var(--emerald)", t: "Everyone orders, food arrives", d: "₦0 delivery. More people = cheaper." },
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

          {/* Captain perks — standout card */}
          <div className="rounded-[20px] p-5 mb-8 relative overflow-hidden" style={{ background: "var(--dark)" }}>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gold)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--gold)] mb-0.5">Captain perks</div>
                <div className="text-[16px] text-white font-semibold">Free lunch daily</div>
                <div className="text-[14px] text-white/50">+ up to ₦10,000/month cash</div>
              </div>
            </div>
            {/* Decorative circle */}
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
        <p className="text-[16px] text-[var(--text-secondary)]">We&apos;ll send a 4-digit code via SMS</p>
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
      <button type="button" onClick={handleSendOtp} disabled={loading || phone.replace(/\s/g, "").length < 10} className={btnPrimary}>
        {loading ? "Sending..." : "Continue"}
      </button>
      {/* Trust signal */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <span className="text-[13px] text-[var(--text-muted)]">Your number is encrypted and never shared</span>
      </div>
    </>);
  }

  /* ═══════════════════ OTP ═══════════════════ */
  if (step === "otp") {
    return shell(<>
      {back("phone")}
      {/* Visual icon */}
      <div className="w-14 h-14 rounded-[16px] bg-[var(--emerald)]/10 flex items-center justify-center mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
      </div>
      <div className="mb-8">
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">Enter verification code</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">Sent to <span className="font-bold text-[var(--text)]">{phone}</span></p>
      </div>
      {testCode && (
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-5 py-5 mb-6 text-center">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2">Test mode</div>
          <div className="text-[36px] font-extrabold text-[var(--text)] tracking-[0.3em] leading-none">{testCode}</div>
        </div>
      )}
      {errorBox(error)}
      <div className="flex justify-center gap-3 mb-8">
        {otpCode.map((d, i) => (
          <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={(e) => handleOtpInput(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e.key)}
            className="w-[64px] h-[64px] text-center text-[24px] font-extrabold bg-white border-2 border-[var(--border)] rounded-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all"
            autoFocus={i === 0} />
        ))}
      </div>
      {loading && <p className="text-[15px] text-[var(--text-secondary)] text-center mb-4">Verifying...</p>}
      <div className="text-center">
        {resendTimer > 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">Resend in {resendTimer}s</p>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button type="button" onClick={handleSendOtp} className="text-[14px] font-bold text-[var(--coral)] cursor-pointer">Resend SMS</button>
            <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <button type="button" onClick={handleSendOtp} className="text-[14px] font-bold text-[#25d366] cursor-pointer">WhatsApp</button>
          </div>
        )}
      </div>
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
        <p className="text-[16px] text-[var(--text-secondary)]">Your colleagues will see this name</p>
      </div>
      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Amaka" className={`${inputCls} mb-6`} autoFocus />
      <button type="button" onClick={handleSetName} disabled={loading || !firstName.trim()} className={btnPrimary}>
        {loading ? "..." : "Continue"}
      </button>
    </>);
  }

  /* ═══════════════════ CHOOSE ═══════════════════ */
  if (step === "choose") {
    return shell(<>
      <div className="flex items-center justify-center mb-10"><Logo size={26} /></div>
      <div className="text-center mb-10">
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-2">Welcome, {firstName}</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">What brings you here?</p>
      </div>

      <button type="button" onClick={() => setStep("office")} className="w-full rounded-[20px] p-6 text-left mb-3 border-2 border-[var(--border)] hover:border-[var(--coral)] bg-white transition-all active:scale-[0.98] cursor-pointer group">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-[var(--coral)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
          </div>
          <div>
            <div className="text-[18px] font-bold text-[var(--text)]">Set up my office</div>
            <div className="text-[14px] text-[var(--text-secondary)] mt-0.5">I want to organize lunch for everyone</div>
          </div>
        </div>
      </button>

      <button type="button" onClick={() => { window.location.href = "/auth"; }} className="w-full rounded-[20px] p-6 text-left border-2 border-[var(--border)] hover:border-[var(--text-muted)] bg-white transition-all active:scale-[0.98] cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-[var(--sand)] flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
          </div>
          <div>
            <div className="text-[18px] font-bold text-[var(--text)]">I have an invite</div>
            <div className="text-[14px] text-[var(--text-secondary)] mt-0.5">Someone shared a link or code</div>
          </div>
        </div>
      </button>
    </>);
  }

  /* ═══════════════════ OFFICE ═══════════════════ */
  if (step === "office") {
    return shell(<>
      {back("choose")}
      <div className="mb-10">
        <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">Where does your<br />team work?</h2>
        <p className="text-[16px] text-[var(--text-secondary)]">This is where food gets delivered</p>
      </div>
      {errorBox(error)}
      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-[14px] font-bold text-[var(--text)] mb-2">Office name</label>
          <input type="text" value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="Sterling Bank HQ" className={inputCls} autoFocus />
        </div>
        <div>
          <label className="block text-[14px] font-bold text-[var(--text)] mb-2">Address</label>
          <input type="text" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="20 Marina St, Lagos Island" className={inputCls} />
        </div>
        <div>
          <label className="block text-[14px] font-bold text-[var(--text)] mb-2">How many people?</label>
          <select value={officeSize} onChange={(e) => setOfficeSize(e.target.value)} className={inputCls}>
            <option value="5-10">5-10 people</option>
            <option value="10-20">10-20 people</option>
            <option value="20-40">20-40 people</option>
            <option value="40-60">40-60 people</option>
            <option value="60+">60+ people</option>
          </select>
        </div>
      </div>
      <button type="button" onClick={() => setStep("benefits")} disabled={!officeName.trim() || !officeAddress.trim()} className={btnPrimary}>
        Continue
      </button>
    </>);
  }

  /* ═══════════════════ BENEFITS ═══════════════════ */
  if (step === "benefits") {
    return (
      <main className="min-h-svh flex flex-col" style={{ background: "var(--bg)" }}>
        <div className="flex-1 max-w-[440px] w-full mx-auto px-6 py-10">
          {back("office")}

          <div className="w-14 h-14 rounded-full bg-[var(--gold)] flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="text-[28px] font-extrabold text-[var(--text)] tracking-[-0.02em] leading-tight mb-2">
            You&apos;re the Captain<br />of {officeName}
          </h2>
          <p className="text-[16px] text-[var(--text-secondary)] mb-8">Here&apos;s what you unlock:</p>

          <div className="space-y-4 mb-10">
            {[
              { color: "var(--coral)", icon: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />, t: "Free lunch, every day", d: "15+ people order? Your meal is on us." },
              { color: "var(--emerald)", icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, t: "Up to ₦10K/month", d: "₦500 cash per pool with 20+ orders." },
              { color: "var(--text-secondary)", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, t: "One message a day", d: "Send the WhatsApp reminder. App does the rest." },
            ].map((b, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `color-mix(in srgb, ${b.color} 12%, transparent)` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={b.color as string} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                </div>
                <div>
                  <div className="text-[17px] font-bold text-[var(--text)]">{b.t}</div>
                  <div className="text-[15px] text-[var(--text-secondary)] mt-0.5">{b.d}</div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleCreateOffice} disabled={loading} className={btnPrimary}>
            {loading ? "Setting up..." : "Create my pool"}
          </button>
        </div>
      </main>
    );
  }

  /* ═══════════════════ SHARE ═══════════════════ */
  if (step === "share" && officeData) {
    const joinUrl = `${appUrl}/join/${officeData.slug}`;
    const waText = encodeURIComponent(`I set up ChopDrop for our office! Order lunch together & save up to 40%. ₦0 delivery.\n\nJoin here: ${joinUrl}\n\nPick your own meal, pay on your phone. Food arrives together.`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`;

    return (
      <main className="min-h-svh flex flex-col" style={{ background: "var(--bg)" }}>
        <div className="flex-1 max-w-[440px] w-full mx-auto px-6 py-10">
          {/* Success animation */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[var(--emerald)] flex items-center justify-center mx-auto mb-6" style={{ animation: "fu 0.5s ease" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h2 className="text-[28px] font-extrabold text-[var(--text)] mb-2">{officeData.name} is live!</h2>
            <p className="text-[16px] text-[var(--text-secondary)]">Share the link so colleagues can join</p>
          </div>

          {/* Office code — prominent */}
          <div className="bg-[var(--dark)] rounded-[20px] p-6 text-center mb-6">
            <div className="text-[13px] text-white/40 font-medium mb-2">Office code</div>
            <div className="text-[32px] font-extrabold text-white tracking-[0.15em]">{officeData.code}</div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-8">
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full bg-[#25d366] text-white font-bold text-[16px] h-[56px] rounded-full active:scale-[0.98] transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share to WhatsApp
            </a>
            <button type="button" onClick={() => navigator.clipboard.writeText(joinUrl)} className={btnOutline}>
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="4" width="11" height="14" rx="2" /><path d="M7 7H5.5A1.5 1.5 0 004 8.5v10A1.5 1.5 0 005.5 20H14a1.5 1.5 0 001.5-1.5V18" /></svg>
                Copy link
              </span>
            </button>
          </div>

          {/* QR */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code to join" className="w-[120px] h-[120px] mx-auto rounded-[12px]" />
            <p className="text-[13px] text-[var(--text-muted)] mt-3">Scan to join on another device</p>
          </div>

          <a href={officeData.captainLink || "/menu"} className={btnPrimary}>
            Open Captain Dashboard
          </a>
          <a href="/menu" className="block text-center text-[14px] font-semibold text-[var(--text-secondary)] mt-4 hover:text-[var(--text)] transition-colors">
            Skip for now
          </a>
        </div>
      </main>
    );
  }

  return null;
}
