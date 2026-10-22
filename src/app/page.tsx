"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

const WA_LINK = "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#fafaf8]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Sticky bottom CTA bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <Logo size={20} compact />
        <a href="/start" className="bg-[#f05f4b] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.97] transition-transform">
          Set Up My Office →
        </a>
      </div>

      <div className="max-w-[480px] mx-auto pb-24">
        {/* ════════════════════════════════════════ */}
        {/* SECTION 1: HERO */}
        {/* ════════════════════════════════════════ */}
        <section className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-center mb-8">
            <Logo size={28} />
          </div>

          <h1 className="font-display font-bold text-[28px] text-[#1a1a1a] tracking-[-0.04em] leading-[1.15] text-center mb-2">
            Your office lunch is<br />too expensive.
          </h1>
          <p className="font-display font-bold text-[22px] text-[#f05f4b] tracking-[-0.03em] text-center mb-6">
            Fix it in 2 minutes.
          </p>

          {/* Hero image placeholder */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f4030] to-[#0a2e20] h-[200px] flex items-center justify-center mb-5 relative">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#f5c565]/10" />
            <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-[#f05f4b]/10" />
            <div className="relative text-center px-6">
              <div className="text-[32px] mb-2">🍚📦🏢</div>
              <p className="text-white/80 text-[13px]">Fresh food, labelled bags, delivered to your reception</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-[15px] text-[#1a1a1a] font-medium leading-relaxed">
              Pool your office lunch orders.<br />
              Everyone saves 20–40%.<br />
              <span className="font-bold text-[#f05f4b]">You eat free.</span>
            </p>
          </div>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[16px] py-4 rounded-2xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform mb-3">
            Set Up My Office
            <span className="block text-[11px] font-medium text-white/70 mt-0.5">Free · Takes 2 minutes</span>
          </a>

          <p className="text-[12px] text-[#9ca3af] text-center">
            Already have an invite? <a href="/auth" className="text-[#f05f4b] font-semibold">Join your office</a>
          </p>

          <div className="flex items-center justify-center mt-6 mb-2">
            <a href="#math" className="text-[12px] text-[#9ca3af] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              How it works
            </a>
          </div>
        </section>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 2: THE MATH */}
        {/* ════════════════════════════════════════ */}
        <section id="math" className="px-5 py-8">
          <h2 className="font-display font-bold text-[20px] text-[#1a1a1a] tracking-[-0.03em] text-center mb-5">
            How much is your office<br />spending on lunch?
          </h2>

          {/* Without */}
          <div className="bg-[#f5f5f3] rounded-2xl p-5 mb-3">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.08em] mb-3">Without ChopDrop</div>
            <div className="space-y-1.5 text-[13px] text-[#6b7280]">
              <p>30 people × ₦2,000/day</p>
              <p className="font-display font-bold text-[18px] text-[#1a1a1a]">= ₦1,200,000/month</p>
              <p className="text-[11px] mt-2">Each person orders alone. Full price. + delivery fees.</p>
            </div>
          </div>

          <div className="text-center text-[14px] font-bold text-[#9ca3af] my-2">vs</div>

          {/* With */}
          <div className="bg-white rounded-2xl p-5 border border-[#22c55e]/20 mb-3">
            <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-[0.08em] mb-3">With ChopDrop</div>
            <div className="space-y-1.5 text-[13px] text-[#6b7280]">
              <p>30 people × ₦1,300/day</p>
              <p className="font-display font-bold text-[18px] text-[#0f4030]">= ₦780,000/month</p>
              <p className="text-[11px] mt-2">Everyone orders together. Pool discount. Free delivery to reception.</p>
            </div>
          </div>

          {/* Savings */}
          <div className="bg-[#f05f4b] rounded-2xl p-5 text-center">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-[0.08em] mb-1">Your office saves</div>
            <div className="font-display font-bold text-[32px] text-white tracking-[-0.03em]">₦420,000/mo</div>
            <p className="text-[12px] text-white/70 mt-1">That&apos;s ₦14,000 back in each person&apos;s pocket. Every month.</p>
          </div>
        </section>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 3: HOW IT WORKS */}
        {/* ════════════════════════════════════════ */}
        <section className="px-5 py-8">
          <h2 className="font-display font-bold text-[20px] text-[#1a1a1a] tracking-[-0.03em] mb-6">How it works</h2>

          {/* Step 1 */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#f05f4b] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">1</div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a]">You set up your office <span className="font-normal text-[#9ca3af]">(2 min)</span></h3>
            </div>
            <div className="ml-11 bg-[#0f4030] rounded-xl p-4 mb-2">
              <div className="text-[10px] font-bold text-[#6ee7b7] mb-1">Office name</div>
              <div className="text-[14px] font-semibold text-white">Sterling Bank HQ</div>
              <div className="mt-2 text-[10px] text-white/50">Invite link: chopdrop-app.vercel.app/join/sterling-hq</div>
            </div>
            <p className="ml-11 text-[12px] text-[#6b7280]">Enter your company name and share the invite link to your office WhatsApp group.</p>
          </div>

          {/* Step 2 */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#f5c565] text-[#5a3e00] flex items-center justify-center text-[13px] font-bold flex-shrink-0">2</div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a]">Colleagues pick their meal <span className="font-normal text-[#9ca3af]">(60 sec)</span></h3>
            </div>
            <div className="ml-11 bg-white rounded-xl border border-black/[0.06] p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-[#1a1a1a]">Jollof Rice + Chicken</span>
                <span className="text-[8px] font-bold text-white bg-[#f05f4b] px-1.5 py-0.5 rounded-full">-30%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-[#0f4030]">₦1,400</span>
                <span className="text-[11px] text-[#d1d5db] line-through">₦2,000</span>
              </div>
              <div className="mt-2 text-[9px] text-[#22c55e] font-medium">🏢 18 from your office · 2 more → ₦1,200</div>
            </div>
            <p className="ml-11 text-[12px] text-[#6b7280]">Everyone picks their own meal and pays on their phone. The more people order, the cheaper it gets — up to 40% off.</p>
          </div>

          {/* Step 3 */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">3</div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a]">Food arrives at reception <span className="font-normal text-[#9ca3af]">(by 1 PM)</span></h3>
            </div>
            <div className="ml-11 bg-white rounded-xl border border-black/[0.06] p-4 mb-2 flex items-center gap-3">
              <div className="text-[28px]">📦</div>
              <div>
                <div className="text-[12px] font-bold text-[#1a1a1a]">TUNDE</div>
                <div className="text-[10px] text-[#9ca3af]">Jollof + Chicken · Extra meat</div>
              </div>
            </div>
            <p className="ml-11 text-[12px] text-[#6b7280]">One batch delivery. Everyone&apos;s bag has their name on it. Pick up and eat.</p>
          </div>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-3.5 rounded-2xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform">
            Set Up My Office
          </a>
        </section>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 4: CAPTAIN BENEFITS */}
        {/* ════════════════════════════════════════ */}
        <section className="px-5 py-8 bg-[#0f4030] -mx-0 rounded-none" style={{ marginLeft: 0, marginRight: 0 }}>
          <h2 className="font-display font-bold text-[20px] text-white tracking-[-0.03em] mb-1">Wait — what do I get<br />out of this?</h2>
          <p className="text-[13px] text-white/50 mb-6">You become your office&apos;s Pool Captain. That means:</p>

          <div className="space-y-3 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] font-bold text-[#f5c565] uppercase tracking-[0.06em] mb-1">Free lunch</div>
              <p className="text-[13px] text-white font-medium">When 15+ colleagues order, your lunch is on us. Every day.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] font-bold text-[#6ee7b7] uppercase tracking-[0.06em] mb-1">Monthly bonus</div>
              <p className="text-[13px] text-white font-medium">₦500 per pool with 20+ orders. That&apos;s up to ₦10,000/month cash.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] font-bold text-[#f05f4b] uppercase tracking-[0.06em] mb-1">Office hero status</div>
              <p className="text-[13px] text-white font-medium">You&apos;re the person who saves everyone money. They&apos;ll thank you every single day.</p>
            </div>
          </div>

          <p className="text-[13px] text-white/60 text-center mb-5">
            Your total effort? <span className="text-white font-semibold">Send one WhatsApp message each morning.</span> The app does the rest.
          </p>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-3.5 rounded-2xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform">
            Set Up My Office
          </a>
        </section>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 5: SOCIAL PROOF */}
        {/* ════════════════════════════════════════ */}
        <section className="px-5 py-8">
          <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] tracking-[-0.03em] mb-4">Early pilot offices</h2>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-4 mb-3">
            <p className="text-[13px] text-[#1a1a1a] italic leading-relaxed mb-3">&ldquo;I used to spend 30 minutes every day collecting lunch orders on WhatsApp. Now I just tap &apos;Send Reminder&apos; and eat free.&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[9px] font-bold">AO</div>
              <div>
                <div className="text-[11px] font-semibold text-[#1a1a1a]">Pool Captain, Ikeja</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border border-black/[0.06] p-3 text-center">
              <div className="font-display font-bold text-[20px] text-[#0f4030]">20+</div>
              <div className="text-[9px] text-[#9ca3af] font-medium">pilot offices</div>
            </div>
            <div className="bg-white rounded-xl border border-black/[0.06] p-3 text-center">
              <div className="font-display font-bold text-[20px] text-[#f05f4b]">₦0</div>
              <div className="text-[9px] text-[#9ca3af] font-medium">delivery fee</div>
            </div>
            <div className="bg-white rounded-xl border border-black/[0.06] p-3 text-center">
              <div className="font-display font-bold text-[20px] text-[#f5c565]">40%</div>
              <div className="text-[9px] text-[#9ca3af] font-medium">max savings</div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 6: FAQ */}
        {/* ════════════════════════════════════════ */}
        <section className="px-5 py-8">
          <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] tracking-[-0.03em] mb-4">Common questions</h2>

          {[
            { q: "Is it really free?", a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for the guaranteed orders. You and your colleagues pay the discounted food price only." },
            { q: "What if only 3 people order?", a: "You still get your food — just at the regular price. The discount kicks in when 5+ people order from the same vendor. Most offices hit 10+ within the first week." },
            { q: "What vendors are available?", a: "We partner with vetted local food vendors near your office. If your office has a favorite vendor, we'll onboard them." },
            { q: "What if I don't want to be captain forever?", a: "Transfer the role to any colleague in one tap. But most captains stay — free lunch every day is a strong incentive." },
            { q: "How does payment work?", a: "Everyone pays for their own plate through the app (card or bank transfer via Paystack). No collecting cash. No chasing people." },
            { q: "Can people customize their food?", a: "Yes — everyone picks their own meal. Exactly what you want, not a fixed combo." },
          ].map((item, i) => (
            <div key={i} className="border-b border-black/[0.06] last:border-0">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-3.5 text-left"
              >
                <span className="text-[13px] font-semibold text-[#1a1a1a] pr-4">{item.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className={`flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {openFaq === i && (
                <p className="text-[12px] text-[#6b7280] leading-relaxed pb-3.5 -mt-1">{item.a}</p>
              )}
            </div>
          ))}
        </section>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 7: FINAL CTA */}
        {/* ════════════════════════════════════════ */}
        <section className="px-5 py-8 text-center">
          <h2 className="font-display font-bold text-[20px] text-[#1a1a1a] tracking-[-0.03em] mb-5">
            Ready to save your office<br />₦400K+ per month?
          </h2>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[16px] py-4 rounded-2xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform mb-3">
            Set Up My Office
            <span className="block text-[11px] font-medium text-white/70 mt-0.5">Free · Takes 2 minutes</span>
          </a>

          <p className="text-[12px] text-[#9ca3af] mb-6">
            Or <a href={WA_LINK} className="text-[#22c55e] font-semibold">WhatsApp us</a> — we&apos;ll set it up with you live
          </p>

          <div className="h-px bg-black/[0.06] mb-6" />

          <Logo size={24} />
          <p className="text-[12px] text-[#9ca3af] mt-2">Cheaper lunch. Zero stress.</p>
          <p className="text-[10px] text-[#9ca3af] mt-4">© 2026 Arete Ltd (trading as ChopDrop) · Lagos, Nigeria</p>
          <p className="text-[10px] text-[#9ca3af] mt-1">@chopdrop.ng</p>
        </section>
      </div>
    </div>
  );
}
