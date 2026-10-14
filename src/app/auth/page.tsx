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
  const [keepSigned, setKeepSigned] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const content = {
    signin: { eyebrow: "Welcome back", title: "No more lunch chaos.", description: "Sign in to pick your meal before 10:30. No WhatsApp counting, no cash chasing." },
    signup: { eyebrow: "Join ChopDrop", title: "Your office lunch, sorted.", description: "Create your account and connect to your office. Everyone orders, everyone pays, food arrives together." },
    office: { eyebrow: "One last step", title: "Connect your office.", description: "Your office code links you to the right lunch menu, assistant and collection point." },
    forgot: { eyebrow: "Reset password", title: "Let's get you back in.", description: "Enter your work email and we'll send you a secure reset link." },
  }[mode];

  async function handleSignIn() {
    if (!email.trim() || !password) { setError("Email and password are required"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      // Save profile to localStorage for client-side use
      saveCustomerProfile({
        name: `${data.data.firstName} ${data.data.lastName}`,
        phone: data.data.phone,
        email: data.data.email,
        deliveryAddress: "",
        preferredFulfillment: "PICKUP",
        officeId: data.data.office?.id,
        officeName: data.data.office?.name,
        officeCode: data.data.office?.code,
        collectionPoint: data.data.office?.collectionPoint,
      });
      // Clear old cart on login
      localStorage.removeItem("chopdrop-cart");
      router.push("/menu");
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  async function handleSignUp() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
      setError("All fields are required"); return;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      saveCustomerProfile({
        name: `${data.data.firstName} ${data.data.lastName}`,
        phone: data.data.phone,
        email: data.data.email,
        deliveryAddress: "",
        preferredFulfillment: "PICKUP",
      });
      // Clear old cart on new signup
      localStorage.removeItem("chopdrop-cart");
      setLoading(false);
      setMode("office");
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  async function handleConnectOffice() {
    if (!officeCode.trim()) { setError("Enter your office code"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/connect-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: officeCode.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      // Update localStorage with office info
      const profile = JSON.parse(localStorage.getItem("chopdrop-customer") || "{}");
      saveCustomerProfile({ ...profile, officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint });
      router.push("/menu");
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  function handleSkip() {
    router.push("/menu");
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* Left — Story panel */}
      <section className="hidden md:flex flex-col bg-green text-white relative overflow-hidden">
        <div className="p-8 flex items-center justify-between relative z-10">
          <Logo size={32} variant="dark" />
          <span className="bg-amber-soft text-[#7d5716] text-[10px] font-extrabold uppercase tracking-[0.07em] px-2.5 py-1.5 rounded-full">Ikeja lunch drop</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-12 pb-20 relative z-10">
          <div className="font-display font-bold text-[clamp(28px,3vw,42px)] leading-[1.05] tracking-[-0.04em] max-w-[420px]">&ldquo;No more WhatsApp chaos.<br />No more chasing cash.&rdquo;</div>
          <p className="text-[#d3e3dc] max-w-[400px] leading-relaxed text-[14px] mt-5">Everyone orders and pays before 10:30 AM. One organised batch arrives at your office by 12:30. Your assistant earns per box — no cash handling.</p>
          <div className="flex gap-8 mt-8">
            {[["₦0", "Cash handling"], ["10:30", "Order cutoff"], ["12:30", "Food arrives"]].map(([val, label]) => (
              <div key={val}><strong className="font-display font-bold text-[22px] block text-lime">{val}</strong><span className="text-[#b8c6c1] text-[10px]">{label}</span></div>
            ))}
          </div>
        </div>
        <img src="https://images.unsplash.com/photo-1574484284002-952d92456975?w=1200&fit=crop" alt="" className="absolute bottom-0 left-0 right-0 h-[35%] object-cover opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-green to-transparent" />
      </section>

      {/* Right — Form */}
      <section className="flex flex-col justify-center px-5 md:px-12 lg:px-16 py-10 bg-paper">
        <div className="md:hidden mb-8"><Logo size={28} /></div>
        <div className="max-w-[400px] w-full mx-auto">
          <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">{content.eyebrow}</div>
          <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-2 leading-tight">{content.title}</h1>
          <p className="text-ink-soft text-[13px] mt-2 leading-relaxed">{content.description}</p>

          {error && <div className="bg-red-soft text-coral text-[12px] font-semibold p-3 rounded-[10px] mt-4">{error}</div>}

          {/* Sign In */}
          {mode === "signin" && (
            <div className="mt-6 space-y-3">
              <div><label className="block text-[12px] font-bold mb-1.5">Work email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /></div>
              <div><label className="block text-[12px] font-bold mb-1.5">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" onKeyDown={(e) => e.key === "Enter" && handleSignIn()} /></div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] text-ink-soft cursor-pointer"><input type="checkbox" checked={keepSigned} onChange={(e) => setKeepSigned(e.target.checked)} className="w-4 h-4 rounded" />Keep me signed in</label>
                <button type="button" onClick={() => setMode("forgot")} className="text-[11px] text-green font-semibold hover:underline">Forgot password?</button>
              </div>
              <button type="button" onClick={handleSignIn} disabled={loading} className="w-full bg-coral text-white font-bold py-3.5 rounded-[10px] text-sm flex items-center justify-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all disabled:opacity-50">
                {loading ? "Signing in..." : "Sign in to ChopDrop"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
              </button>
              <p className="text-center text-[12px] text-ink-soft mt-4">New to ChopDrop? <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-green font-bold hover:underline">Create an account</button></p>
            </div>
          )}

          {/* Sign Up */}
          {mode === "signup" && (
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[12px] font-bold mb-1.5">First name</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Amaka" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /></div>
                <div><label className="block text-[12px] font-bold mb-1.5">Last name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Okoro" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /></div>
              </div>
              <div><label className="block text-[12px] font-bold mb-1.5">Work email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /></div>
              <div><label className="block text-[12px] font-bold mb-1.5">Phone number</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /></div>
              <div><label className="block text-[12px] font-bold mb-1.5">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /><small className="text-ink-soft text-[10px] mt-1 block">Use a mix of letters and numbers.</small></div>
              <label className="flex items-start gap-2 text-[11px] text-ink-soft cursor-pointer"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 rounded mt-0.5" />I agree to the Terms of Service and Privacy Policy.</label>
              <button type="button" onClick={handleSignUp} disabled={loading} className="w-full bg-coral text-white font-bold py-3.5 rounded-[10px] text-sm flex items-center justify-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all disabled:opacity-50">
                {loading ? "Creating account..." : "Create account"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
              </button>
              <p className="text-center text-[12px] text-ink-soft mt-2">Already have an account? <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="text-green font-bold hover:underline">Sign in</button></p>
            </div>
          )}

          {/* Office Code */}
          {mode === "office" && (
            <div className="mt-6">
              <div className="flex items-center gap-3 bg-green-soft rounded-[11px] p-4 mb-5">
                <div className="w-12 h-12 bg-white rounded-[10px] flex items-center justify-center text-green flex-shrink-0">
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
                </div>
                <div>
                  <strong className="text-[13px] block">Find your office code</strong>
                  <span className="text-ink-soft text-[11px]">Ask your office assistant or check your ChopDrop invite.</span>
                </div>
              </div>
              <div><label className="block text-[12px] font-bold mb-1.5">Office code</label><input type="text" value={officeCode} onChange={(e) => setOfficeCode(e.target.value)} placeholder="e.g. NORTH-241" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30 uppercase" onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} /><small className="text-ink-soft text-[10px] mt-1 block">Codes are not case sensitive.</small></div>
              <button type="button" onClick={handleConnectOffice} disabled={loading} className="w-full mt-4 bg-coral text-white font-bold py-3.5 rounded-[10px] text-sm flex items-center justify-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all disabled:opacity-50">
                {loading ? "Connecting..." : "Connect office"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
              </button>
              <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-line" /><span className="text-ink-soft text-[11px]">or</span><div className="flex-1 h-px bg-line" /></div>
              <button type="button" onClick={handleSkip} className="w-full border border-line bg-paper font-bold py-3 rounded-[10px] text-sm hover:bg-cream transition-colors">Skip — I&apos;ll order individually</button>
              <p className="text-center text-[10px] text-ink-soft mt-2">You can pick up directly from the restaurant.</p>
            </div>
          )}

          {/* Forgot */}
          {mode === "forgot" && (
            <div className="mt-6">
              <div><label className="block text-[12px] font-bold mb-1.5">Work email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" /></div>
              <button type="button" onClick={() => setMode("signin")} className="w-full mt-4 bg-coral text-white font-bold py-3.5 rounded-[10px] text-sm flex items-center justify-center gap-2">Send reset link</button>
              <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="w-full mt-3 py-2 text-ink-soft text-sm font-semibold">Back to sign in</button>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-6 text-ink-soft text-[10px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green"><path d="m5 12 4 4L19 6" /></svg>
            Your account and payments are securely protected.
          </div>
        </div>
      </section>
    </main>
  );
}
