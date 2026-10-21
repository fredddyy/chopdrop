"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import Link from "next/link";

interface JoinClientProps {
  office: {
    id: string;
    name: string;
    code: string;
    address: string;
    collectionPoint: string;
    memberCount: number;
    todayOrders: number;
  };
  menuPreview: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    restaurantName: string;
    tag: string;
  }[];
}

function formatNaira(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

export function JoinClient({ office, menuPreview }: JoinClientProps) {
  const [step, setStep] = useState<"preview" | "phone" | "details" | "done">("preview");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!firstName.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Step 1: Create account
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || firstName.trim(),
          email: email.trim() || `${phone.trim().replace(/\s/g, "")}@chopdrop.ng`,
          phone: phone.trim().replace(/\s/g, ""),
          password: password.trim(),
        }),
      });
      const signupData = await signupRes.json();

      if (!signupData.success) {
        // If user already exists, try signing in
        if (signupData.error?.includes("already")) {
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
          setError(signupData.error || "Signup failed");
          setLoading(false);
          return;
        }
      }

      // Step 2: Connect to office
      await fetch("/api/auth/connect-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: office.code }),
      });

      setStep("done");
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  // ── Step 1: Value Preview (what they see before signing up) ──
  if (step === "preview") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <Logo size={28} />
          </div>

          {/* Office card */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 mb-4 text-center">
            <div className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.08em] mb-1">You&apos;re joining</div>
            <h1 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em]">{office.name}</h1>
            <p className="text-[12px] text-[#9ca3af] mt-1">{office.address}</p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {office.memberCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(3, office.memberCount) }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-[#0f4030] border-2 border-white flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">{String.fromCharCode(65 + i)}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[12px] font-medium text-[#6b7280]">{office.memberCount} colleague{office.memberCount !== 1 ? "s" : ""} here</span>
                </div>
              )}
              {office.todayOrders > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[11px] font-medium text-[#22c55e]">{office.todayOrders} ordering today</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's menu preview */}
          {menuPreview.length > 0 && (
            <div className="mb-5">
              <h2 className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">Today&apos;s lunch</h2>
              <div className="space-y-2">
                {menuPreview.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-black/[0.04]">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[18px]">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#1a1a1a] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#9ca3af]">{item.restaurantName}</div>
                    </div>
                    <span className="font-display font-bold text-[14px] text-[#0f4030] flex-shrink-0">{formatNaira(item.price)}</span>
                  </div>
                ))}
              </div>
              {menuPreview.length > 3 && (
                <p className="text-[11px] text-[#9ca3af] text-center mt-2">+ {menuPreview.length - 3} more meals</p>
              )}
            </div>
          )}

          {/* Value props */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[11px] font-medium text-[#6b7280]">₦0 delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[11px] font-medium text-[#6b7280]">Pick &amp; pay on phone</span>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full bg-[#f05f4b] text-white font-bold text-[15px] py-4 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform"
          >
            Join &amp; Order — takes 60 seconds
          </button>

          <p className="text-[10px] text-[#9ca3af] text-center mt-3">No app download needed</p>
        </div>
      </main>
    );
  }

  // ── Step 2: Phone number ──
  if (step === "phone") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-6">
          <div className="flex items-center justify-center mb-8">
            <Logo size={28} />
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">Join {office.name}</h2>
            <p className="text-[13px] text-[#9ca3af] mb-6">Enter your phone number to get started</p>

            <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812 345 6789"
              className="w-full px-4 py-3.5 border border-[#e5e5e3] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
              autoFocus
            />

            <button
              type="button"
              onClick={() => { if (phone.trim().length >= 10) setStep("details"); }}
              disabled={phone.trim().length < 10}
              className="w-full mt-4 bg-[#f05f4b] text-white font-bold text-[14px] py-3.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>

          <button type="button" onClick={() => setStep("preview")} className="block mx-auto mt-4 text-[12px] text-[#9ca3af] hover:text-[#6b7280]">
            ← Back
          </button>
        </div>
      </main>
    );
  }

  // ── Step 3: Name + password ──
  if (step === "details") {
    return (
      <main className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-[480px] mx-auto px-5 py-6">
          <div className="flex items-center justify-center mb-8">
            <Logo size={28} />
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">Almost there</h2>
            <p className="text-[13px] text-[#9ca3af] mb-6">What should your colleagues call you?</p>

            {error && <div className="bg-[#fee2e2] text-[#f05f4b] text-[12px] font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Amaka"
                  className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Email <span className="font-normal text-[#9ca3af]">(optional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amaka@company.com"
                  className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1a1a1a] mb-1.5">Create a PIN <span className="font-normal text-[#9ca3af]">(6+ characters)</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 border border-[#e5e5e3] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f05f4b]/30 focus:border-[#f05f4b]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading || !firstName.trim() || !password.trim()}
              className="w-full mt-5 bg-[#f05f4b] text-white font-bold text-[14px] py-3.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all"
            >
              {loading ? "Creating account..." : "Join & start ordering"}
            </button>
          </div>

          <button type="button" onClick={() => setStep("phone")} className="block mx-auto mt-4 text-[12px] text-[#9ca3af] hover:text-[#6b7280]">
            ← Back
          </button>
        </div>
      </main>
    );
  }

  // ── Step 4: Done — redirect to menu ──
  return (
    <main className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-[480px] mx-auto px-5 py-6 text-center">
        <div className="flex items-center justify-center mb-8">
          <Logo size={28} />
        </div>

        <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>

        <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] mb-1">You&apos;re in!</h2>
        <p className="text-[14px] text-[#9ca3af] mb-2">Welcome to <span className="font-semibold text-[#1a1a1a]">{office.name}</span></p>
        <p className="text-[12px] text-[#9ca3af] mb-6">Collect your food at: <span className="font-semibold text-[#0f4030]">{office.collectionPoint}</span></p>

        <Link
          href="/menu"
          className="inline-block bg-[#f05f4b] text-white font-bold text-[15px] px-8 py-4 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform"
        >
          Start ordering lunch →
        </Link>
      </div>
    </main>
  );
}
