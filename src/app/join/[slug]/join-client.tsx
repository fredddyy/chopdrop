"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";

interface JoinClientProps {
  office: {
    id: string;
    name: string;
    code: string;
    address: string;
    collectionPoint: string;
    captainName: string | null;
    memberCount: number;
    totalOrders: number;
    todayOrders: number;
  };
  menuPreview: {
    id: string;
    name: string;
    price: number;
    originalPrice: number | null;
    imageUrl: string | null;
    restaurantName: string;
    tag: string;
  }[];
  poolTimer: { cutoffTime: string; label: string } | null;
  restaurantCount: number;
}

function formatNaira(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

function PoolCountdown({ cutoffTime }: { cutoffTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const now = new Date();
      const [h, m] = cutoffTime.split(":").map(Number);
      const cutoff = new Date(now);
      cutoff.setHours(h, m, 0, 0);
      const diff = cutoff.getTime() - now.getTime();
      if (diff <= 0) { setExpired(true); setTimeLeft("Closed"); return; }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}min`);
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [cutoffTime]);

  if (expired) return <span className="text-[#f05f4b] font-bold">Closed</span>;
  return <span className="text-[#22c55e] font-bold">{timeLeft} left</span>;
}

export function JoinClient({ office, menuPreview, poolTimer, restaurantCount }: JoinClientProps) {
  const [step, setStep] = useState<"preview" | "phone" | "name" | "welcome" | "done">("preview");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!firstName.trim() || !password.trim()) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");

    const cleanPhone = phone.trim().replace(/\s/g, "");
    const fakeEmail = `${cleanPhone}@chopdrop.ng`;

    try {
      // Create account
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: firstName.trim(),
          email: fakeEmail,
          phone: cleanPhone,
          password: password.trim(),
        }),
      });
      const signupData = await signupRes.json();

      if (!signupData.success) {
        if (signupData.error?.includes("already")) {
          const signinRes = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: fakeEmail, password: password.trim() }),
          });
          const signinData = await signinRes.json();
          if (!signinData.success) { setError("Account exists. Check your PIN."); setLoading(false); return; }
        } else { setError(signupData.error || "Signup failed"); setLoading(false); return; }
      }

      // Connect to office
      await fetch("/api/auth/connect-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: office.code }),
      });

      setStep("welcome");
      // Auto-redirect after 2.5 seconds
      setTimeout(() => { window.location.href = "/menu"; }, 2500);
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  // ═══════════════════════════════════════════════════
  // STEP 1: VALUE PREVIEW — Show everything before signup
  // ═══════════════════════════════════════════════════
  if (step === "preview") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <Logo size={24} />
            <a href="/auth" className="text-[12px] font-semibold text-[#6b7280] hover:text-[#1a1a1a]">Log in</a>
          </div>

          {/* Office hero card */}
          <div className="mx-5 bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
            <div className="bg-gradient-to-br from-[#0f4030] to-[#0a2e20] px-5 py-5 text-center relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.04]" />
              <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-[#f5c565]/10" />
              <div className="relative">
                <div className="text-[10px] font-bold text-[#6ee7b7] uppercase tracking-[0.1em] mb-2">You&apos;ve been invited to</div>
                <h1 className="font-display font-bold text-[24px] text-white tracking-[-0.03em] leading-tight">{office.name}</h1>
                <p className="text-[12px] text-white/50 mt-1">{office.address}</p>
              </div>
            </div>

            {/* Social proof stats */}
            <div className="grid grid-cols-3 divide-x divide-black/[0.06] py-3.5">
              <div className="text-center px-2">
                <div className="font-display font-bold text-[18px] text-[#1a1a1a]">{office.memberCount}</div>
                <div className="text-[9px] text-[#9ca3af] font-medium">colleagues</div>
              </div>
              <div className="text-center px-2">
                <div className="font-display font-bold text-[18px] text-[#1a1a1a]">{office.totalOrders > 0 ? office.totalOrders.toLocaleString() : "—"}</div>
                <div className="text-[9px] text-[#9ca3af] font-medium">lunches ordered</div>
              </div>
              <div className="text-center px-2">
                <div className="font-display font-bold text-[18px] text-[#f05f4b]">₦0</div>
                <div className="text-[9px] text-[#9ca3af] font-medium">delivery fee</div>
              </div>
            </div>
          </div>

          {/* Live pool status */}
          {poolTimer && (
            <div className="mx-5 mt-3 bg-white rounded-xl border border-black/[0.06] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <div>
                  <div className="text-[12px] font-semibold text-[#1a1a1a]">Lunch pool is LIVE</div>
                  <div className="text-[10px] text-[#9ca3af]">{office.todayOrders} ordering today · {restaurantCount} kitchen{restaurantCount !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="text-[12px]">
                <PoolCountdown cutoffTime={poolTimer.cutoffTime} />
              </div>
            </div>
          )}

          {!poolTimer && office.todayOrders === 0 && (
            <div className="mx-5 mt-3 bg-[#fffbf0] rounded-xl border border-[#f5c565]/20 px-4 py-3 flex items-center gap-2.5">
              <span className="text-[16px]">&#x1F559;</span>
              <div>
                <div className="text-[12px] font-semibold text-[#1a1a1a]">Next pool opens tomorrow</div>
                <div className="text-[10px] text-[#92702a]">Join now so you&apos;re ready when orders open</div>
              </div>
            </div>
          )}

          {/* Today's menu preview */}
          {menuPreview.length > 0 && (
            <div className="mx-5 mt-4">
              <h2 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-2.5">Today&apos;s lunch</h2>
              <div className="space-y-2">
                {menuPreview.map((item) => {
                  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                  const savingsPercent = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-black/[0.04]">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[20px]">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#1a1a1a] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#9ca3af]">{item.restaurantName}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-display font-bold text-[14px] text-[#0f4030]">{formatNaira(item.price)}</span>
                          {hasDiscount && (
                            <>
                              <span className="text-[11px] text-[#d1d5db] line-through">{formatNaira(item.originalPrice!)}</span>
                              <span className="text-[8px] font-bold text-white bg-[#f05f4b] px-1.5 py-0.5 rounded-full">-{savingsPercent}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {menuPreview.length >= 4 && (
                <p className="text-[10px] text-[#9ca3af] text-center mt-2">+ more on the full menu</p>
              )}
            </div>
          )}

          {/* How it works — ultra compact */}
          <div className="mx-5 mt-4 flex items-center justify-center gap-5">
            <div className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[10px] font-medium text-[#6b7280]">₦0 delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[10px] font-medium text-[#6b7280]">Pay on your phone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[10px] font-medium text-[#6b7280]">More people = cheaper</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mx-5 mt-5 mb-4">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full bg-[#f05f4b] text-white font-bold text-[15px] py-4 rounded-2xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform"
            >
              Join &amp; Order Lunch
            </button>
            <p className="text-[10px] text-[#9ca3af] text-center mt-2.5">Takes 60 seconds · No app download needed</p>
          </div>

          {/* Captain credit */}
          {office.captainName && (
            <div className="mx-5 mb-6 text-center">
              <span className="text-[10px] text-[#9ca3af]">Pool Captain: <span className="font-semibold text-[#6b7280]">{office.captainName}</span></span>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════
  // STEP 2: PHONE NUMBER
  // ═══════════════════════════════════════════════════
  if (step === "phone") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-6">
          <button type="button" onClick={() => setStep("preview")} className="flex items-center gap-1 text-[12px] text-[#9ca3af] mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </button>

          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em] mb-1">Enter your phone number</h2>
          <p className="text-[13px] text-[#9ca3af] mb-6">to join <span className="font-semibold text-[#1a1a1a]">{office.name}</span></p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-[#f5f5f3] rounded-xl px-3 py-3.5 text-[14px] text-[#6b7280] flex-shrink-0">
              <span>🇳🇬</span>
              <span>+234</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="812 345 6789"
              className="flex-1 px-4 py-3.5 border border-[#e5e5e3] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={() => { if (phone.replace(/\s/g, "").length >= 10) setStep("name"); }}
            disabled={phone.replace(/\s/g, "").length < 10}
            className="w-full bg-[#f05f4b] text-white font-bold text-[14px] py-3.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-all"
          >
            Continue
          </button>

          <p className="text-[9px] text-[#9ca3af] text-center mt-3">
            By continuing you agree to our Terms &amp; Privacy Policy
          </p>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════
  // STEP 3: NAME + PIN (minimal)
  // ═══════════════════════════════════════════════════
  if (step === "name") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-6">
          <button type="button" onClick={() => setStep("phone")} className="flex items-center gap-1 text-[12px] text-[#9ca3af] mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </button>

          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em] mb-1">What&apos;s your first name?</h2>
          <p className="text-[13px] text-[#9ca3af] mb-6">This goes on your lunch bag so you can find it at pickup</p>

          {error && <div className="bg-[#fee2e2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

          <div className="space-y-3 mb-5">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Tunde"
              className="w-full px-4 py-3.5 border border-[#e5e5e3] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
              autoFocus
            />
            <div>
              <label className="block text-[11px] font-medium text-[#9ca3af] mb-1.5">Create a 6-digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                maxLength={20}
                className="w-full px-4 py-3.5 border border-[#e5e5e3] rounded-xl text-[15px] tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading || !firstName.trim() || password.length < 6}
            className="w-full bg-[#f05f4b] text-white font-bold text-[14px] py-3.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-all"
          >
            {loading ? "Setting up..." : "Join " + office.name}
          </button>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════
  // STEP 4: WELCOME (auto-advances to /menu)
  // ═══════════════════════════════════════════════════
  if (step === "welcome") {
    return (
      <main className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center px-6" style={{ animation: "welcomeFadeIn 0.5s ease" }}>
        <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-5" style={{ animation: "welcomeCheck 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>

        <h2 className="font-display font-bold text-[24px] text-[#1a1a1a] tracking-[-0.03em] text-center mb-1">Welcome to</h2>
        <h2 className="font-display font-bold text-[24px] text-[#0f4030] tracking-[-0.03em] text-center mb-3">{office.name}</h2>

        <div className="bg-[#0f4030] text-white text-[11px] font-bold px-4 py-1.5 rounded-full mb-4">
          You&apos;re Colleague #{office.memberCount + 1}
        </div>

        <p className="text-[13px] text-[#9ca3af] text-center">
          Collect food at: <span className="font-semibold text-[#1a1a1a]">{office.collectionPoint}</span>
        </p>

        <p className="text-[11px] text-[#9ca3af] mt-6 animate-pulse">Taking you to the menu...</p>

        <style jsx>{`
          @keyframes welcomeFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes welcomeCheck { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </main>
    );
  }

  return null;
}
