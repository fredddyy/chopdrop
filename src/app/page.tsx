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
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    }}>{children}</div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [navSolid, setNavSolid] = useState(false);

  useEffect(() => {
    function handleScroll() { setNavSolid(window.scrollY > 50); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Sticky top nav — glass morph ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navSolid ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "bg-transparent"}`}>
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-5 py-3">
          <Logo size={22} />
          <a href="/auth" className="text-[12px] font-semibold text-[#6b7280] hover:text-[#1a1a1a] transition-colors">Log in</a>
        </div>
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <Logo size={20} compact />
        <a href="/start" className="bg-[#f05f4b] text-white font-bold text-[13px] px-5 py-2.5 rounded-full shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-[0.97] transition-transform">
          Set Up My Office →
        </a>
      </div>

      <div className="max-w-[480px] mx-auto pb-24">

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HERO — PiggyVest clean: light bg, big type, photo below      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="px-5 pt-16 pb-8">
          <div style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <h1 className="font-display font-[800] text-[36px] text-[#1a1a1a] tracking-[-0.04em] leading-[1.06] mb-3">
              The better way 🍚<br />to eat at work.
            </h1>
            <p className="text-[15px] text-[#6b7280] leading-relaxed mb-6 max-w-[340px]">
              ChopDrop helps offices save 20–40% on lunch by pooling orders together. ₦0 delivery. You eat free.
            </p>
          </div>

          <div className="flex gap-2.5 mb-7" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}>
            <a href="/start" className="flex-1 bg-[#f05f4b] text-white text-center font-bold text-[14px] py-3.5 rounded-full shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.97] transition-transform">
              Set Up My Office
            </a>
            <a href="/menu" className="flex-1 bg-white text-[#1a1a1a] text-center font-bold text-[14px] py-3.5 rounded-full border border-black/[0.08] active:scale-[0.97] transition-transform">
              Browse Menu
            </a>
          </div>

          {/* Hero image — PiggyVest: real photo with floating UI overlays */}
          <div
            className="rounded-2xl overflow-hidden relative shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            style={{ aspectRatio: "4/3", animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG} alt="Nigerian food" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Floating overlay badges — PiggyVest style */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.1)]" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.7s both" }}>
              <div className="text-[8px] font-bold text-[#9ca3af] uppercase tracking-[0.08em]">Today&apos;s Pool</div>
              <div className="text-[13px] font-bold text-[#0f4030]">19 ordering</div>
            </div>
            <div className="absolute top-3 right-3 bg-[#22c55e] rounded-full px-3 py-1.5 shadow-[0_2px_8px_rgba(34,197,94,0.3)]" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.9s both" }}>
              <span className="text-[10px] font-bold text-white">₦0 delivery</span>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.1)]" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 1.1s both" }}>
              <div className="text-[8px] font-bold text-[#f05f4b] uppercase tracking-[0.08em]">Pool Savings</div>
              <div className="text-[13px] font-bold text-[#1a1a1a]">+₦420K<span className="text-[9px] text-[#9ca3af] font-medium">/mo per office</span></div>
            </div>
          </div>

          <p className="text-[11px] text-[#9ca3af] text-center mt-4">
            Already have an invite? <a href="/auth" className="text-[#f05f4b] font-semibold">Join your office</a>
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* THE MATH — white cards on cream                              */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <Reveal>
            <p className="text-[11px] font-bold text-[#f05f4b] uppercase tracking-[0.1em] text-center mb-2">The lunch math</p>
            <h2 className="font-display font-[800] text-[26px] text-[#1a1a1a] tracking-[-0.03em] text-center leading-tight mb-8">
              How much is your office<br />spending on lunch?
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-white rounded-2xl p-6 mb-3 border border-black/[0.04]">
              <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] mb-4">Without ChopDrop</div>
              <p className="text-[13px] text-[#6b7280] mb-2">30 people × ₦2,000/day</p>
              <p className="font-display font-[800] text-[28px] text-[#1a1a1a] tracking-[-0.02em]">= ₦1,200,000<span className="text-[14px] font-medium text-[#9ca3af]">/mo</span></p>
              <p className="text-[11px] text-[#9ca3af] mt-2">Each person orders alone. Full price. + delivery fees.</p>
            </div>
          </Reveal>

          <Reveal delay={150}><div className="text-center text-[13px] font-bold text-[#d1d5db] my-2">vs</div></Reveal>

          <Reveal delay={200}>
            <div className="bg-white rounded-2xl p-6 border-2 border-[#22c55e]/25 mb-4 relative">
              <div className="absolute -top-3 left-5 bg-[#22c55e] text-white text-[9px] font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
              <div className="text-[9px] font-bold text-[#22c55e] uppercase tracking-[0.1em] mb-4 mt-1">With ChopDrop</div>
              <p className="text-[13px] text-[#6b7280] mb-2">30 people × ₦1,300/day</p>
              <p className="font-display font-[800] text-[28px] text-[#0f4030] tracking-[-0.02em]">= ₦780,000<span className="text-[14px] font-medium text-[#9ca3af]">/mo</span></p>
              <p className="text-[11px] text-[#6b7280] mt-2">Everyone orders together. Pool discount. ₦0 delivery.</p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="rounded-2xl p-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f05f4b 0%, #f5c565 100%)" }}>
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-white/10" />
              <div className="relative">
                <div className="text-[9px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2">Your office saves</div>
                <div className="font-display font-[800] text-[44px] text-white tracking-[-0.03em] leading-none">₦420,000</div>
                <div className="text-[12px] text-white/80 mt-1 mb-3">per month</div>
                <div className="inline-block bg-white/20 rounded-full px-4 py-1.5">
                  <span className="text-[12px] text-white font-semibold">₦14,000 back in each person&apos;s pocket</span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS — warm tan bg, product mockups                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="py-12 px-5" style={{ background: "#f0ebe2" }}>
          <Reveal>
            <p className="text-[11px] font-bold text-[#f05f4b] uppercase tracking-[0.1em] mb-2">How it works</p>
            <h2 className="font-display font-[800] text-[26px] text-[#1a1a1a] tracking-[-0.03em] leading-tight mb-10">
              Three steps.<br />Two minutes.
            </h2>
          </Reveal>

          {/* Step 1 */}
          <Reveal delay={100}>
            <div className="mb-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#f05f4b] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0 shadow-[0_4px_12px_rgba(240,95,75,0.25)]">1</div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1a1a1a]">You set up your office</h3>
                  <p className="text-[11px] text-[#9ca3af]">Takes 2 minutes</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-black/[0.05] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  <span className="text-[10px] font-bold text-[#22c55e]">Office created</span>
                </div>
                <div className="text-[15px] font-bold text-[#1a1a1a] mb-0.5">Sterling Bank HQ</div>
                <div className="text-[11px] text-[#9ca3af] mb-3">20 Marina St, Lagos Island</div>
                <div className="bg-[#f0fdf4] rounded-xl px-3.5 py-2.5 text-[10px] text-[#0f4030] font-medium">
                  🔗 chopdrop-app.vercel.app/join/sterling-hq
                </div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-3 leading-relaxed">Enter your company name and share the invite link to your office WhatsApp group.</p>
            </div>
          </Reveal>

          {/* Step 2 */}
          <Reveal delay={150}>
            <div className="mb-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#f5c565] text-[#5a3e00] flex items-center justify-center text-[15px] font-bold flex-shrink-0 shadow-[0_4px_12px_rgba(245,197,101,0.25)]">2</div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1a1a1a]">Colleagues pick their meal</h3>
                  <p className="text-[11px] text-[#9ca3af]">60 seconds each</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-black/[0.05] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex h-[90px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FOOD_JOLLOF} alt="" className="w-1/2 object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FOOD_RICE} alt="" className="w-1/2 object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-[#1a1a1a]">Mama Tola&apos;s Kitchen</span>
                    <span className="text-[8px] font-bold text-white bg-[#22c55e] px-2.5 py-1 rounded-full">POOL: 20% OFF</span>
                  </div>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between"><span className="text-[#6b7280]">Base: Jollof Rice</span><span className="font-semibold">₦400</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Protein: Chicken</span><span className="font-semibold">₦480</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Side: Plantain</span><span className="font-semibold">₦240</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Drink: Zobo</span><span className="font-semibold">₦240</span></div>
                    <div className="h-px bg-black/[0.06]" />
                    <div className="flex justify-between font-bold text-[14px]"><span className="text-[#0f4030]">Total</span><span>₦1,360</span></div>
                    <p className="text-[10px] text-[#f05f4b] font-bold">You save ₦340 (20%)</p>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-3 leading-relaxed">Everyone picks their own meal. The more people order, the cheaper it gets — up to 40% off.</p>
            </div>
          </Reveal>

          {/* Step 3 */}
          <Reveal delay={200}>
            <div className="mb-8">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#0f4030] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0 shadow-[0_4px_12px_rgba(15,64,48,0.25)]">3</div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1a1a1a]">Food arrives at reception</h3>
                  <p className="text-[11px] text-[#9ca3af]">By 1:00 PM</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-black/[0.05] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3.5 mb-3.5 pb-3.5 border-b border-black/[0.04]">
                  <div className="w-10 h-10 rounded-xl bg-[#f5c565]/15 flex items-center justify-center text-[20px]">📦</div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-[#1a1a1a]">TUNDE</div>
                    <div className="text-[10px] text-[#9ca3af]">Jollof + Chicken · Extra meat · Zobo</div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#f05f4b]/10 flex items-center justify-center text-[20px]">📦</div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-[#1a1a1a]">BLESSING</div>
                    <div className="text-[10px] text-[#9ca3af]">Fried Rice + Turkey · Plantain</div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-3 leading-relaxed">One batch delivery. Everyone&apos;s bag has their name on it. Pick up and eat.</p>
            </div>
          </Reveal>

          <Reveal delay={250}>
            <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-4 rounded-full shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-[0.97] transition-transform">
              Set Up My Office
            </a>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* CAPTAIN BENEFITS — DARK SECTION (PiggyVest pattern-break)    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: "#0f4030" }}>
          <Reveal>
            <p className="text-[11px] font-bold text-[#6ee7b7] uppercase tracking-[0.1em] mb-2">Pool Captain perks</p>
            <h2 className="font-display font-[800] text-[26px] text-white tracking-[-0.03em] leading-tight mb-2">
              Wait — what do I get<br />out of this?
            </h2>
            <p className="text-[13px] text-white/50 mb-8">You become your office&apos;s Pool Captain.</p>
          </Reveal>

          <div className="space-y-3 mb-8">
            <Reveal delay={100}>
              <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#f05f4b]/20 flex items-center justify-center text-[22px]">🍽️</div>
                  <div className="text-[10px] font-bold text-[#f05f4b] uppercase tracking-[0.08em]">Free lunch</div>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">When 15+ colleagues order, your lunch is on us. Every day.</p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#f5c565]/20 flex items-center justify-center text-[22px]">💰</div>
                  <div className="text-[10px] font-bold text-[#f5c565] uppercase tracking-[0.08em]">Monthly bonus</div>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">₦500 per pool with 20+ orders. That&apos;s up to ₦10,000/month cash.</p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#6ee7b7]/20 flex items-center justify-center text-[22px]">👑</div>
                  <div className="text-[10px] font-bold text-[#6ee7b7] uppercase tracking-[0.08em]">Office hero</div>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">You&apos;re the person who saves everyone money. They&apos;ll thank you every single day.</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={400}>
            <div className="text-center mb-6">
              <p className="text-[13px] text-white/50">Your total effort?</p>
              <p className="text-[15px] text-white font-bold mt-1">Send one WhatsApp message each morning.</p>
              <p className="text-[11px] text-white/40 mt-1">The app does the rest.</p>
            </div>
            <a href="/start" className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[15px] py-4 rounded-full shadow-[0_4px_20px_rgba(240,95,75,0.4)] active:scale-[0.97] transition-transform">
              Set Up My Office
            </a>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SOCIAL PROOF — mint bg (PiggyVest testimonial section)       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: "#f0faf5" }}>
          <Reveal>
            <h2 className="font-display font-[800] text-[26px] text-[#1a1a1a] tracking-[-0.03em] text-center leading-tight mb-8">
              Join offices already<br />saving with ChopDrop
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-white rounded-2xl p-5 mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <p className="text-[14px] text-[#1a1a1a] italic leading-relaxed mb-4">&ldquo;I used to spend 30 minutes every day collecting lunch orders on WhatsApp. Now I just tap &apos;Send Reminder&apos; and eat free.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f05f4b] to-[#f5c565] flex items-center justify-center text-white text-[12px] font-bold">AO</div>
                <div>
                  <div className="text-[13px] font-bold text-[#1a1a1a]">Pool Captain</div>
                  <div className="text-[10px] text-[#9ca3af]">Office in Ikeja · 28 colleagues</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="bg-white rounded-2xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <p className="text-[14px] text-[#1a1a1a] italic leading-relaxed mb-4">&ldquo;Our team of 35 saves over ₦400K per month. Setup took 2 minutes. Best decision I made this quarter.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f4030] to-[#22c55e] flex items-center justify-center text-white text-[12px] font-bold">CE</div>
                <div>
                  <div className="text-[13px] font-bold text-[#1a1a1a]">Office Manager</div>
                  <div className="text-[10px] text-[#9ca3af]">Office in Lagos Island · 35 colleagues</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white rounded-xl p-3.5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="font-display font-[800] text-[24px] text-[#0f4030]">20+</div>
                <div className="text-[9px] text-[#9ca3af] font-medium mt-0.5">pilot offices</div>
              </div>
              <div className="bg-white rounded-xl p-3.5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="font-display font-[800] text-[24px] text-[#f05f4b]">₦0</div>
                <div className="text-[9px] text-[#9ca3af] font-medium mt-0.5">delivery fee</div>
              </div>
              <div className="bg-white rounded-xl p-3.5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="font-display font-[800] text-[24px] text-[#f5c565]">40%</div>
                <div className="text-[9px] text-[#9ca3af] font-medium mt-0.5">max savings</div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* FAQ — clean white bg, breathing room                         */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <Reveal>
            <p className="text-[11px] font-bold text-[#f05f4b] uppercase tracking-[0.1em] mb-2">FAQ</p>
            <h2 className="font-display font-[800] text-[22px] text-[#1a1a1a] tracking-[-0.03em] mb-6">Common questions</h2>
          </Reveal>

          {[
            { q: "Is it really free?", a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for the guaranteed orders. You and your colleagues pay the discounted food price only." },
            { q: "What if only 3 people order?", a: "You still get your food — just at the regular price. The discount kicks in when 5+ people order from the same vendor. Most offices hit 10+ within the first week." },
            { q: "What vendors are available?", a: "We partner with vetted local food vendors near your office. If your office has a favorite vendor, we'll onboard them." },
            { q: "What if I don't want to be captain forever?", a: "Transfer the role to any colleague in one tap. But most captains stay — free lunch every day is a strong incentive." },
            { q: "How does payment work?", a: "Everyone pays for their own plate through the app (card or bank transfer via Paystack). No collecting cash. No chasing people." },
            { q: "Can people customize their food?", a: "Yes — everyone picks their own meal. Exactly what you want, not a fixed combo." },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 40}>
              <div className="border-b border-black/[0.06] last:border-0">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="text-[14px] font-semibold text-[#1a1a1a] pr-4">{item.q}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className={`flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-[13px] text-[#6b7280] leading-relaxed pb-4">{item.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* FINAL CTA — coral gradient moment                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden py-14 px-5 text-center" style={{ background: "linear-gradient(135deg, #f05f4b 0%, #f5c565 100%)" }}>
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-white/10" />
          <Reveal>
            <h2 className="font-display font-[800] text-[26px] text-white tracking-[-0.03em] leading-tight mb-6 relative">
              Ready to save your<br />office ₦400K+ per month?
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <a href="/start" className="block w-full bg-white text-[#f05f4b] text-center font-bold text-[16px] py-4 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.97] transition-transform mb-4 relative">
              Set Up My Office
              <span className="block text-[11px] font-medium text-[#f05f4b]/60 mt-0.5">Free · Takes 2 minutes</span>
            </a>
          </Reveal>
          <Reveal delay={250}>
            <p className="text-[13px] text-white/80 relative">
              Or <a href={WA_LINK} className="text-white font-bold underline">WhatsApp us</a> — we&apos;ll set it up with you live
            </p>
          </Reveal>
        </section>

        {/* Footer */}
        <section className="px-5 py-8 text-center">
          <Logo size={24} />
          <p className="text-[12px] text-[#9ca3af] mt-2">Cheaper lunch. Zero stress.</p>
          <p className="text-[10px] text-[#9ca3af] mt-4">© 2026 Arete Ltd (trading as ChopDrop)</p>
          <p className="text-[10px] text-[#9ca3af]">Lagos, Nigeria · @chopdrop.ng</p>
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
