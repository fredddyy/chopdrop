"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { saveCustomerProfile } from "@/lib/customer";

type Step = "phone" | "pin" | "forgot" | "welcome";

export default function AuthPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pinCode, setPinCode] = useState(["", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getReturnUrl(): string {
    if (typeof window === "undefined") return "/menu";
    const params = new URLSearchParams(window.location.search);
    return params.get("returnTo") || "/menu";
  }

  async function handleLoginPin(code: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim().replace(/\s/g, ""), pin: code }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.needsSetup) {
          setError("No PIN set. Please sign up first.");
        } else {
          setError(data.error || "Wrong PIN");
        }
        setPinCode(["", "", "", ""]);
        setTimeout(() => document.getElementById("pin-0")?.focus(), 100);
        setLoading(false);
        return;
      }
      if (data.data.office) {
        saveCustomerProfile({ name: data.data.firstName, phone: data.data.phone, email: "", deliveryAddress: "", preferredFulfillment: "PICKUP", officeId: data.data.office.id, officeName: data.data.office.name, officeCode: data.data.office.code, collectionPoint: data.data.office.collectionPoint });
      }
      setFirstName(data.data.firstName);
      setOfficeName(data.data.office?.name || "");
      setStep("welcome");
      // Captains go to their dashboard, everyone else to menu
      const dest = data.data.captainUrl || getReturnUrl();
      setTimeout(() => { window.location.href = dest; }, 2000);
    } catch { setError("Network error."); }
    setLoading(false);
  }

  async function handleForgotPin() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim().replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed"); setLoading(false); return; }
      // Open WhatsApp with pre-filled admin message
      window.open(data.data.adminWhatsappUrl, "_blank");
      setStep("forgot");
    } catch { setError("Network error."); }
    setLoading(false);
  }

  function handlePinInput(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const c = [...pinCode]; c[i] = v.slice(-1); setPinCode(c);
    if (v && i < 3) document.getElementById(`pin-${i + 1}`)?.focus();
    if (v && i === 3) { const full = c.join(""); if (full.length === 4) handleLoginPin(full); }
  }

  function handlePinKeyDown(i: number, key: string) {
    if (key === "Backspace" && !pinCode[i] && i > 0) document.getElementById(`pin-${i - 1}`)?.focus();
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

        <button type="button" onClick={() => { setError(""); setPinCode(["","","",""]); setStep("pin"); }} disabled={phone.replace(/\s/g, "").length < 10} className={btnPrimary} style={{ background: phone.replace(/\s/g, "").length < 10 ? undefined : "var(--coral)" }}>
          Continue
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

  // ── PIN ──
  if (step === "pin") {
    return shell(
      <>
        <button type="button" onClick={() => { setStep("phone"); setPinCode(["","","",""]); setError(""); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-8 cursor-pointer" style={{ border: "1px solid var(--border)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6" style={{ background: "rgba(232,96,76,0.1)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>

        <h2 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: "var(--text)" }}>Enter your PIN</h2>
        <p className="text-[16px] mb-8" style={{ color: "var(--text-secondary)" }}>4-digit PIN for <span className="font-bold" style={{ color: "var(--text)" }}>{phone}</span></p>

        {error && <div className="p-3 rounded-[14px] mb-4 text-[14px] font-medium" style={{ background: "#FEF2F2", color: "var(--coral)", animation: "shake 0.4s ease" }}>{error}</div>}

        <div className={`flex justify-center gap-3 mb-8 ${error ? "animate-[shake_0.4s_ease]" : ""}`}>
        <style>{`@keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }`}</style>
          {pinCode.map((d, i) => (
            <input key={i} id={`pin-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
              onChange={(e) => handlePinInput(i, e.target.value)}
              onKeyDown={(e) => handlePinKeyDown(i, e.key)}
              className="w-[64px] h-[64px] text-center text-[24px] font-extrabold bg-white border-2 rounded-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              autoFocus={i === 0} />
          ))}
        </div>

        {loading && <p className="text-[14px] text-center mb-4" style={{ color: "var(--text-secondary)" }}>Checking...</p>}

        <div className="text-center">
          <button type="button" onClick={handleForgotPin} disabled={loading} className="text-[14px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>
            Forgot PIN?
          </button>
        </div>
      </>
    );
  }

  // ── FORGOT PIN SENT ──
  if (step === "forgot") {
    return shell(
      <>
        <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6" style={{ background: "rgba(37,211,102,0.1)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </div>

        <h2 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: "var(--text)" }}>Reset request sent</h2>
        <p className="text-[16px] mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          We&apos;ve opened WhatsApp with your reset request. Send the message — you&apos;ll get a reset link back shortly.
        </p>

        <div className="p-4 rounded-[16px] mb-8" style={{ background: "var(--sand)" }}>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Check your WhatsApp for a link from ChopDrop. Tap it to set a new PIN.
          </p>
        </div>

        <button type="button" onClick={() => { setStep("pin"); setPinCode(["","","",""]); setError(""); }} className={btnPrimary} style={{ background: "var(--coral)" }}>
          Try PIN again
        </button>
        <a href="/auth" className="block text-center text-[14px] font-semibold mt-4" style={{ color: "var(--text-secondary)" }}>Back to login</a>
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
