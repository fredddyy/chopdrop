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
      if (data.data.firstName && data.data.firstName !== "User") {
        setFirstName(data.data.firstName);
        setStep("choose");
      } else {
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
    } catch { /* proceed anyway */ }
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

  const cardCls = "bg-white rounded-3xl border border-[#e2e8f0] p-6";
  const btnCls = "w-full bg-[#f05f4b] text-white font-bold text-[15px] py-4 rounded-2xl active:scale-[0.97] transition-transform";
  const btnShadow = { boxShadow: "0 4px 16px rgba(240,95,75,0.28)" };
  const backBtn = (to: Step) => <button type="button" onClick={() => { setStep(to); setError(""); }} className="flex items-center gap-1 text-[12px] text-[#6b7280] mb-6"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>Back</button>;

  // ══════════════════════════════════
  // INTRO
  // ══════════════════════════════════
  if (step === "intro") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-8"><Logo size={30} /></div>
          <div className="text-center mb-6">
            <h1 className="font-display font-[800] text-[30px] text-[#111827] tracking-[-0.04em] leading-[1.1] mb-3">Set up ChopDrop<br />for your office</h1>
            <p className="text-[15px] text-[#4b5563] leading-relaxed max-w-[320px] mx-auto">You&apos;ll be the <span className="font-bold text-[#0f4030]">Pool Captain</span> — the person who keeps lunch sorted.</p>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="flex -space-x-2">
              {["#f05f4b", "#0f4030", "#f5c565", "#22c55e"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" style={{ background: c, zIndex: 4 - i }}>
                  {["AO", "CE", "TK", "BN"][i]}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-[#4b5563]">20+ offices already chopping</span>
          </div>

          {/* Bento steps */}
          <div className="space-y-3 mb-7">
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f05f4b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>, bg: "#f05f4b", title: "You set up your office", sub: "Name, address — takes 30 seconds" },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>, bg: "#25d366", title: "Share the link to WhatsApp", sub: "Colleagues join instantly — no app download" },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f4030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>, bg: "#0f4030", title: "Everyone orders, food arrives", sub: "₦0 delivery. More people = cheaper meals." },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.bg}12` }}>{s.icon}</div>
                <div>
                  <div className="text-[14px] font-bold text-[#111827] mb-0.5">{s.title}</div>
                  <div className="text-[12px] text-[#6b7280]">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Captain perks banner */}
          <div className="bg-[#0f4030] rounded-2xl p-4 mb-7 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/[0.04]" />
            <div className="relative flex items-center gap-3">
              <span className="text-[24px]">👑</span>
              <div>
                <div className="text-[12px] font-bold text-[#6ee7b7]">Captain perks</div>
                <div className="text-[13px] text-white font-medium mt-0.5">Free lunch daily · Up to ₦10K/month cash</div>
              </div>
            </div>
          </div>

          <button type="button" onClick={() => setStep("phone")} className={btnCls} style={btnShadow}>Get started — free forever</button>
          <p className="text-[12px] text-[#6b7280] text-center mt-4">Already have an office? <a href="/menu" className="text-[#f05f4b] font-semibold underline">Go to menu</a></p>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════
  // PHONE
  // ══════════════════════════════════
  if (step === "phone") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          {backBtn("intro")}
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">Enter your phone number</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">We&apos;ll send a verification code</p>
          {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-[#e2e8f0] px-3 py-3.5 text-[14px] text-[#6b7280] flex-shrink-0"><span>🇳🇬</span><span>+234</span></div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="812 345 6789" className="flex-1 px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20 focus:border-[#f05f4b]" autoFocus />
          </div>
          <button type="button" onClick={handleSendOtp} disabled={loading || phone.replace(/\s/g, "").length < 10} className={`${btnCls} disabled:opacity-40`} style={btnShadow}>{loading ? "Sending..." : "Send Code"}</button>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════
  // OTP
  // ══════════════════════════════════
  if (step === "otp") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          {backBtn("phone")}
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">Enter the code</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">Sent to <span className="font-semibold text-[#111827]">{phone}</span></p>
          {testCode && (
            <div className="bg-[#fffbf0] border border-[#f5c565]/30 rounded-2xl px-4 py-3 mb-4 text-center">
              <div className="text-[9px] font-bold text-[#92702a] uppercase tracking-[0.08em] mb-1">Test Mode — Your code is:</div>
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

  // ══════════════════════════════════
  // NAME (new users only)
  // ══════════════════════════════════
  if (step === "name") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">What&apos;s your first name?</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">Your colleagues will see this</p>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Amaka" className="w-full px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20 focus:border-[#f05f4b] mb-5" autoFocus />
          <button type="button" onClick={handleSetName} disabled={loading || !firstName.trim()} className={`${btnCls} disabled:opacity-40`} style={btnShadow}>{loading ? "..." : "Continue"}</button>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════
  // CHOOSE — "Set Up" vs "I Have an Invite"
  // ══════════════════════════════════
  if (step === "choose") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-8"><Logo size={28} /></div>
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] text-center mb-2">Hey {firstName} 👋</h2>
          <p className="text-[14px] text-[#6b7280] text-center mb-8">How do you want to start?</p>

          <div className="space-y-3">
            <button type="button" onClick={() => setStep("office")} className="w-full bg-white rounded-3xl border-2 border-[#0f4030]/20 p-5 text-left hover:border-[#0f4030]/40 transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#0f4030]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f4030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[#111827]">Set Up My Office</div>
                  <div className="text-[11px] text-[#6b7280]">I want to organize lunch for my workplace</div>
                </div>
              </div>
            </button>

            <button type="button" onClick={() => { window.location.href = "/auth"; }} className="w-full bg-white rounded-3xl border border-[#e2e8f0] p-5 text-left hover:border-[#e2e8f0] transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#f5c565]/15 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92702a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[#111827]">I Have an Invite</div>
                  <div className="text-[11px] text-[#6b7280]">Someone shared a link or code with me</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════
  // OFFICE DETAILS
  // ══════════════════════════════════
  if (step === "office") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          {backBtn("choose")}
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">Set up your office</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">This is where food will be delivered</p>
          {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Company / Office name</label>
              <input type="text" value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="Sterling Bank HQ" className="w-full px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20 focus:border-[#f05f4b]" autoFocus />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Office address</label>
              <input type="text" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="20 Marina St, Lagos Island" className="w-full px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20 focus:border-[#f05f4b]" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Office size</label>
              <select value={officeSize} onChange={(e) => setOfficeSize(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/20">
                <option value="5-10">5–10 people</option>
                <option value="10-20">10–20 people</option>
                <option value="20-40">20–40 people</option>
                <option value="40-60">40–60 people</option>
                <option value="60+">60+ people</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={() => setStep("benefits")} disabled={!officeName.trim() || !officeAddress.trim()} className={`${btnCls} disabled:opacity-40`} style={btnShadow}>Continue</button>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════
  // CAPTAIN BENEFITS (before creating)
  // ══════════════════════════════════
  if (step === "benefits") {
    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          {backBtn("office")}
          <h2 className="font-display font-[800] text-[24px] text-[#111827] tracking-[-0.03em] mb-1">You&apos;ll be the Pool Captain<br />for {officeName}</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">This means:</p>

          <div className="space-y-3 mb-6">
            <div className={cardCls}>
              <div className="flex items-center gap-3">
                <span className="text-[24px]">🍽️</span>
                <div>
                  <div className="text-[10px] font-bold text-[#f05f4b] uppercase tracking-[0.06em]">Free lunch</div>
                  <div className="text-[13px] font-semibold text-[#111827] mt-0.5">Eat free when 15+ colleagues join the pool</div>
                </div>
              </div>
            </div>
            <div className={cardCls}>
              <div className="flex items-center gap-3">
                <span className="text-[24px]">💰</span>
                <div>
                  <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-[0.06em]">Cash bonus</div>
                  <div className="text-[13px] font-semibold text-[#111827] mt-0.5">₦500 per pool with 20+ orders = up to ₦10K/month</div>
                </div>
              </div>
            </div>
            <div className={cardCls}>
              <div className="flex items-center gap-3">
                <span className="text-[24px]">⏱️</span>
                <div>
                  <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.06em]">Minimal effort</div>
                  <div className="text-[13px] font-semibold text-[#111827] mt-0.5">Send one WhatsApp message each morning. That&apos;s it.</div>
                </div>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleCreateOffice} disabled={loading} className={`${btnCls} disabled:opacity-40`} style={btnShadow}>{loading ? "Creating..." : "Let's Go"}</button>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════
  // SHARE — invite link + WhatsApp + QR
  // ══════════════════════════════════
  if (step === "share" && officeData) {
    const joinUrl = `${appUrl}/join/${officeData.slug}`;
    const waText = encodeURIComponent(`🍚 I set up ChopDrop for our office! Order lunch together & save with pool pricing. ₦0 delivery.\n\nJoin here: ${joinUrl}\n\nEveryone picks their own meal, pays on their phone. Food arrives together.`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`;

    return (
      <main className="min-h-screen" style={{ background: "#f8f9fa" }}>
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-6"><Logo size={28} /></div>

          <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>

          <h2 className="font-display font-[800] text-[24px] text-[#111827] text-center mb-1">{officeData.name} is live!</h2>
          <p className="text-[13px] text-[#6b7280] text-center mb-6">Now invite your colleagues</p>

          {/* Share message preview */}
          <div className={`${cardCls} mb-4`}>
            <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.06em] mb-3">Share to your office WhatsApp:</div>
            <div className="bg-[#f0fdf4] rounded-2xl p-4 text-[13px] text-[#111827] leading-relaxed">
              🍚 I set up ChopDrop for our office! Order lunch together &amp; save with pool pricing. ₦0 delivery.<br /><br />
              Join here: <span className="text-[#1a65c0] underline break-all">{joinUrl}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 mb-6">
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 w-full bg-[#25d366] text-white font-bold text-[14px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share to WhatsApp
            </a>
            <button type="button" onClick={() => navigator.clipboard.writeText(joinUrl)} className="flex items-center justify-center gap-2 w-full bg-white text-[#111827] font-semibold text-[13px] py-3 rounded-2xl border border-[#e2e8f0] hover:bg-[#f8f9fa] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="4" width="11" height="14" rx="2" /><path d="M7 7H5.5A1.5 1.5 0 004 8.5v10A1.5 1.5 0 005.5 20H14a1.5 1.5 0 001.5-1.5V18" /></svg>
              Copy join link
            </button>
          </div>

          {/* QR Code */}
          <div className="text-center mb-6">
            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.06em] mb-3">Or scan to join</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code" className="w-[140px] h-[140px] mx-auto rounded-xl border border-[#e2e8f0]" />
          </div>

          {/* Office code */}
          <div className="text-center mb-6">
            <div className="text-[10px] text-[#6b7280] mb-1">Office code (for manual entry)</div>
            <div className="font-display font-bold text-[20px] text-[#0f4030] tracking-[0.08em]">{officeData.code}</div>
          </div>

          {/* Go to dashboard */}
          <a href={officeData.captainLink || "/menu"} className={btnCls} style={btnShadow}>Go to Captain Dashboard →</a>
          <a href="/menu" className="block text-center text-[13px] font-semibold text-[#6b7280] mt-3 hover:text-[#111827]">Skip — I&apos;ll share later</a>
        </div>
      </main>
    );
  }

  return null;
}
