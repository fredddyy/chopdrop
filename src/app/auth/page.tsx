"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { saveCustomerProfile } from "@/lib/customer";

type Step = "phone" | "otp" | "name" | "welcome";

export default function AuthPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", ""]);
  const [testCode, setTestCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function getReturnUrl(): string {
    if (typeof window === "undefined") return "/menu";
    const params = new URLSearchParams(window.location.search);
    return params.get("returnTo") || "/menu";
  }

  async function handleSendOtp() {
    const clean = phone.trim().replace(/\s/g, "");
    if (clean.length < 10) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: clean }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed"); setLoading(false); return; }
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
      if (data.data.office) {
        saveCustomerProfile({ name: data.data.firstName, phone: data.data.phone, email: "", deliveryAddress: "", preferredFulfillment: "PICKUP", officeId: data.data.office.id, officeName: data.data.office.name, officeCode: data.data.office.code, collectionPoint: data.data.office.collectionPoint });
      }
      if (data.data.firstName && data.data.firstName !== "User") {
        setFirstName(data.data.firstName);
        setOfficeName(data.data.office?.name || "");
        setStep("welcome");
        setTimeout(() => { window.location.href = getReturnUrl(); }, 2000);
      } else {
        setStep("name");
      }
    } catch { setError("Network error."); }
    setLoading(false);
  }

  async function handleSetName() {
    if (!firstName.trim()) return;
    setLoading(true);
    try { await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otpToken, code: otpCode.join(""), firstName: firstName.trim() }) }); } catch {}
    setLoading(false);
    window.location.href = getReturnUrl();
  }

  function handleOtpInput(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const c = [...otpCode]; c[i] = v.slice(-1); setOtpCode(c);
    if (v && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
    if (v && i === 3) { const full = c.join(""); if (full.length === 4) handleVerifyOtp(full); }
  }

  function handleOtpKeyDown(i: number, key: string) {
    if (key === "Backspace" && !otpCode[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  }

  const btnPrimary = "w-full h-[56px] rounded-full text-[16px] font-bold text-white active:scale-[0.97] transition-all cursor-pointer disabled:bg-[var(--border)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed";
  const inputCls = "w-full px-5 h-[56px] bg-white border-2 border-[var(--border)] rounded-[16px] text-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all placeholder:text-[var(--text-muted)]";
  const shell = (children: React.ReactNode) => (
    <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-[400px] w-full">{children}</div>
    </main>
  );

  // ── PHONE ──
  if (step === "phone") {
    return shell(
      <>
        <div className="flex items-center justify-center mb-10"><Logo size={28} /></div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-center mb-2" style={{ color: "var(--text)" }}>Welcome back</h1>
        <p className="text-[16px] text-center mb-8" style={{ color: "var(--text-secondary)" }}>Enter your phone number to continue</p>

        {error && <div className="p-3 rounded-[14px] mb-4 text-[14px] font-medium" style={{ background: "#FEF2F2", color: "var(--coral)" }}>{error}</div>}

        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex items-center gap-2.5 bg-white rounded-[16px] border-2 px-4 h-[56px] shrink-0" style={{ borderColor: "var(--border)" }}>
            <svg width="24" height="16" viewBox="0 0 24 16" className="rounded-[2px] shrink-0"><rect width="8" height="16" fill="#008751" /><rect x="8" width="8" height="16" fill="white" /><rect x="16" width="8" height="16" fill="#008751" /></svg>
            <span className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>+234</span>
          </div>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="812 345 6789" className={inputCls} autoFocus />
        </div>

        <button type="button" onClick={handleSendOtp} disabled={loading || phone.replace(/\s/g, "").length < 10} className={btnPrimary} style={{ background: loading || phone.replace(/\s/g, "").length < 10 ? undefined : "var(--coral)" }}>
          {loading ? "Sending code..." : "Continue"}
        </button>

        <div className="text-center mt-8 space-y-2">
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Don&apos;t have an account? <a href="/start" className="font-bold" style={{ color: "var(--coral)" }}>Set up your office</a></p>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Changed your number? <a href="https://wa.me/2349120532827" className="underline" style={{ color: "var(--text-muted)" }}>WhatsApp us</a></p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Your number is encrypted and never shared</span>
        </div>
      </>
    );
  }

  // ── OTP ──
  if (step === "otp") {
    return shell(
      <>
        <button type="button" onClick={() => { setStep("phone"); setOtpCode(["","","",""]); setError(""); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-8 cursor-pointer" style={{ border: "1px solid var(--border)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6" style={{ background: "rgba(13,159,95,0.1)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
        </div>

        <h2 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: "var(--text)" }}>Enter verification code</h2>
        <p className="text-[16px] mb-8" style={{ color: "var(--text-secondary)" }}>Sent to <span className="font-bold" style={{ color: "var(--text)" }}>{phone}</span></p>

        {testCode && (
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-5 py-5 mb-6 text-center">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2">Test mode</div>
            <div className="text-[36px] font-extrabold tracking-[0.3em] leading-none" style={{ color: "var(--text)" }}>{testCode}</div>
          </div>
        )}

        {error && <div className="p-3 rounded-[14px] mb-4 text-[14px] font-medium" style={{ background: "#FEF2F2", color: "var(--coral)" }}>{error}</div>}

        <div className="flex justify-center gap-3 mb-8">
          {otpCode.map((d, i) => (
            <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={(e) => handleOtpInput(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e.key)}
              className="w-[64px] h-[64px] text-center text-[24px] font-extrabold bg-white border-2 rounded-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              autoFocus={i === 0} />
          ))}
        </div>

        {loading && <p className="text-[14px] text-center mb-4" style={{ color: "var(--text-secondary)" }}>Verifying...</p>}

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>Resend in {resendTimer}s</p>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={handleSendOtp} className="text-[14px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>Resend SMS</button>
              <div className="w-1 h-1 rounded-full" style={{ background: "var(--border)" }} />
              <button type="button" onClick={handleSendOtp} className="text-[14px] font-bold cursor-pointer" style={{ color: "#25d366" }}>WhatsApp</button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── NAME (new users) ──
  if (step === "name") {
    return shell(
      <>
        <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6" style={{ background: "rgba(232,96,76,0.1)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
        <h2 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: "var(--text)" }}>What should we call you?</h2>
        <p className="text-[16px] mb-8" style={{ color: "var(--text-secondary)" }}>This name goes on your lunch bag</p>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Tunde" className={`${inputCls} mb-6`} autoFocus />
        <button type="button" onClick={handleSetName} disabled={loading || !firstName.trim()} className={btnPrimary} style={{ background: loading || !firstName.trim() ? undefined : "var(--coral)" }}>
          {loading ? "..." : "Continue"}
        </button>
      </>
    );
  }

  // ── WELCOME BACK ──
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--dark)" }}>
      <div className="text-center" style={{ animation: "fu .5s ease" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--emerald)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>
        <h2 className="text-[26px] font-extrabold text-white tracking-[-0.02em] mb-2">Welcome back, {firstName}!</h2>
        {officeName && <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--emerald)" }}>{officeName}</p>}
        <p className="text-[14px] text-white/40 mt-4 animate-pulse">Taking you to the menu...</p>
      </div>
    </main>
  );
}
