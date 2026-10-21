"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

type Step = "intro" | "phone" | "details" | "office" | "share";

export default function StartPage() {
  const [step, setStep] = useState<Step>("intro");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officeSize, setOfficeSize] = useState("20-40");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [officeData, setOfficeData] = useState<{ name: string; code: string; slug: string; joinLink: string } | null>(null);

  async function handleSignup() {
    if (!firstName.trim() || !phone.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: firstName.trim(),
          email: email.trim() || `${phone.trim().replace(/\s/g, "")}@chopdrop.ng`,
          phone: phone.trim().replace(/\s/g, ""),
          password: password.trim(),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.error?.includes("already")) {
          // Try signin
          const signinRes = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim() || `${phone.trim().replace(/\s/g, "")}@chopdrop.ng`,
              password: password.trim(),
            }),
          });
          const signinData = await signinRes.json();
          if (!signinData.success) {
            setError("Account exists. Check your password.");
            setLoading(false);
            return;
          }
        } else {
          setError(data.error || "Signup failed");
          setLoading(false);
          return;
        }
      }

      setStep("office");
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  async function handleCreateOffice() {
    if (!officeName.trim() || !officeAddress.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/offices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: officeName.trim(),
          address: officeAddress.trim(),
          size: officeSize,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to create office");
        setLoading(false);
        return;
      }

      setOfficeData(data.data);
      setStep("share");
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  // ── Intro ──
  if (step === "intro") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-10">
            <Logo size={32} />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-[26px] text-[#1a1a1a] tracking-[-0.03em] mb-2">Set up ChopDrop for your office</h1>
            <p className="text-[14px] text-[#9ca3af]">You&apos;ll be the Pool Captain — the person who keeps lunch sorted.</p>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#f05f4b]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-[#f05f4b]">1</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#1a1a1a]">You set up your office</div>
                  <div className="text-[11px] text-[#9ca3af] mt-0.5">Name, address — takes 30 seconds</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#f5c565]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-[#92702a]">2</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#1a1a1a]">Share the link to your WhatsApp group</div>
                  <div className="text-[11px] text-[#9ca3af] mt-0.5">Colleagues join instantly — no app download</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#0f4030]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-[#0f4030]">3</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#1a1a1a]">Everyone orders, food arrives together</div>
                  <div className="text-[11px] text-[#9ca3af] mt-0.5">₦0 delivery. More people = cheaper meals.</div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full bg-[#f05f4b] text-white font-bold text-[15px] py-4 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform"
          >
            Get started — free forever
          </button>

          <p className="text-[10px] text-[#9ca3af] text-center mt-4">
            Already have an office? <a href="/menu" className="text-[#f05f4b] font-semibold">Go to menu</a>
          </p>
        </div>
      </main>
    );
  }

  // ── Phone ──
  if (step === "phone") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-8"><Logo size={28} /></div>
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">Create your account</h2>
            <p className="text-[13px] text-[#9ca3af] mb-6">You&apos;ll be the Pool Captain</p>

            {error && <div className="bg-[#fee2e2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Your name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Amaka" className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30" autoFocus />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Phone number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812 345 6789" className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Email <span className="font-normal text-[#9ca3af]">(optional)</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amaka@company.com" className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Create a PIN</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30" />
              </div>
            </div>

            <button type="button" onClick={handleSignup} disabled={loading || !firstName.trim() || phone.length < 10 || password.length < 6} className="w-full mt-5 bg-[#f05f4b] text-white font-bold text-[14px] py-3.5 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all">
              {loading ? "Creating..." : "Continue"}
            </button>
          </div>
          <button type="button" onClick={() => setStep("intro")} className="block mx-auto mt-4 text-[12px] text-[#9ca3af]">← Back</button>
        </div>
      </main>
    );
  }

  // ── Office details ──
  if (step === "office") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-8"><Logo size={28} /></div>
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">Set up your office</h2>
            <p className="text-[13px] text-[#9ca3af] mb-6">This is where food will be delivered</p>

            {error && <div className="bg-[#fee2e2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Company / Office name</label>
                <input type="text" value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="Sterling Bank HQ" className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30" autoFocus />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Office address</label>
                <input type="text" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="20 Marina St, Lagos Island" className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">How many people in your office?</label>
                <select value={officeSize} onChange={(e) => setOfficeSize(e.target.value)} className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 bg-white">
                  <option value="5-10">5–10 people</option>
                  <option value="10-20">10–20 people</option>
                  <option value="20-40">20–40 people</option>
                  <option value="40-60">40–60 people</option>
                  <option value="60+">60+ people</option>
                </select>
              </div>
            </div>

            <button type="button" onClick={handleCreateOffice} disabled={loading || !officeName.trim() || !officeAddress.trim()} className="w-full mt-5 bg-[#f05f4b] text-white font-bold text-[14px] py-3.5 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all">
              {loading ? "Setting up..." : "Create office"}
            </button>
          </div>
          <button type="button" onClick={() => setStep("phone")} className="block mx-auto mt-4 text-[12px] text-[#9ca3af]">← Back</button>
        </div>
      </main>
    );
  }

  // ── Share ──
  if (step === "share" && officeData) {
    const joinUrl = `${appUrl}/join/${officeData.slug}`;
    const whatsappText = encodeURIComponent(
      `🍚 I set up ChopDrop for our office! Order lunch together & save with pool pricing. ₦0 delivery.\n\nJoin here: ${joinUrl}\n\nEveryone picks their own meal, pays on their phone. Food arrives together.`
    );

    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-8">
          <div className="flex items-center justify-center mb-6"><Logo size={28} /></div>

          <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>

          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] text-center mb-1">{officeData.name} is live!</h2>
          <p className="text-[13px] text-[#9ca3af] text-center mb-6">Now share with your colleagues</p>

          {/* Share message preview */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 mb-4">
            <div className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">Share this to your office WhatsApp group:</div>
            <div className="bg-[#e8f5e9] rounded-xl p-4 text-[13px] text-[#1a1a1a] leading-relaxed" style={{ fontFamily: "DM Sans, sans-serif" }}>
              🍚 I set up ChopDrop for our office! Order lunch together &amp; save with pool pricing. ₦0 delivery.
              <br /><br />
              Join here: <span className="text-[#1a65c0] underline">{joinUrl}</span>
              <br /><br />
              Everyone picks their own meal, pays on their phone. Food arrives together.
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 mb-6">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full bg-[#25d366] text-white font-bold text-[14px] py-3.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share to WhatsApp
            </a>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(joinUrl); }}
              className="flex items-center justify-center gap-2 w-full bg-[#f5f5f3] text-[#1a1a1a] font-semibold text-[13px] py-3 rounded-xl hover:bg-[#eeedea] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="4" width="11" height="14" rx="2" /><path d="M7 7H5.5A1.5 1.5 0 004 8.5v10A1.5 1.5 0 005.5 20H14a1.5 1.5 0 001.5-1.5V18" /></svg>
              Copy join link
            </button>
          </div>

          {/* Office code */}
          <div className="text-center mb-6">
            <div className="text-[10px] text-[#9ca3af] mb-1">Office code (for manual entry)</div>
            <div className="font-display font-bold text-[18px] text-[#0f4030] tracking-[0.08em]">{officeData.code}</div>
          </div>

          <a href="/menu" className="block text-center text-[13px] font-semibold text-[#f05f4b]">
            Skip — I&apos;ll share later →
          </a>
        </div>
      </main>
    );
  }

  return null;
}
