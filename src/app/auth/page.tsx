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
  const [savings, setSavings] = useState("");
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

      // Save profile locally
      if (data.data.office) {
        saveCustomerProfile({ name: data.data.firstName, phone: data.data.phone, email: "", deliveryAddress: "", preferredFulfillment: "PICKUP", officeId: data.data.office.id, officeName: data.data.office.name, officeCode: data.data.office.code, collectionPoint: data.data.office.collectionPoint });
      }

      // Returning user — show welcome back
      if (data.data.firstName && data.data.firstName !== "User") {
        setFirstName(data.data.firstName);
        setOfficeName(data.data.office?.name || "");
        setStep("welcome");
        setTimeout(() => { window.location.href = getReturnUrl(); }, 2000);
      } else {
        // New user — ask for name
        setStep("name");
      }
    } catch { setError("Network error."); }
    setLoading(false);
  }

  async function handleSetName() {
    if (!firstName.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otpToken, code: otpCode.join(""), firstName: firstName.trim() }) });
    } catch { /* proceed */ }
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

  // ── PHONE ──
  if (step === "phone") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[400px] w-full">
          <div className="flex items-center justify-center mb-10"><Logo size={30} /></div>

          <h1 className="font-display font-[800] text-[28px] text-[#111827] tracking-[-0.03em] text-center mb-2">Welcome back</h1>
          <p className="text-[14px] text-[#6b7280] text-center mb-8">Enter your phone number to continue</p>

          {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-[#e2e8f0] px-3 py-3.5 text-[14px] text-[#6b7280] flex-shrink-0"><span>🇳🇬</span><span>+234</span></div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="812 345 6789" className="flex-1 px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20 focus:border-[#f05f4b]" autoFocus />
          </div>

          <button type="button" onClick={handleSendOtp} disabled={loading || phone.replace(/\s/g, "").length < 10} className="w-full bg-[#f05f4b] text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-40 active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 16px rgba(240,95,75,0.28)" }}>
            {loading ? "Sending code..." : "Send Code"}
          </button>

          <div className="text-center mt-6 space-y-1.5">
            <p className="text-[12px] text-[#6b7280]">Don&apos;t have an account? <a href="/start" className="text-[#f05f4b] font-semibold">Set up your office</a></p>
            <p className="text-[11px] text-[#9ca3af]">Changed your number? <a href="https://wa.me/2349120532827" className="text-[#9ca3af] underline">WhatsApp us</a></p>
          </div>
        </div>
      </main>
    );
  }

  // ── OTP ──
  if (step === "otp") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[400px] w-full">
          <button type="button" onClick={() => { setStep("phone"); setOtpCode(["","","",""]); setError(""); }} className="flex items-center gap-1 text-[12px] text-[#6b7280] mb-8">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>Back
          </button>

          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">Enter the code</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">Sent to <span className="font-semibold text-[#111827]">{phone}</span></p>

          {testCode && (
            <div className="bg-[#fffbf0] border border-[#f5c565]/30 rounded-2xl px-4 py-3 mb-4 text-center">
              <div className="text-[9px] font-bold text-[#92702a] uppercase tracking-[0.08em] mb-1">Test Mode — Your code:</div>
              <div className="font-display font-bold text-[28px] text-[#111827] tracking-[0.2em]">{testCode}</div>
            </div>
          )}

          {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

          <div className="flex justify-center gap-3 mb-6">
            {otpCode.map((d, i) => (
              <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d} onChange={(e) => handleOtpInput(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e.key)} className="w-14 h-14 text-center text-[22px] font-display font-bold bg-white border-2 border-[#e2e8f0] rounded-2xl focus:outline-none focus:border-[#f05f4b] focus:ring-2 focus:ring-[#f05f4b]/20" autoFocus={i === 0} />
            ))}
          </div>

          {loading && <p className="text-[12px] text-[#6b7280] text-center mb-4">Verifying...</p>}

          <div className="text-center">
            {resendTimer > 0 ? <p className="text-[11px] text-[#9ca3af]">Resend in {resendTimer}s</p> : (
              <div className="flex items-center justify-center gap-3">
                <button type="button" onClick={handleSendOtp} className="text-[12px] font-semibold text-[#f05f4b]">Resend code</button>
                <span className="text-[#d1d5db]">·</span>
                <button type="button" onClick={handleSendOtp} className="text-[12px] font-semibold text-[#25d366]">Resend via WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── NAME (new users) ──
  if (step === "name") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[400px] w-full">
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">What&apos;s your first name?</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">This goes on your lunch bag</p>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Tunde" className="w-full px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20 focus:border-[#f05f4b] mb-5" autoFocus />
          <button type="button" onClick={handleSetName} disabled={loading || !firstName.trim()} className="w-full bg-[#f05f4b] text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-40 active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 16px rgba(240,95,75,0.28)" }}>Continue</button>
        </div>
      </main>
    );
  }

  // ── WELCOME BACK ──
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#f8f9fa" }}>
      <div className="text-center" style={{ animation: "fu .6s cubic-bezier(.16,1,.3,1)" }}>
        <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>
        <h2 className="font-display font-[800] text-[26px] text-[#111827] tracking-[-0.03em] mb-1">Welcome back, {firstName}!</h2>
        {officeName && <p className="text-[14px] text-[#0f4030] font-semibold mb-1">{officeName}</p>}
        {savings && <p className="text-[13px] text-[#6b7280]">Your savings: <span className="font-bold text-[#22c55e]">{savings}</span></p>}
        <p className="text-[11px] text-[#9ca3af] mt-4 animate-pulse">Taking you to the menu...</p>
      </div>
      <style jsx>{`@keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </main>
  );
}
