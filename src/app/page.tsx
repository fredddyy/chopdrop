"use client";

import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/logo";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const WA = "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";

const HERO = "/hero-jollof.jpg";
const FOOD_JOLLOF = "/hero-jollof.jpg";
const FOOD_CHICKEN = "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80&fit=crop";
const FOOD_RICE = "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop";
const FOOD_SOUP = "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop";
const FOOD_WRAP = "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80&fit=crop";
const FOOD_BOWL = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop";

/* ── Scroll reveal ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); ob.disconnect(); } }, { threshold: 0.08 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, v };
}

function R({ children, d = 0, c = "" }: { children: React.ReactNode; d?: number; c?: string }) {
  const { ref, v } = useReveal();
  return <div ref={ref} className={c} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(20px)", transition: `opacity 0.5s ease ${d}ms, transform 0.5s ease ${d}ms` }}>{children}</div>;
}

/* ── Pool calculator ── */
function Calc() {
  const [n, setN] = useState(15);
  const price = n >= 25 ? 1200 : n >= 15 ? 1400 : n >= 10 ? 1600 : n >= 5 ? 1800 : 2000;
  const saved = (2000 - price) * n * 20;
  const pct = Math.round(((2000 - price) / 2000) * 100);
  const tier = n >= 25 ? 3 : n >= 15 ? 2 : n >= 10 ? 1 : n >= 5 ? 0 : -1;

  return (
    <div className="rounded-[24px] p-6 lg:p-10" style={{ background: "var(--dark)" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[15px] text-white/40 mb-1">People in your office</div>
          <div className="text-[56px] lg:text-[72px] font-extrabold text-white leading-none tabular-nums">{n}</div>
        </div>
        <div className="text-right">
          <div className="text-[15px] text-white/40 mb-1">Price per plate</div>
          <div className="text-[36px] lg:text-[48px] font-extrabold leading-none tabular-nums" style={{ color: pct > 0 ? "var(--emerald)" : "white" }}>
            ₦{price.toLocaleString()}
          </div>
          {pct > 0 && <div className="text-[14px] font-semibold text-[var(--emerald)] mt-1">{pct}% cheaper</div>}
        </div>
      </div>

      <input type="range" min={3} max={50} value={n}
        aria-label={`${n} people`} onChange={(e) => setN(+e.target.value)}
        className="w-full h-2 rounded-full appearance-none mb-8 cursor-pointer"
        style={{ accentColor: "var(--coral)", background: "rgba(255,255,255,0.12)" }} />

      {/* Tier indicators */}
      <div className="flex gap-2 mb-8">
        {[
          { label: "1-4", pct: "Base", idx: -1 },
          { label: "5+", pct: "10% off", idx: 0 },
          { label: "10+", pct: "20% off", idx: 1 },
          { label: "15+", pct: "30% off", idx: 2 },
          { label: "25+", pct: "40% off", idx: 3 },
        ].map((t) => (
          <div key={t.label} className="flex-1 text-center rounded-[12px] py-3 transition-all duration-300" style={{
            background: tier >= t.idx && t.idx >= 0 ? "rgba(13,159,95,0.15)" : "rgba(255,255,255,0.05)",
            border: tier === t.idx ? "1px solid var(--emerald)" : "1px solid rgba(255,255,255,0.06)",
          }}>
            <div className="text-[13px] font-bold" style={{ color: tier >= t.idx && t.idx >= 0 ? "var(--emerald)" : "white" }}>{t.pct}</div>
            <div className="text-[11px] text-white/30 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Savings result */}
      {saved > 0 && (
        <div className="rounded-[16px] p-5 flex items-center justify-between" style={{ background: "rgba(13,159,95,0.1)", border: "1px solid rgba(13,159,95,0.15)" }}>
          <div>
            <div className="text-[14px] text-[var(--emerald)] font-medium">Your office saves monthly</div>
            <div className="text-[13px] text-white/30 mt-0.5">₦0 delivery included</div>
          </div>
          <div className="text-[40px] lg:text-[52px] font-extrabold text-[var(--emerald)] leading-none tabular-nums">
            ₦{saved.toLocaleString()}
          </div>
        </div>
      )}

      {/* Pool guarantee callout */}
      <div className="mt-6 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(13,159,95,0.15)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        </div>
        <p className="text-[14px] text-white/50 leading-relaxed">If more people join after you order and the price drops, you get the difference back as credit. You never overpay.</p>
      </div>
    </div>
  );
}

/* ══════════════ PAGE ══════════════ */
export default function Home() {
  const [faq, setFaq] = useState<number | null>(null);
  const [nav, setNav] = useState(false);
  useEffect(() => {
    const h = () => setNav(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ── Nav ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${nav ? "bg-white/90 backdrop-blur-lg" : ""}`} style={nav ? { borderBottom: "1px solid var(--border)" } : {}}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-5 lg:px-8 h-14">
          <Logo size={22} />
          <div className="flex items-center gap-5">
            <a href="/auth" className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors hidden sm:block">Log in</a>
            <a href="/start" className="bg-[var(--coral)] text-white font-semibold text-[13px] h-9 px-5 inline-flex items-center rounded-full active:scale-[0.97] transition-transform hover:bg-[var(--coral-dark)]">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 backdrop-blur-lg" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 h-16">
          <div>
            <div className="text-[12px] text-[var(--text-muted)]">From</div>
            <div className="text-[16px] font-bold text-[var(--emerald)]">₦1,400/plate</div>
          </div>
          <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[15px] h-11 px-7 inline-flex items-center rounded-full active:scale-[0.97] transition-transform">
            Set Up My Office
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  1. HERO — Pain hook + food + trust + one CTA      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-32 pb-6 lg:pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-center">
            <div className="lg:col-span-6 mb-10 lg:mb-0" style={{ animation: "fu .6s ease" }}>
              {/* Pain hook — not a feature statement */}
              <p className="text-[16px] text-[var(--text-muted)] mb-4">₦800 delivery. ₦5,000+ for lunch. Every single day.</p>
              <h1 className="text-[clamp(34px,7vw,60px)] font-extrabold text-[var(--text)] leading-[1.0] tracking-[-0.03em] mb-5">
                What if your<br />whole office<br />
                <span className="text-[var(--coral)]">ordered together?</span>
              </h1>
              <p className="text-[18px] text-[var(--text-secondary)] leading-[1.55] max-w-[420px] mb-6">
                Pool orders from local vendors. More people = cheaper plates. ₦0 delivery. Breakfast by 9AM. Lunch by noon.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[16px] h-[52px] px-8 inline-flex items-center rounded-full active:scale-[0.97] transition-all hover:bg-[var(--coral-dark)] hover:scale-[1.02]">
                  Set Up My Office — Free
                </a>
                <a href="/menu" className="text-[var(--text)] font-semibold text-[15px] h-[52px] px-5 inline-flex items-center gap-1.5 hover:text-[var(--coral)] transition-colors">
                  Browse Menu
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                </a>
              </div>

              {/* Inline social proof — above the fold */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex -space-x-2">
                  {["AO", "TM", "KA", "BE", "CU"].map((init, i) => (
                    <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[var(--bg)]"
                      style={{ background: ["var(--coral)", "var(--gold)", "var(--emerald)", "#3B82F6", "#9333EA"][i] }}>{init}</div>
                  ))}
                </div>
                <div className="text-[13px] text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text)]">20+ offices</span> · 3,000+ meals · <span className="text-[var(--emerald)] font-semibold">₦2M+ saved</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6" style={{ animation: "fu .6s ease .1s both" }}>
              <div className="rounded-[24px] overflow-hidden relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HERO} alt="Nigerian jollof rice — the lunch everyone orders" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex gap-2 mb-2">
                    <div className="bg-[var(--emerald)] text-white text-[12px] font-bold px-3 py-1.5 rounded-full">₦0 delivery</div>
                    <div className="bg-white text-[var(--text)] text-[12px] font-bold px-3 py-1.5 rounded-full">30% off</div>
                  </div>
                  <div className="text-white text-[20px] font-extrabold leading-tight">Jollof Rice & Chicken</div>
                  <div className="text-white/70 text-[13px] mt-0.5">The Place · Admiralty Way</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  2. HOW IT WORKS — tight, visual, 3 steps           */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R>
            <div className="text-center mb-12">
              <h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-3">Two minutes to set up. Zero effort after.</h2>
              <p className="text-[17px] text-[var(--text-secondary)] max-w-[480px] mx-auto">Your colleagues order on their own phones. One rider delivers everything.</p>
            </div>
          </R>

          <div className="lg:grid lg:grid-cols-3 lg:gap-0 relative">
            {/* Connector line — desktop only */}
            <div className="hidden lg:block absolute top-[52px] left-[16.6%] right-[16.6%] h-[2px]" style={{ background: "var(--border)" }} />

            {[
              { num: "1", color: "var(--coral)", t: "Share the link", d: "Enter your office name, get an invite link. Drop it in your WhatsApp group." },
              { num: "2", color: "var(--gold)", t: "Everyone picks their food", d: "Each person chooses what they want. More people = cheaper price for all." },
              { num: "3", color: "var(--emerald)", t: "Food arrives on time", d: "Breakfast before 9AM. Lunch before noon. One batch delivery. Named bags. Pick up and eat." },
            ].map((s, i) => (
              <R key={i} d={i * 100}>
                <div className="text-center px-6 py-8 relative">
                  <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[20px] font-extrabold text-white mx-auto mb-5 relative z-10" style={{ background: s.color }}>
                    {s.num}
                  </div>
                  <h3 className="text-[18px] font-bold text-[var(--text)] mb-2">{s.t}</h3>
                  <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-[280px] mx-auto">{s.d}</p>
                </div>
              </R>
            ))}
          </div>

          {/* Inline locations — not a full section */}
          <R d={200}>
            <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
              <span className="text-[13px] text-[var(--text-muted)]">Delivering to:</span>
              {["Victoria Island", "Ikoyi", "Lekki", "Ikeja GRA", "Marina", "Yaba"].map((loc) => (
                <span key={loc} className="text-[12px] font-medium text-[var(--text-secondary)] px-3 py-1 rounded-full bg-[var(--sand)]">{loc}</span>
              ))}
              <a href={WA} className="text-[12px] font-semibold text-[var(--coral)] px-3 py-1">+ more</a>
            </div>
          </R>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  3. POOL CALCULATOR — THE interactive section        */}
      {/*  Merges: pool pricing + calculator + guarantee       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[800px] mx-auto px-5 lg:px-8">
          <R>
            <h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-3">The more you order together, the less everyone pays</h2>
            <p className="text-[17px] text-[var(--text-secondary)] leading-relaxed mb-10">Slide to see your office savings. Everyone gets the final price — even if you ordered first.</p>
          </R>
          <R d={80}><Calc /></R>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  4. THREE VALUE PROPS — what makes ChopDrop different*/}
      {/*  Merges: ₦0 delivery + pre-order + pool guarantee   */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ background: "var(--sand)" }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-[var(--text)] tracking-[-0.02em] text-center mb-12">Why 20+ offices switched</h2></R>

          <div className="lg:grid lg:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0">
            {[
              {
                color: "var(--emerald)", icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
                  </svg>
                ),
                stat: "₦0", statLabel: "delivery fee",
                t: "One rider. Everyone's food.",
                d: "When your office orders together, one rider picks everything up. One trip. No individual delivery fees.",
              },
              {
                color: "var(--coral)", icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                stat: "2", statLabel: "daily pools",
                t: "Breakfast by 9AM. Lunch by noon.",
                d: "Breakfast orders: 6–8AM, arrives before 9. Lunch orders: 9–10:30AM, arrives before 12. Order in the window, food shows up on time.",
              },
              {
                color: "var(--gold)", icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                stat: "Auto", statLabel: "refund",
                t: "You never overpay.",
                d: "If the price drops after you order because more people joined, you get the difference back as credit. Automatically.",
              },
            ].map((v, i) => (
              <R key={i} d={i * 80}>
                <div className="bg-white rounded-[20px] p-6 lg:p-8 h-full" style={{ border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: v.color }}>
                      {v.icon}
                    </div>
                    <div>
                      <span className="text-[28px] font-extrabold leading-none" style={{ color: v.color }}>{v.stat}</span>
                      <span className="text-[13px] text-[var(--text-muted)] ml-1.5">{v.statLabel}</span>
                    </div>
                  </div>
                  <h3 className="text-[19px] font-bold text-[var(--text)] mb-2 leading-snug">{v.t}</h3>
                  <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{v.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  5. FOOD GALLERY — desire machine                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-12 overflow-hidden" aria-label="Popular meals">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 mb-8">
          <R>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-[clamp(22px,3.5vw,32px)] font-extrabold text-[var(--text)]">Popular with Lagos offices</h3>
                <p className="text-[15px] text-[var(--text-muted)] mt-1">Real vendors. Real prices. Pool pricing applied.</p>
              </div>
              <a href="/menu" className="hidden sm:inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--coral)] hover:text-[var(--coral-dark)] transition-colors">
                See full menu
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              </a>
            </div>
          </R>
        </div>
        <div className="flex gap-4 px-5 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2">
          {[
            { img: FOOD_JOLLOF, name: "Jollof Rice & Chicken", vendor: "The Place", orig: "₦4,800", pool: "₦3,360", save: "30%" },
            { img: FOOD_CHICKEN, name: "Grilled Chicken", vendor: "Kilimanjaro", orig: "₦3,500", pool: "₦2,450", save: "30%" },
            { img: FOOD_RICE, name: "Fried Rice Special", vendor: "Mama Tola's", orig: "₦3,200", pool: "₦2,240", save: "30%" },
            { img: FOOD_SOUP, name: "Pepper Soup", vendor: "The Place", orig: "₦4,500", pool: "₦3,150", save: "30%" },
            { img: FOOD_WRAP, name: "Chicken Shawarma", vendor: "ChickenWizz", orig: "₦3,900", pool: "₦2,730", save: "30%" },
            { img: FOOD_BOWL, name: "Veggie Power Bowl", vendor: "Green Basket", orig: "₦3,000", pool: "₦2,100", save: "30%" },
          ].map((meal, i) => (
            <div key={i} className="shrink-0 w-[240px] lg:w-[280px] snap-start rounded-[20px] overflow-hidden bg-white group" style={{ border: "1px solid var(--border)" }}>
              <div className="h-[160px] lg:h-[190px] overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meal.img} alt={meal.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-[var(--text)] px-3 py-1 rounded-full">{meal.vendor}</div>
                <div className="absolute top-3 right-3 bg-[var(--emerald)] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">-{meal.save}</div>
              </div>
              <div className="p-4">
                <div className="text-[15px] font-bold text-[var(--text)] mb-2 leading-tight">{meal.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[var(--text-muted)] line-through">{meal.orig}</span>
                  <span className="text-[17px] font-extrabold text-[var(--emerald)]">{meal.pool}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  6. TESTIMONIALS + CAPTAIN NUDGE — proof + action    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-[var(--text)] tracking-[-0.02em] text-center mb-4">Real offices. Real savings.</h2></R>
          <R d={40}><p className="text-[16px] text-[var(--text-muted)] text-center mb-12 max-w-[400px] mx-auto">The person who sets it up gets free lunch every day.</p></R>

          <div className="lg:grid lg:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0 mb-10">
            {[
              { q: "I used to spend ₦6,000 a day. Now I spend ₦3,500. Same jollof from The Place.", who: "Adaeze O.", where: "Sterling Bank, VI", init: "AO", bg: "var(--coral)" },
              { q: "Pre-ordered at 10pm, ate at 12:15 the next day. My colleague who ordered at noon? Sold out.", who: "Tunde M.", where: "GTBank, Ikeja", init: "TM", bg: "var(--gold)" },
              { q: "We save over ₦400K per month as an office. Setup took literally 2 minutes.", who: "Kemi A.", where: "First Bank, Marina", init: "KA", bg: "var(--emerald)" },
            ].map((t, i) => (
              <R key={i} d={i * 80}>
                <div className="bg-white rounded-[20px] p-6 h-full flex flex-col" style={{ border: "1px solid var(--border)" }}>
                  <p className="text-[17px] text-[var(--text)] leading-[1.6] mb-auto pb-5">&ldquo;{t.q}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold" style={{ background: t.bg }}>{t.init}</div>
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--text)]">{t.who}</div>
                      <div className="text-[13px] text-[var(--text-muted)]">{t.where}</div>
                    </div>
                  </div>
                </div>
              </R>
            ))}
          </div>

          {/* Captain nudge — subtle, not a whole section */}
          <R d={200}>
            <div className="bg-[var(--dark)] rounded-[20px] p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-8">
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[var(--gold)] mb-2 uppercase tracking-wider">Pool Captain Perks</div>
                <h3 className="text-[20px] font-bold text-white mb-2">The person who sets it up eats free.</h3>
                <p className="text-[15px] text-white/50 leading-relaxed">15+ colleagues order? Your meal is on us. Plus up to ₦10K/month cash. Your effort: one WhatsApp message.</p>
              </div>
              <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[15px] h-12 px-8 inline-flex items-center rounded-full shrink-0 active:scale-[0.97] transition-transform hover:bg-[var(--coral-dark)]">
                Become Captain
              </a>
            </div>
          </R>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  7. FAQ + FINAL CTA                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ background: "var(--sand)" }}>
        <div className="max-w-[720px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(24px,3.5vw,36px)] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-8">Questions</h2></R>
          {[
            { q: "Is it really free?", a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for guaranteed orders." },
            { q: "What if only 3 people order?", a: "You still get your food at the regular price. Discounts kick in at 5+. Most offices hit 10+ in the first week." },
            { q: "When can I order?", a: "Two daily windows. Breakfast: 6–8AM (arrives before 9). Lunch: 9–10:30AM (arrives before 12). Order during the window and your food shows up on time." },
            { q: "What vendors are available?", a: "Vetted local vendors near your office — The Place, Kilimanjaro, Mama Tola's, and more. Have a favourite? We'll onboard them." },
            { q: "How does payment work?", a: "Everyone pays via card or bank transfer through Paystack. No collecting cash. No chasing Emeka." },
          ].map((item, i) => (
            <R key={i} d={i * 30}>
              <div className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                <button type="button" onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}
                  className="w-full flex items-center justify-between py-5 text-left cursor-pointer group">
                  <span className="text-[16px] font-semibold text-[var(--text)] pr-4 group-hover:text-[var(--coral)] transition-colors">{item.q}</span>
                  <div className={`w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 transition-transform duration-200 ${faq === i ? "rotate-180" : ""}`} style={{ border: "1px solid var(--border)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${faq === i ? "max-h-40 opacity-100 pb-5" : "max-h-0 opacity-0"}`}>
                  <p className="text-[15px] text-[var(--text-secondary)] leading-[1.6]">{item.a}</p>
                </div>
              </div>
            </R>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 lg:py-28 text-center" style={{ background: "var(--dark)" }}>
        <div className="max-w-[600px] mx-auto px-5 lg:px-8">
          <R>
            <h2 className="text-[clamp(30px,5.5vw,50px)] font-extrabold text-white tracking-[-0.03em] leading-[1.05] mb-5">
              Your office could save<br />
              <span className="text-[var(--emerald)]">₦400K+ this month</span>
            </h2>
          </R>
          <R d={60}>
            <p className="text-[16px] text-white/40 mb-8">Free to set up. Two minutes. No card required.</p>
          </R>
          <R d={120}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[17px] h-[54px] px-10 inline-flex items-center rounded-full active:scale-[0.97] transition-all hover:scale-[1.03]">
                Set Up My Office
              </a>
              <a href={WA} className="text-white/60 font-medium text-[15px] h-[54px] px-6 inline-flex items-center gap-2 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp us
              </a>
            </div>
          </R>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10" style={{ background: "var(--bg)" }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
          <div className="flex flex-col items-center lg:items-start gap-1.5">
            <Logo size={20} />
            <p className="text-[13px] text-[var(--text-muted)]">Cheaper lunch. Zero stress.</p>
          </div>
          <div className="flex gap-8 text-[13px] text-[var(--text-secondary)]">
            <a href="/menu" className="hover:text-[var(--text)] transition-colors">Menu</a>
            <a href="/start" className="hover:text-[var(--text)] transition-colors">Start</a>
            <a href={WA} className="hover:text-[var(--text)] transition-colors">WhatsApp</a>
          </div>
          <div className="text-[12px] text-[var(--text-muted)] text-center lg:text-right">
            &copy; 2026 Arete Ltd (trading as ChopDrop) · Lagos, Nigeria
          </div>
        </div>
      </footer>

      <div className="h-16 lg:hidden" />
      <PwaInstallPrompt />
    </div>
  );
}
