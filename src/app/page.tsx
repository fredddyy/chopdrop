"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

const WA_LINK = "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";

// Real food photos — warm, appetizing, Nigerian
const HERO_IMG = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80&fit=crop";
const FOOD_JOLLOF = "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=400&q=80&fit=crop";
const FOOD_RICE = "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=400&q=80&fit=crop";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#FAF7F2" }}>
      {/* ── Sticky bottom CTA bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <Logo size={20} compact />
        <a href="/start" className="bg-[#f05f4b] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.97] transition-transform">
          Set Up My Office →
        </a>
      </div>

      <div className="max-w-[480px] mx-auto pb-24">
        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 1: HERO — Photo-led, warm, full-bleed          */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="px-5 pt-5 pb-2">
          <div className="flex items-center justify-between mb-6">
            <Logo size={26} />
            <a href="/auth" className="text-[12px] font-semibold text-[#6b7280] hover:text-[#1a1a1a]">Log in</a>
          </div>

          <h1 className="font-display font-bold text-[30px] text-[#1a1a1a] tracking-[-0.04em] leading-[1.1] mb-2">
            Your office lunch<br />is <span className="text-[#f05f4b]">too expensive.</span>
          </h1>
          <p className="font-display font-bold text-[20px] text-[#0f4030] tracking-[-0.02em] mb-5">
            Fix it in 2 minutes.
          </p>

          {/* Hero photo — real food, warm */}
          <div className="rounded-2xl overflow-hidden mb-5 relative" style={{ aspectRatio: "16/10" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG} alt="Nigerian food spread" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-[13px] font-semibold leading-snug">Fresh food, labelled bags, delivered to your reception every day</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[16px] text-[#1a1a1a] leading-relaxed">
              Pool your office lunch orders.<br />
              Everyone saves 20–40%.<br />
              <span className="font-bold text-[#f05f4b]">You eat free.</span>
            </p>
          </div>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[16px] py-4 rounded-2xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform mb-3">
            Set Up My Office
            <span className="block text-[11px] font-medium text-white/70 mt-0.5">Free · Takes 2 minutes</span>
          </a>

          <p className="text-[12px] text-[#9ca3af] text-center mb-2">
            Already have an invite? <a href="/auth" className="text-[#f05f4b] font-semibold">Join your office</a>
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 2: THE MATH — Cards on warm cream, numerical   */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="px-5 py-10">
          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em] text-center mb-6">
            How much is your office<br />spending on lunch?
          </h2>

          {/* Without */}
          <div className="bg-white rounded-2xl p-5 mb-3 border border-black/[0.04]">
            <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] mb-3">Without ChopDrop</div>
            <p className="text-[13px] text-[#6b7280] mb-1">30 people × ₦2,000/day</p>
            <p className="font-display font-bold text-[22px] text-[#1a1a1a] mb-1">= ₦1,200,000<span className="text-[14px] font-medium text-[#9ca3af]">/month</span></p>
            <p className="text-[11px] text-[#9ca3af]">Each person orders alone. Full price. + delivery fees.</p>
          </div>

          <div className="text-center text-[13px] font-bold text-[#d1d5db] my-2">vs</div>

          {/* With */}
          <div className="bg-white rounded-2xl p-5 border-2 border-[#22c55e]/30 mb-3 relative">
            <div className="absolute -top-2.5 left-4 bg-[#22c55e] text-white text-[8px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-[0.06em]">Recommended</div>
            <div className="text-[9px] font-bold text-[#22c55e] uppercase tracking-[0.1em] mb-3 mt-1">With ChopDrop</div>
            <p className="text-[13px] text-[#6b7280] mb-1">30 people × ₦1,300/day</p>
            <p className="font-display font-bold text-[22px] text-[#0f4030] mb-1">= ₦780,000<span className="text-[14px] font-medium text-[#9ca3af]">/month</span></p>
            <p className="text-[11px] text-[#6b7280]">Everyone orders together. Pool discount. ₦0 delivery.</p>
          </div>

          {/* Savings — coral, warm */}
          <div className="bg-[#f05f4b] rounded-2xl p-5 text-center">
            <div className="text-[9px] font-bold text-white/60 uppercase tracking-[0.1em] mb-1">Your office saves</div>
            <div className="font-display font-bold text-[36px] text-white tracking-[-0.03em] leading-none">₦420,000</div>
            <div className="text-[11px] text-white/80 mt-1">per month</div>
            <div className="h-px bg-white/20 my-3" />
            <p className="text-[13px] text-white font-medium">That&apos;s <span className="font-bold">₦14,000</span> back in each person&apos;s pocket. Every month.</p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 3: HOW IT WORKS — Phone mockups, product-first */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="py-10 px-5" style={{ background: "#F3EDE4" }}>
          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em] mb-8">How it works</h2>

          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#f05f4b] text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a]">You set up your office</h3>
                <p className="text-[11px] text-[#9ca3af]">Takes 2 minutes</p>
              </div>
            </div>
            {/* Mini phone mockup */}
            <div className="ml-6 bg-white rounded-2xl border border-black/[0.08] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                <span className="text-[10px] font-bold text-[#22c55e]">Office created</span>
              </div>
              <div className="text-[14px] font-bold text-[#1a1a1a] mb-1">Sterling Bank HQ</div>
              <div className="text-[10px] text-[#9ca3af] mb-3">20 Marina St, Lagos Island</div>
              <div className="bg-[#f0fdf4] rounded-lg px-3 py-2 text-[10px] text-[#0f4030]">
                🔗 chopdrop-app.vercel.app/join/sterling-hq
              </div>
            </div>
            <p className="ml-6 text-[12px] text-[#6b7280] mt-2">Enter your company name and share the invite link to your office WhatsApp group.</p>
          </div>

          {/* Step 2 — Build your plate mockup */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#f5c565] text-[#5a3e00] flex items-center justify-center text-[14px] font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a]">Colleagues pick their meal</h3>
                <p className="text-[11px] text-[#9ca3af]">60 seconds each</p>
              </div>
            </div>
            <div className="ml-6 bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {/* Food image strip */}
              <div className="flex h-[80px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FOOD_JOLLOF} alt="" className="w-1/2 object-cover" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FOOD_RICE} alt="" className="w-1/2 object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-bold text-[#1a1a1a]">Mama Tola&apos;s Kitchen</span>
                  <span className="text-[8px] font-bold text-white bg-[#22c55e] px-2 py-0.5 rounded-full">POOL: 20% OFF</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[#6b7280]">Base: Jollof Rice</span><span className="font-semibold">₦400</span></div>
                  <div className="flex justify-between"><span className="text-[#6b7280]">Protein: Chicken</span><span className="font-semibold">₦480</span></div>
                  <div className="flex justify-between"><span className="text-[#6b7280]">Side: Plantain</span><span className="font-semibold">₦240</span></div>
                  <div className="flex justify-between"><span className="text-[#6b7280]">Drink: Zobo</span><span className="font-semibold">₦240</span></div>
                  <div className="h-px bg-black/[0.06]" />
                  <div className="flex justify-between font-bold text-[13px]"><span className="text-[#0f4030]">Total</span><span>₦1,360</span></div>
                  <div className="text-[10px] text-[#f05f4b] font-semibold">You save ₦340 (20%)</div>
                </div>
              </div>
            </div>
            <p className="ml-6 text-[12px] text-[#6b7280] mt-2">Everyone picks their own meal. The more people order from the same vendor, the cheaper it gets — up to 40% off.</p>
          </div>

          {/* Step 3 — Delivery */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a]">Food arrives at reception</h3>
                <p className="text-[11px] text-[#9ca3af]">By 1:00 PM</p>
              </div>
            </div>
            <div className="ml-6 bg-white rounded-2xl border border-black/[0.08] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-[28px]">📦</div>
                <div>
                  <div className="font-display font-bold text-[14px] text-[#1a1a1a]">TUNDE</div>
                  <div className="text-[10px] text-[#9ca3af]">Jollof + Chicken · Extra meat · Zobo</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[28px]">📦</div>
                <div>
                  <div className="font-display font-bold text-[14px] text-[#1a1a1a]">BLESSING</div>
                  <div className="text-[10px] text-[#9ca3af]">Fried Rice + Turkey · Plantain</div>
                </div>
              </div>
            </div>
            <p className="ml-6 text-[12px] text-[#6b7280] mt-2">One batch delivery. Everyone&apos;s bag has their name on it. Pick up and eat.</p>
          </div>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-3.5 rounded-2xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform">
            Set Up My Office
          </a>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 4: CAPTAIN BENEFITS — Warm terracotta banner   */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="px-5 py-10">
          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em] mb-1">Wait — what do I get<br />out of this?</h2>
          <p className="text-[13px] text-[#9ca3af] mb-6">You become your office&apos;s Pool Captain. That means:</p>

          <div className="space-y-3 mb-6">
            {/* Card 1 — warm cream, not dark green */}
            <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#f05f4b]/10 flex items-center justify-center text-[20px]">🍽️</div>
                <div className="text-[10px] font-bold text-[#f05f4b] uppercase tracking-[0.06em]">Free lunch</div>
              </div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">When 15+ colleagues order, your lunch is on us. Every day.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[20px]">💰</div>
                <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-[0.06em]">Monthly bonus</div>
              </div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">₦500 per pool with 20+ orders. That&apos;s up to ₦10,000/month cash.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#f5c565]/15 flex items-center justify-center text-[20px]">👑</div>
                <div className="text-[10px] font-bold text-[#92702a] uppercase tracking-[0.06em]">Office hero</div>
              </div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">You&apos;re the person who saves everyone money. They&apos;ll thank you every single day.</p>
            </div>
          </div>

          <div className="bg-[#0f4030] rounded-2xl p-4 text-center mb-5">
            <p className="text-[13px] text-white/70">Your total effort?</p>
            <p className="text-[14px] text-white font-bold mt-1">Send one WhatsApp message each morning.</p>
            <p className="text-[12px] text-white/50 mt-1">The app does the rest.</p>
          </div>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-3.5 rounded-2xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform">
            Set Up My Office
          </a>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 5: SOCIAL PROOF — Human, with photo            */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="px-5 py-10" style={{ background: "#F3EDE4" }}>
          <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] tracking-[-0.03em] mb-4">Offices already saving</h2>

          <div className="bg-white rounded-2xl p-5 border border-black/[0.04] mb-3">
            <p className="text-[14px] text-[#1a1a1a] italic leading-relaxed mb-4">&ldquo;I used to spend 30 minutes every day collecting lunch orders on WhatsApp. Now I just tap &apos;Send Reminder&apos; and eat free.&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f05f4b] to-[#f5c565] flex items-center justify-center text-white text-[13px] font-bold">AO</div>
              <div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">Pool Captain</div>
                <div className="text-[11px] text-[#9ca3af]">Office in Ikeja · 28 colleagues</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-black/[0.04] mb-4">
            <p className="text-[14px] text-[#1a1a1a] italic leading-relaxed mb-4">&ldquo;Our team of 35 saves over ₦400K per month. Setup took 2 minutes. Best decision I made this quarter.&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f4030] to-[#22c55e] flex items-center justify-center text-white text-[13px] font-bold">CE</div>
              <div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">Office Manager</div>
                <div className="text-[11px] text-[#9ca3af]">Office in Lagos Island · 35 colleagues</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-3 text-center border border-black/[0.04]">
              <div className="font-display font-bold text-[22px] text-[#0f4030]">20+</div>
              <div className="text-[9px] text-[#9ca3af] font-medium">pilot offices</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-black/[0.04]">
              <div className="font-display font-bold text-[22px] text-[#f05f4b]">₦0</div>
              <div className="text-[9px] text-[#9ca3af] font-medium">delivery fee</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-black/[0.04]">
              <div className="font-display font-bold text-[22px] text-[#f5c565]">40%</div>
              <div className="text-[9px] text-[#9ca3af] font-medium">max savings</div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 6: FAQ — Clean, breathing room                 */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="px-5 py-10">
          <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] tracking-[-0.03em] mb-5">Common questions</h2>

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
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-[14px] font-semibold text-[#1a1a1a] pr-4">{item.q}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className={`flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {openFaq === i && (
                <p className="text-[13px] text-[#6b7280] leading-relaxed pb-4 -mt-1">{item.a}</p>
              )}
            </div>
          ))}
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 7: FINAL CTA — Coral warmth, urgency           */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="px-5 py-10 text-center" style={{ background: "#F3EDE4" }}>
          <h2 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em] mb-5">
            Ready to save your office<br /><span className="text-[#f05f4b]">₦400K+ per month?</span>
          </h2>

          <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[16px] py-4 rounded-2xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.98] transition-transform mb-3">
            Set Up My Office
            <span className="block text-[11px] font-medium text-white/70 mt-0.5">Free · Takes 2 minutes</span>
          </a>

          <p className="text-[13px] text-[#6b7280] mb-8">
            Or <a href={WA_LINK} className="text-[#22c55e] font-semibold underline">WhatsApp us</a> — we&apos;ll set it up with you live
          </p>

          <div className="h-px bg-black/[0.08] mb-6" />

          <div className="flex items-center justify-center mb-2">
            <Logo size={24} />
          </div>
          <p className="text-[12px] text-[#9ca3af]">Cheaper lunch. Zero stress.</p>
          <p className="text-[10px] text-[#9ca3af] mt-4">© 2026 Arete Ltd (trading as ChopDrop)</p>
          <p className="text-[10px] text-[#9ca3af]">Lagos, Nigeria · @chopdrop.ng</p>
        </section>
      </div>
    </div>
  );
}
