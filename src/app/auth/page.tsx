"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCustomerProfile } from "@/lib/customer";
import { Logo } from "@/components/logo";

type AuthMode = "signin" | "signup" | "office" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [officeCode, setOfficeCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  function getReturnUrl(): string {
    if (typeof window === "undefined") return "/menu";
    const params = new URLSearchParams(window.location.search);
    return params.get("returnTo") || "/menu";
  }

  async function handleSignIn() {
    if (!email.trim() || !password) { setError("Email and password are required"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password }) });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      saveCustomerProfile({ name: `${data.data.firstName} ${data.data.lastName}`, phone: data.data.phone, email: data.data.email, deliveryAddress: "", preferredFulfillment: "PICKUP", officeId: data.data.office?.id, officeName: data.data.office?.name, officeCode: data.data.office?.code, collectionPoint: data.data.office?.collectionPoint });
      localStorage.removeItem("chopdrop-cart");
      router.push(getReturnUrl());
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  async function handleSignUp() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), password }) });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      saveCustomerProfile({ name: `${data.data.firstName} ${data.data.lastName}`, phone: data.data.phone, email: data.data.email, deliveryAddress: "", preferredFulfillment: "PICKUP" });
      localStorage.removeItem("chopdrop-cart");
      setLoading(false);
      router.push(getReturnUrl());
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  async function handleConnectOffice() {
    if (!officeCode.trim()) { setError("Enter your office code"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/connect-office", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: officeCode.trim() }) });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      const profile = JSON.parse(localStorage.getItem("chopdrop-customer") || "{}");
      saveCustomerProfile({ ...profile, officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint });
      router.push(getReturnUrl());
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <Logo size={24} />
        <button type="button" onClick={() => router.push("/menu")} className="text-[12px] font-semibold text-[#9ca3af] hover:text-[#1a1a1a] transition-colors">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 pb-10 max-w-[400px] w-full mx-auto">
        {/* ── Sign In ── */}
        {mode === "signin" && (
          <>
            <h1 className="font-display font-bold text-[26px] text-[#1a1a1a] tracking-[-0.03em] leading-tight">Welcome back</h1>
            <p className="text-[#9ca3af] text-[13px] mt-1.5 mb-6">Sign in to continue ordering</p>

            {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-semibold p-3 rounded-xl mb-4 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#6b7280]">Password</label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-[10px] font-semibold text-[#0f4030]">Forgot?</button>
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 pr-11 transition-shadow" onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M1 1l22 22" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <button type="button" onClick={handleSignIn} disabled={loading} className="w-full mt-5 bg-[#f05f4b] text-white font-bold py-3.5 rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(240,95,75,0.3)] hover:bg-[#e0503d] active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </button>

            <p className="text-center text-[13px] text-[#9ca3af] mt-5">
              New here? <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-[#1a1a1a] font-semibold">Create an account</button>
            </p>
          </>
        )}

        {/* ── Sign Up ── */}
        {mode === "signup" && (
          <>
            <h1 className="font-display font-bold text-[26px] text-[#1a1a1a] tracking-[-0.03em] leading-tight">Create account</h1>
            <p className="text-[#9ca3af] text-[13px] mt-1.5 mb-6">Join ChopDrop and start ordering</p>

            {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-semibold p-3 rounded-xl mb-4 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>{error}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">First name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Amaka" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Last name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Okoro" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 456 7890" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
              </div>
            </div>

            <button type="button" onClick={handleSignUp} disabled={loading} className="w-full mt-5 bg-[#f05f4b] text-white font-bold py-3.5 rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(240,95,75,0.3)] hover:bg-[#e0503d] active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? "Creating..." : "Create account"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </button>

            <p className="text-center text-[13px] text-[#9ca3af] mt-5">
              Have an account? <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="text-[#1a1a1a] font-semibold">Sign in</button>
            </p>

            <p className="text-center text-[10px] text-[#c5c5c2] mt-3">
              By creating an account you agree to our Terms and Privacy Policy
            </p>
          </>
        )}

        {/* ── Office Code ── */}
        {mode === "office" && (
          <>
            <div className="w-14 h-14 bg-[#0f4030]/[0.06] rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
            </div>
            <h1 className="font-display font-bold text-[26px] text-[#1a1a1a] tracking-[-0.03em] leading-tight">Connect your office</h1>
            <p className="text-[#9ca3af] text-[13px] mt-1.5 mb-6">Enter your office code for free delivery. Ask your office assistant if you don&apos;t have one.</p>

            {error && <div className="bg-[#fef2f2] text-[#f05f4b] text-[12px] font-semibold p-3 rounded-xl mb-4 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>{error}</div>}

            <div>
              <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Office code</label>
              <input type="text" value={officeCode} onChange={(e) => setOfficeCode(e.target.value)} placeholder="e.g. NORTH-241" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 uppercase font-mono transition-shadow" onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
            </div>

            <button type="button" onClick={handleConnectOffice} disabled={loading} className="w-full mt-5 bg-[#f05f4b] text-white font-bold py-3.5 rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(240,95,75,0.3)] hover:bg-[#e0503d] active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? "Connecting..." : "Connect office"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </button>

            <div className="flex items-center gap-3 my-6"><div className="flex-1 h-px bg-[#f0efeb]" /><span className="text-[#c5c5c2] text-[11px]">or</span><div className="flex-1 h-px bg-[#f0efeb]" /></div>

            <button type="button" onClick={() => router.push(getReturnUrl())} className="w-full bg-[#f5f5f3] text-[#1a1a1a] font-semibold py-3 rounded-xl text-[13px] hover:bg-[#eeedea] active:scale-[0.98] transition-all">
              Skip for now
            </button>
            <p className="text-center text-[10px] text-[#c5c5c2] mt-2">You can connect your office later in settings</p>
          </>
        )}

        {/* ── Forgot ── */}
        {mode === "forgot" && (
          <>
            <h1 className="font-display font-bold text-[26px] text-[#1a1a1a] tracking-[-0.03em] leading-tight">Reset password</h1>
            <p className="text-[#9ca3af] text-[13px] mt-1.5 mb-6">Enter your email and we&apos;ll send a reset link</p>

            <div>
              <label className="text-[11px] font-semibold text-[#6b7280] block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 bg-[#f5f5f3] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#c5c5c2] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 transition-shadow" />
            </div>

            <button type="button" className="w-full mt-5 bg-[#1a1a1a] text-white font-bold py-3.5 rounded-xl text-[14px] active:scale-[0.98] transition-all">
              Send reset link
            </button>

            <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="w-full mt-3 text-[#9ca3af] font-semibold text-[13px] py-2 hover:text-[#1a1a1a] transition-colors">
              Back to sign in
            </button>
          </>
        )}
      </div>

      {/* Bottom trust line */}
      <div className="px-5 pb-6 flex items-center justify-center gap-1.5 text-[10px] text-[#c5c5c2]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#22c55e]"><path d="m5 12 4 4L19 6" /></svg>
        Secure · Encrypted · No cash required
      </div>
    </main>
  );
}
