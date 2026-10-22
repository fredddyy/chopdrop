"use client";

import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/logo";

const WA = "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";

/* ── Imagery ── */
const HERO = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=1400&q=90&fit=crop";
const F1 = "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=600&q=80&fit=crop";
const F2 = "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=600&q=80&fit=crop";
const F3 = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&fit=crop";
const F4 = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop";
const F5 = "https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80&fit=crop";
const F6 = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&fit=crop";

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
  const [n, setN] = useState(20);
  const price = n >= 25 ? 1200 : n >= 15 ? 1400 : n >= 10 ? 1600 : n >= 5 ? 1800 : 2000;
  const saved = (2000 - price) * n * 20;
  const pct = Math.round(((2000 - price) / 2000) * 100);

  return (
    <div className="bg-[var(--dark)] rounded-[20px] p-6 lg:p-8 text-white">
      <label htmlFor="calc" className="block text-[18px] font-medium mb-5">
        How many people in your office?
      </label>
      <input id="calc" type="range" min={3} max={50} value={n}
        aria-label={`${n} people`} onChange={(e) => setN(+e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none mb-8 cursor-pointer"
        style={{ accentColor: "var(--coral)", background: "rgba(255,255,255,0.15)" }} />
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[14px] text-white/50">{n} people</div>
          <div className="text-[20px] font-bold tabular-nums mt-1">₦{price.toLocaleString()}<span className="text-[14px] font-normal text-white/50">/plate</span></div>
        </div>
        <div className="text-right">
          <div className="text-[14px] text-[var(--emerald)] font-semibold">{pct}% cheaper</div>
          <div className="text-[36px] lg:text-[48px] font-extrabold text-[var(--emerald)] leading-none tabular-nums mt-1">
            ₦{saved.toLocaleString()}
          </div>
          <div className="text-[13px] text-white/40 mt-1">saved per month</div>
        </div>
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
          <a href="/auth" className="text-[14px] font-medium text-[var(--text-secondary)]">Log in</a>
          <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[15px] h-11 px-7 inline-flex items-center rounded-full active:scale-[0.97] transition-transform">
            Set Up My Office
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  HERO                                               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-32 pb-12 lg:pb-20">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 mb-10 lg:mb-0" style={{ animation: "fu .6s ease" }}>
              <div className="inline-flex items-center gap-2 bg-[var(--emerald)]/10 text-[var(--emerald)] text-[13px] font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)]" />
                Now in 20+ Lagos offices
              </div>
              <h1 className="text-[clamp(36px,7vw,64px)] font-extrabold text-[var(--text)] leading-[1.0] tracking-[-0.03em] mb-5">
                Office lunch,<br />
                <span className="text-[var(--coral)]">40% cheaper.</span>
              </h1>
              <p className="text-[18px] lg:text-[20px] text-[var(--text-secondary)] leading-[1.55] max-w-[440px] mb-8">
                Pool your office orders from local vendors. More people = cheaper plates for everyone. ₦0 delivery.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[16px] h-[52px] px-8 inline-flex items-center rounded-full active:scale-[0.97] transition-all hover:bg-[var(--coral-dark)] hover:scale-[1.02]">
                  Set Up My Office
                </a>
                <a href="/menu" className="text-[var(--text)] font-semibold text-[16px] h-[52px] px-6 inline-flex items-center gap-2 hover:text-[var(--coral)] transition-colors">
                  Browse Menu
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                </a>
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7" style={{ animation: "fu .6s ease .1s both" }}>
              <div className="rounded-[24px] overflow-hidden relative aspect-[4/3] lg:aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HERO} alt="Nigerian egusi soup with eba — a popular office lunch" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white text-[var(--text)] text-[13px] font-bold px-4 py-2 rounded-full">
                  19 ordering now
                </div>
                <div className="absolute bottom-4 right-4 bg-[var(--emerald)] text-white text-[13px] font-bold px-4 py-2 rounded-full">
                  ₦0 delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  METRICS STRIP                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 lg:py-14" style={{ background: "var(--sand)" }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16 text-center">
              {[
                { n: "20+", l: "offices piloting" },
                { n: "₦0", l: "delivery fee" },
                { n: "40%", l: "max savings" },
                { n: "2 min", l: "to set up" },
              ].map((m) => (
                <div key={m.l}>
                  <div className="text-[32px] lg:text-[40px] font-extrabold text-[var(--text)] tabular-nums leading-none">{m.n}</div>
                  <div className="text-[14px] text-[var(--text-secondary)] mt-1">{m.l}</div>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  THE MATH                                           */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(28px,4.5vw,44px)] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-12">The lunch math</h2></R>

          <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0 mb-8">
            <R d={60}>
              <div className="bg-white rounded-[20px] p-6 lg:p-7" style={{ border: "1px solid var(--border)" }}>
                <div className="text-[14px] font-semibold text-[var(--text-secondary)] mb-3">Without ChopDrop</div>
                <div className="text-[15px] text-[var(--text-secondary)] mb-1">30 people × ₦2,000/day</div>
                <div className="text-[32px] font-extrabold text-[var(--text)] tabular-nums leading-tight">₦1.2M<span className="text-[15px] font-medium text-[var(--text-muted)]">/mo</span></div>
              </div>
            </R>
            <R d={120}>
              <div className="bg-white rounded-[20px] p-6 lg:p-7" style={{ border: "2px solid var(--coral)" }}>
                <div className="text-[14px] font-semibold text-[var(--coral)] mb-3">With ChopDrop</div>
                <div className="text-[15px] text-[var(--text-secondary)] mb-1">30 people × ₦1,300/day</div>
                <div className="text-[32px] font-extrabold text-[var(--emerald)] tabular-nums leading-tight">₦780K<span className="text-[15px] font-medium text-[var(--text-muted)]">/mo</span></div>
              </div>
            </R>
            <R d={180}>
              <div className="bg-[var(--coral)] rounded-[20px] p-6 lg:p-7 text-white">
                <div className="text-[14px] font-semibold text-white/60 mb-3">You save</div>
                <div className="text-[40px] lg:text-[48px] font-extrabold tabular-nums leading-tight">₦420K</div>
                <div className="text-[15px] text-white/70 mt-1">per month — ₦14,000 each pocket</div>
              </div>
            </R>
          </div>

          <R d={240}><Calc /></R>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  HOW IT WORKS — photo cards                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ background: "var(--sand)" }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(28px,4.5vw,44px)] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-12">Three steps, two minutes</h2></R>

          <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
            {[
              { img: F3, t: "Set up your office", d: "Enter your company name, share the invite link on your office WhatsApp. Done." },
              { img: F1, t: "Everyone picks their plate", d: "Each person chooses base, protein, side and drink. More people ordering = cheaper price." },
              { img: F2, t: "Food arrives at 1 PM", d: "One batch delivery to reception. Everyone's bag has their name. Pick up and eat." },
            ].map((s, i) => (
              <R key={i} d={i * 80}>
                <div className="bg-white rounded-[20px] overflow-hidden group cursor-default" style={{ border: "1px solid var(--border)" }}>
                  <div className="h-[200px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt={s.t} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-[20px] font-bold text-[var(--text)] mb-2">{s.t}</h3>
                    <p className="text-[16px] text-[var(--text-secondary)] leading-[1.5]">{s.d}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  CAPTAIN PERKS — dark section                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ background: "var(--dark)" }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R>
            <h2 className="text-[clamp(28px,4.5vw,44px)] font-extrabold text-white tracking-[-0.02em] mb-3">What&apos;s in it for you?</h2>
            <p className="text-[18px] text-white/50 mb-12 max-w-[460px]">You become the Pool Captain. Your office eats cheaper, and you get rewarded.</p>
          </R>

          <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0">
            <R d={80}>
              <div className="rounded-[20px] p-6 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5" style={{ background: "var(--coral)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-2">Free lunch, every day</h3>
                <p className="text-[16px] text-white/60 leading-[1.5]">15+ colleagues order? Your meal is on us.</p>
              </div>
            </R>
            <R d={160}>
              <div className="rounded-[20px] p-6 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5" style={{ background: "var(--gold)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-2">Up to ₦10K/month cash</h3>
                <p className="text-[16px] text-white/60 leading-[1.5]">₦500 per pool with 20+ orders. Real money, your account.</p>
              </div>
            </R>
            <R d={240}>
              <div className="rounded-[20px] p-6 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5" style={{ background: "var(--emerald)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-2">The office hero</h3>
                <p className="text-[16px] text-white/60 leading-[1.5]">Your effort: one WhatsApp message. The app does the rest.</p>
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  FOOD GALLERY — scroll strip                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-6 overflow-hidden" aria-label="Food gallery">
        <div className="flex gap-3 px-5 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
          {[
            { s: F5, a: "Grilled suya" }, { s: F1, a: "Jollof rice" }, { s: F6, a: "Fresh bowl" },
            { s: F4, a: "Rice and vegetables" }, { s: F2, a: "White rice" }, { s: F3, a: "Lunch spread" },
          ].map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.s} alt={img.a} className="h-[120px] lg:h-[180px] w-auto rounded-[16px] object-cover shrink-0 snap-start" loading="lazy" />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  SOCIAL PROOF                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(28px,4.5vw,44px)] font-extrabold text-[var(--text)] tracking-[-0.02em] text-center mb-12">Offices already saving</h2></R>
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {[
              { q: "I used to spend 30 minutes collecting lunch orders on WhatsApp. Now I tap one button and eat free.", who: "Pool Captain", where: "Ikeja, 28 colleagues", init: "AO", bg: "var(--coral)" },
              { q: "Our team of 35 saves over ₦400K per month. Setup took 2 minutes. Best decision this quarter.", who: "Office Manager", where: "Lagos Island, 35 colleagues", init: "CE", bg: "var(--emerald)" },
            ].map((t, i) => (
              <R key={i} d={i * 80}>
                <div className="bg-white rounded-[20px] p-6 lg:p-8" style={{ border: "1px solid var(--border)" }}>
                  <p className="text-[18px] text-[var(--text)] leading-[1.6] mb-6">&ldquo;{t.q}&rdquo;</p>
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  FAQ                                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ background: "var(--sand)" }}>
        <div className="max-w-[720px] mx-auto px-5 lg:px-8">
          <R><h2 className="text-[clamp(28px,4vw,40px)] font-extrabold text-[var(--text)] tracking-[-0.02em] mb-10">Questions</h2></R>
          {[
            { q: "Is it really free?", a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for guaranteed orders." },
            { q: "What if only 3 people order?", a: "You still get your food at the regular price. Discounts kick in at 5+. Most offices hit 10+ in the first week." },
            { q: "What vendors are available?", a: "Vetted local vendors near your office. Have a favourite? We'll onboard them." },
            { q: "Can I stop being captain?", a: "Transfer the role in one tap. But most captains stay — free lunch is hard to give up." },
            { q: "How does payment work?", a: "Everyone pays via card or bank transfer through Paystack. No collecting cash." },
            { q: "Can people customise?", a: "Yes. Base, protein, side, drink — everyone picks exactly what they want." },
          ].map((item, i) => (
            <R key={i} d={i * 30}>
              <div className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                <button type="button" onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                  className="w-full flex items-center justify-between py-5 text-left cursor-pointer group">
                  <span className="text-[17px] font-semibold text-[var(--text)] pr-4 group-hover:text-[var(--coral)] transition-colors">{item.q}</span>
                  <div className={`w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 transition-transform duration-200 ${faq === i ? "rotate-180" : ""}`} style={{ border: "1px solid var(--border)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${faq === i ? "max-h-40 opacity-100 pb-5" : "max-h-0 opacity-0"}`}>
                  <p className="text-[16px] text-[var(--text-secondary)] leading-[1.6]">{item.a}</p>
                </div>
              </div>
            </R>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  FINAL CTA                                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-32 text-center" style={{ background: "var(--dark)" }}>
        <div className="max-w-[640px] mx-auto px-5 lg:px-8">
          <R>
            <h2 className="text-[clamp(32px,6vw,56px)] font-extrabold text-white tracking-[-0.03em] leading-[1.0] mb-6">
              Save your office<br />₦400K+ per month
            </h2>
          </R>
          <R d={80}>
            <a href="/start" className="bg-[var(--coral)] text-white font-bold text-[18px] h-[56px] px-10 inline-flex items-center rounded-full active:scale-[0.97] transition-all hover:scale-[1.03] mb-3">
              Set Up My Office
            </a>
            <p className="text-[14px] text-white/30 mb-6">Free. 2 minutes. No card required.</p>
          </R>
          <R d={160}>
            <p className="text-[16px] text-white/50">
              Or <a href={WA} className="text-white font-semibold underline underline-offset-2 hover:text-[var(--coral)] transition-colors">WhatsApp us</a> and we set it up with you
            </p>
          </R>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12" style={{ background: "var(--bg)" }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
          <div className="flex flex-col items-center lg:items-start gap-2">
            <Logo size={22} />
            <p className="text-[14px] text-[var(--text-muted)]">Cheaper lunch. Zero stress.</p>
          </div>
          <div className="flex gap-8 text-[14px] text-[var(--text-secondary)]">
            <a href="/menu" className="hover:text-[var(--text)] transition-colors">Menu</a>
            <a href="/start" className="hover:text-[var(--text)] transition-colors">Start</a>
            <a href="/about" className="hover:text-[var(--text)] transition-colors">About</a>
            <a href={WA} className="hover:text-[var(--text)] transition-colors">WhatsApp</a>
          </div>
          <div className="text-[13px] text-[var(--text-muted)] text-center lg:text-right">
            <div>&copy; 2026 Arete Ltd (trading as ChopDrop)</div>
            <div>Lagos, Nigeria</div>
          </div>
        </div>
      </footer>

      <div className="h-16 lg:hidden" />

{/* animations moved to globals.css */}
    </div>
  );
}
