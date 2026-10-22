"use client";

import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/logo";

const WA_LINK = "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";
const HERO_IMG = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80&fit=crop";
const FOOD_JOLLOF = "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=400&q=80&fit=crop";
const FOOD_RICE = "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=400&q=80&fit=crop";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); ob.disconnect(); } }, { threshold: 0.12 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, visible };
}

function R({ children, d = 0, c = "" }: { children: React.ReactNode; d?: number; c?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={c} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `all 0.65s cubic-bezier(0.16,1,0.3,1) ${d}ms` }}>{children}</div>;
}

export default function Home() {
  const [faq, setFaq] = useState<number | null>(null);
  const [nav, setNav] = useState(false);
  useEffect(() => {
    const h = () => setNav(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f8f9fa" }}>
      {/* ── Top nav — glass morph ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${nav ? "bg-white/85 backdrop-blur-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "bg-transparent"}`}>
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-5 py-3">
          <Logo size={22} />
          <a href="/auth" className="text-[12px] font-semibold text-[#4b5563] hover:text-[#1a1a1a]">Log in</a>
        </div>
      </div>

      {/* ── Bottom CTA — glass ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-2xl border-t border-black/[0.04] px-4 py-3 flex items-center justify-between">
        <a href="/auth" className="text-[12px] font-semibold text-[#4b5563]">Log in</a>
        <a href="/start" className="bg-[#f05f4b] text-white font-bold text-[13px] px-5 py-2.5 rounded-full active:scale-[0.97] transition-transform" style={{ boxShadow: "0 2px 12px rgba(240,95,75,0.3)" }}>
          Set Up My Office →
        </a>
      </div>

      <div className="max-w-[480px] mx-auto pb-24">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HERO — clean, PiggyVest-calm, photo with soft frame    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-5 pt-16 pb-6">
          <div style={{ animation: "fu .7s cubic-bezier(.16,1,.3,1)" }}>
            <h1 className="font-display font-[800] text-[34px] text-[#111827] tracking-[-0.04em] leading-[1.08] mb-3">
              The better way 🍚<br />to eat at work.
            </h1>
            <p className="text-[15px] text-[#4b5563] leading-[1.6] mb-6 max-w-[340px]">
              ChopDrop pools your office lunch orders. Everyone saves 20–40% and you eat free as the Pool Captain.
            </p>
          </div>

          <div className="flex gap-2.5 mb-7" style={{ animation: "fu .7s cubic-bezier(.16,1,.3,1) .12s both" }}>
            <a href="/start" className="flex-1 bg-[#f05f4b] text-white text-center font-bold text-[14px] py-3.5 rounded-2xl active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 16px rgba(240,95,75,0.28)" }}>
              Set Up My Office
            </a>
            <a href="/menu" className="flex-1 bg-white text-[#111827] text-center font-bold text-[14px] py-3.5 rounded-2xl border border-[#e2e8f0] active:scale-[0.97] transition-transform">
              Browse Menu
            </a>
          </div>

          {/* Hero photo — soft 24px radius, border stroke, floating rounded pills */}
          <div className="rounded-3xl overflow-hidden relative border border-[#e2e8f0]" style={{ aspectRatio: "4/3", animation: "fu .8s cubic-bezier(.16,1,.3,1) .25s both", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG} alt="Nigerian food" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            {/* Floating pills — fully rounded (9999px) */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-white/50" style={{ animation: "fu .5s cubic-bezier(.16,1,.3,1) .7s both", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <span className="text-[10px] font-bold text-[#111827]">🏢 19 ordering today</span>
            </div>
            <div className="absolute top-3 right-3 bg-[#0f4030] rounded-full px-3.5 py-1.5" style={{ animation: "fu .5s cubic-bezier(.16,1,.3,1) .85s both", boxShadow: "0 2px 8px rgba(15,64,48,0.25)" }}>
              <span className="text-[10px] font-bold text-white">₦0 delivery</span>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-white/50" style={{ animation: "fu .5s cubic-bezier(.16,1,.3,1) 1s both", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <span className="text-[10px] font-bold text-[#f05f4b]">+₦420K saved/mo per office</span>
            </div>
          </div>

          <div className="text-center mt-5 space-y-1">
            <p className="text-[12px] text-[#4b5563]">Already a member? <a href="/auth" className="text-[#f05f4b] font-bold">Log in</a></p>
            <p className="text-[12px] text-[#6b7280]">Have an invite? <a href="/auth" className="text-[#6b7280] font-semibold underline">Join your office</a></p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* THE MATH — matching comparative cards, unified design   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <R>
            <p className="text-[11px] font-bold text-[#f05f4b] uppercase tracking-[0.1em] text-center mb-2">The lunch math</p>
            <h2 className="font-display font-[800] text-[26px] text-[#111827] tracking-[-0.03em] text-center leading-tight mb-8">
              How much is your office<br />spending on lunch?
            </h2>
          </R>

          {/* Comparative dashboard — matching card structure */}
          <R d={100}>
            <div className="bg-white rounded-3xl border border-[#e2e8f0] p-5 mb-3">
              <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] mb-3">Without ChopDrop</div>
              <p className="text-[13px] text-[#6b7280] mb-1.5">30 people × ₦2,000/day</p>
              <p className="font-display font-[800] text-[26px] text-[#111827] tracking-[-0.02em]">= ₦1,200,000<span className="text-[13px] font-medium text-[#9ca3af]">/mo</span></p>
              <p className="text-[11px] text-[#9ca3af] mt-2">Each person orders alone. Full price. + delivery fees.</p>
            </div>
          </R>

          <R d={150}><div className="flex items-center gap-3 my-2"><div className="flex-1 h-px bg-[#e2e8f0]" /><span className="text-[12px] font-bold text-[#9ca3af]">VS</span><div className="flex-1 h-px bg-[#e2e8f0]" /></div></R>

          {/* Recommended — glowing border instead of badge */}
          <R d={200}>
            <div className="rounded-3xl p-5 mb-4 relative" style={{ background: "white", border: "2px solid #0f4030", boxShadow: "0 0 0 4px rgba(15,64,48,0.06)" }}>
              <div className="absolute -top-3 left-5 bg-[#0f4030] text-white text-[9px] font-bold px-3.5 py-1 rounded-full">RECOMMENDED</div>
              <div className="text-[9px] font-bold text-[#0f4030] uppercase tracking-[0.1em] mb-3 mt-1">With ChopDrop</div>
              <p className="text-[13px] text-[#6b7280] mb-1.5">30 people × ₦1,300/day</p>
              <p className="font-display font-[800] text-[26px] text-[#0f4030] tracking-[-0.02em]">= ₦780,000<span className="text-[13px] font-medium text-[#9ca3af]">/mo</span></p>
              <p className="text-[11px] text-[#6b7280] mt-2">Everyone orders together. Pool discount. ₦0 delivery.</p>
            </div>
          </R>

          {/* Savings — coral, clean, not cut off */}
          <R d={300}>
            <div className="rounded-3xl p-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f05f4b 0%, #e8604c 50%, #f5c565 100%)" }}>
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10" />
              <div className="relative">
                <div className="text-[9px] font-bold text-white/60 uppercase tracking-[0.12em] mb-2">Your office saves</div>
                <div className="font-display font-[800] text-[42px] text-white tracking-[-0.03em] leading-none">₦420,000</div>
                <div className="text-[12px] text-white/70 mt-1 mb-3">per month</div>
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-5 py-2">
                  <span className="text-[12px] text-white font-semibold">₦14,000 back in each pocket. Every month.</span>
                </div>
              </div>
            </div>
          </R>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS — warm bg, tracking-style cards            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="py-12 px-5" style={{ background: "#f1ece3" }}>
          <R>
            <p className="text-[11px] font-bold text-[#f05f4b] uppercase tracking-[0.1em] mb-2">How it works</p>
            <h2 className="font-display font-[800] text-[26px] text-[#111827] tracking-[-0.03em] leading-tight mb-10">Three steps. Two minutes.</h2>
          </R>

          {/* Step 1 */}
          <R d={80}>
            <div className="mb-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#f05f4b] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0" style={{ boxShadow: "0 4px 12px rgba(240,95,75,0.2)" }}>1</div>
                <div><h3 className="text-[16px] font-bold text-[#111827]">You set up your office</h3><p className="text-[11px] text-[#6b7280]">Takes 2 minutes</p></div>
              </div>
              <div className="bg-white rounded-3xl border border-[#e2e8f0] p-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div className="flex items-center gap-2 mb-3"><div className="w-2.5 h-2.5 rounded-full bg-[#0f4030]" /><span className="text-[10px] font-bold text-[#0f4030]">Office created</span></div>
                <div className="text-[15px] font-bold text-[#111827] mb-0.5">Sterling Bank HQ</div>
                <div className="text-[11px] text-[#6b7280] mb-3">20 Marina St, Lagos Island</div>
                <div className="bg-[#f0fdf4] rounded-xl px-3.5 py-2.5 text-[10px] text-[#0f4030] font-medium">🔗 chopdrop-app.vercel.app/join/sterling-hq</div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-3 leading-relaxed">Enter your company name and share the invite link to your office WhatsApp group.</p>
            </div>
          </R>

          {/* Step 2 */}
          <R d={140}>
            <div className="mb-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#f5c565] text-[#5a3e00] flex items-center justify-center text-[15px] font-bold flex-shrink-0" style={{ boxShadow: "0 4px 12px rgba(245,197,101,0.2)" }}>2</div>
                <div><h3 className="text-[16px] font-bold text-[#111827]">Colleagues pick their meal</h3><p className="text-[11px] text-[#6b7280]">60 seconds each</p></div>
              </div>
              <div className="bg-white rounded-3xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div className="flex h-[90px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FOOD_JOLLOF} alt="" className="w-1/2 object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FOOD_RICE} alt="" className="w-1/2 object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-[#111827]">Mama Tola&apos;s Kitchen</span>
                    <span className="text-[8px] font-bold text-white bg-[#0f4030] px-2.5 py-1 rounded-full">POOL: 20% OFF</span>
                  </div>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between"><span className="text-[#6b7280]">Base: <strong className="text-[#374151]">Jollof Rice</strong></span><span className="font-semibold">₦400</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Protein: <strong className="text-[#374151]">Chicken</strong></span><span className="font-semibold">₦480</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Side: <strong className="text-[#374151]">Plantain</strong></span><span className="font-semibold">₦240</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Drink: <span className="text-[#9ca3af]">Zobo</span></span><span className="font-semibold">₦240</span></div>
                    <div className="h-px bg-[#e2e8f0]" />
                    <div className="flex justify-between font-bold text-[14px]"><span className="text-[#0f4030]">Total</span><span>₦1,360</span></div>
                    <p className="text-[10px] text-[#f05f4b] font-bold">You save ₦340 (20%)</p>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-3 leading-relaxed">Everyone picks their own meal. More people = cheaper prices — up to 40% off.</p>
            </div>
          </R>

          {/* Step 3 — tracking-style card */}
          <R d={200}>
            <div className="mb-8">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#0f4030] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0" style={{ boxShadow: "0 4px 12px rgba(15,64,48,0.2)" }}>3</div>
                <div><h3 className="text-[16px] font-bold text-[#111827]">Food arrives at reception</h3><p className="text-[11px] text-[#6b7280]">By 1:00 PM</p></div>
              </div>
              <div className="bg-white rounded-3xl border border-[#e2e8f0] p-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                {/* Tracking-style header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e2e8f0]">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#22c55e]">Delivered · 12:58 PM</span>
                </div>
                <div className="flex items-center gap-3.5 mb-3.5 pb-3.5 border-b border-[#f3f4f6]">
                  <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[18px]">📦</div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-[#111827]">TUNDE</div>
                    <div className="text-[11px] text-[#6b7280]"><strong className="text-[#374151]">Jollof + Chicken</strong> · <span className="text-[#9ca3af]">Extra meat · Zobo</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#fce7f3] flex items-center justify-center text-[18px]">📦</div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-[#111827]">BLESSING</div>
                    <div className="text-[11px] text-[#6b7280]"><strong className="text-[#374151]">Fried Rice + Turkey</strong> · <span className="text-[#9ca3af]">Plantain</span></div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-3 leading-relaxed">One batch delivery. Everyone&apos;s bag has their name. Pick up and eat.</p>
            </div>
          </R>

          <R d={250}><a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-4 rounded-2xl active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 16px rgba(240,95,75,0.28)" }}>Set Up My Office</a></R>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CAPTAIN PERKS — dark section, glassmorphism cards       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: "#0f4030" }}>
          <R>
            <p className="text-[11px] font-bold text-[#6ee7b7] uppercase tracking-[0.1em] mb-2">Pool Captain perks</p>
            <h2 className="font-display font-[800] text-[26px] text-white tracking-[-0.03em] leading-tight mb-2">Wait — what do I get<br />out of this?</h2>
            <p className="text-[14px] text-white/60 mb-8">You become your office&apos;s Pool Captain.</p>
          </R>

          <div className="space-y-3 mb-8">
            <R d={100}>
              <div className="rounded-3xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: "rgba(240,95,75,0.15)" }}>🍽️</div>
                  <span className="text-[10px] font-[800] text-[#f05f4b] uppercase tracking-[0.08em]">Free lunch</span>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">When 15+ colleagues order, your lunch is on us. Every day.</p>
              </div>
            </R>
            <R d={180}>
              <div className="rounded-3xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: "rgba(245,197,101,0.15)" }}>💰</div>
                  <span className="text-[10px] font-[800] text-[#f5c565] uppercase tracking-[0.08em]">Monthly bonus</span>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">₦500 per pool with 20+ orders. Up to ₦10,000/month cash.</p>
              </div>
            </R>
            <R d={260}>
              <div className="rounded-3xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: "rgba(110,231,183,0.15)" }}>👑</div>
                  <span className="text-[10px] font-[800] text-[#6ee7b7] uppercase tracking-[0.08em]">Office hero</span>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">You save everyone money. They&apos;ll thank you every single day.</p>
              </div>
            </R>
          </div>

          <R d={340}>
            <div className="text-center mb-6">
              <p className="text-[13px] text-white/50">Your total effort?</p>
              <p className="text-[16px] text-white font-bold mt-1">Send one WhatsApp message each morning.</p>
              <p className="text-[11px] text-white/40 mt-1">The app does the rest.</p>
            </div>
            <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-4 rounded-2xl active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 20px rgba(240,95,75,0.35)" }}>Set Up My Office</a>
          </R>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SOCIAL PROOF — unified metric bento + softer cards      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: "#f0faf5" }}>
          <R>
            <h2 className="font-display font-[800] text-[26px] text-[#111827] tracking-[-0.03em] text-center leading-tight mb-8">
              Join offices already<br />saving with ChopDrop
            </h2>
          </R>

          <R d={80}>
            <div className="bg-white rounded-3xl p-5 mb-3 border border-[#e2e8f0]">
              <p className="text-[14px] text-[#374151] italic leading-relaxed mb-4">&ldquo;I used to spend 30 minutes every day collecting lunch orders on WhatsApp. Now I just tap &apos;Send Reminder&apos; and eat free.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f05f4b] to-[#f5c565] flex items-center justify-center text-white text-[11px] font-bold">AO</div>
                <div><div className="text-[13px] font-bold text-[#111827]">Pool Captain</div><div className="text-[10px] text-[#6b7280]">Office in Ikeja · 28 colleagues</div></div>
              </div>
            </div>
          </R>

          <R d={160}>
            <div className="bg-white rounded-3xl p-5 mb-6 border border-[#e2e8f0]">
              <p className="text-[14px] text-[#374151] italic leading-relaxed mb-4">&ldquo;Our team of 35 saves over ₦400K per month. Setup took 2 minutes. Best decision I made this quarter.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f4030] to-[#22c55e] flex items-center justify-center text-white text-[11px] font-bold">CE</div>
                <div><div className="text-[13px] font-bold text-[#111827]">Office Manager</div><div className="text-[10px] text-[#6b7280]">Lagos Island · 35 colleagues</div></div>
              </div>
            </div>
          </R>

          {/* Unified metric bento — single card, consistent colors */}
          <R d={240}>
            <div className="bg-white rounded-3xl border border-[#e2e8f0] p-1.5">
              <div className="grid grid-cols-3">
                <div className="p-3.5 text-center">
                  <div className="font-display font-[800] text-[22px] text-[#0f4030]">20+</div>
                  <div className="text-[9px] text-[#6b7280] font-medium mt-0.5">pilot offices</div>
                </div>
                <div className="p-3.5 text-center border-x border-[#f3f4f6]">
                  <div className="font-display font-[800] text-[22px] text-[#0f4030]">₦0</div>
                  <div className="text-[9px] text-[#6b7280] font-medium mt-0.5">delivery fee</div>
                </div>
                <div className="p-3.5 text-center">
                  <div className="font-display font-[800] text-[22px] text-[#0f4030]">40%</div>
                  <div className="text-[9px] text-[#6b7280] font-medium mt-0.5">max savings</div>
                </div>
              </div>
            </div>
          </R>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FAQ — soft dividers, smooth arrows                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <R>
            <p className="text-[11px] font-bold text-[#f05f4b] uppercase tracking-[0.1em] mb-2">FAQ</p>
            <h2 className="font-display font-[800] text-[22px] text-[#111827] tracking-[-0.03em] mb-6">Common questions</h2>
          </R>
          {[
            { q: "Is it really free?", a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for guaranteed orders. You pay the discounted food price only." },
            { q: "What if only 3 people order?", a: "You still get your food — at the regular price. Discounts kick in at 5+. Most offices hit 10+ within the first week." },
            { q: "What vendors are available?", a: "We partner with vetted local vendors near your office. Have a favorite? We'll onboard them." },
            { q: "What if I don't want to be captain forever?", a: "Transfer the role in one tap. But most captains stay — free lunch every day is hard to give up." },
            { q: "How does payment work?", a: "Everyone pays for their own plate via card or bank transfer (Paystack). No collecting cash." },
            { q: "Can people customize their food?", a: "Yes — everyone picks their own meal. Exactly what you want, not a fixed combo." },
          ].map((item, i) => (
            <R key={i} d={i * 30}>
              <div className={`${i > 0 ? "border-t border-[#f3f4f6]" : ""}`}>
                <button type="button" onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="text-[14px] font-semibold text-[#111827] pr-4">{item.q}</span>
                  <div className={`w-6 h-6 rounded-full bg-[#f3f4f6] flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${faq === i ? "rotate-180" : ""}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${faq === i ? "max-h-40 opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
                  <p className="text-[13px] text-[#6b7280] leading-relaxed">{item.a}</p>
                </div>
              </div>
            </R>
          ))}
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FINAL CTA — coral gradient                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden py-14 px-5 text-center" style={{ background: "linear-gradient(135deg, #f05f4b 0%, #f5c565 100%)" }}>
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-white/10" />
          <R>
            <h2 className="font-display font-[800] text-[26px] text-white tracking-[-0.03em] leading-tight mb-6 relative">
              Ready to save your<br />office ₦400K+ per month?
            </h2>
          </R>
          <R d={120}>
            <a href="/start" className="block w-full bg-white text-[#f05f4b] text-center font-bold text-[16px] py-4 rounded-2xl active:scale-[0.97] transition-transform mb-4 relative" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              Set Up My Office
              <span className="block text-[11px] font-medium text-[#f05f4b]/60 mt-0.5">Free · Takes 2 minutes</span>
            </a>
          </R>
          <R d={200}><p className="text-[13px] text-white/80 relative">Or <a href={WA_LINK} className="text-white font-bold underline">WhatsApp us</a> — we&apos;ll set it up with you live</p></R>
        </section>

        <section className="px-5 py-8 text-center">
          <Logo size={24} />
          <p className="text-[12px] text-[#9ca3af] mt-2">Cheaper lunch. Zero stress.</p>
          <p className="text-[10px] text-[#9ca3af] mt-4">© 2026 Arete Ltd (trading as ChopDrop)</p>
          <p className="text-[10px] text-[#9ca3af]">Lagos, Nigeria · @chopdrop.ng</p>
        </section>
      </div>

      <style jsx global>{`@keyframes fu{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
