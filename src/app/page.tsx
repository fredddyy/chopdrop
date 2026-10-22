"use client";

import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/logo";

const WA_LINK =
  "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";
const HERO_IMG =
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80&fit=crop";
const FOOD_JOLLOF =
  "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=400&q=80&fit=crop";
const FOOD_RICE =
  "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=400&q=80&fit=crop";

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          ob.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [faq, setFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Fixed top nav ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
          scrolled ? "bg-paper border-b border-line" : "bg-transparent"
        }`}
      >
        <div className="max-w-[428px] mx-auto flex items-center justify-between px-5 py-3">
          <Logo size={22} />
          <a
            href="/auth"
            className="text-[12px] font-semibold text-ink-soft hover:text-ink transition-colors"
          >
            Log in
          </a>
        </div>
      </nav>

      {/* ── Fixed bottom CTA bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-line">
        <div className="max-w-[428px] mx-auto flex items-center justify-between px-5 py-3">
          <a href="/auth" className="text-[12px] font-semibold text-ink-soft">
            Log in
          </a>
          <a
            href="/start"
            className="bg-coral text-white font-bold text-[13px] px-5 h-[44px] inline-flex items-center rounded-[12px] active:scale-[0.98] transition-transform"
          >
            Set Up My Office
          </a>
        </div>
      </div>

      <div className="max-w-[428px] mx-auto pb-24">
        {/* ═══════════════════════════════════════════════ */}
        {/* HERO                                            */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="px-5 pt-16 pb-8">
          <div style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-[11px] font-bold text-coral uppercase tracking-[0.1em] mb-3">
              For Nigerian offices
            </p>
            <h1 className="font-display font-[800] text-[32px] text-ink tracking-[-0.04em] leading-[1.08] mb-4">
              Your office lunch
              <br />
              costs too much.
              <br />
              <span className="text-coral">Fix it in 2 minutes.</span>
            </h1>
            <p className="text-[15px] text-ink-soft leading-[1.65] mb-6 max-w-[360px]">
              ChopDrop pools your office lunch orders from local vendors. More
              people ordering together = cheaper plates for everyone — up to 40%
              off.
            </p>
          </div>

          {/* CTAs */}
          <div
            className="flex gap-3 mb-8"
            style={{
              animation:
                "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both",
            }}
          >
            <a
              href="/start"
              className="flex-1 bg-coral text-white text-center font-bold text-[14px] h-[50px] inline-flex items-center justify-center rounded-[12px] active:scale-[0.98] transition-transform"
            >
              Set Up My Office
            </a>
            <a
              href="/menu"
              className="flex-1 bg-paper text-ink text-center font-bold text-[14px] h-[50px] inline-flex items-center justify-center rounded-[16px] border border-line active:scale-[0.98] transition-transform"
            >
              Browse Menu
            </a>
          </div>

          {/* Hero photo — warm border, no shadow */}
          <div
            className="rounded-[16px] overflow-hidden border border-line relative"
            style={{
              aspectRatio: "4/3",
              animation:
                "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt="Nigerian food spread"
              className="w-full h-full object-cover"
            />
            {/* Floating stats — solid backgrounds, NO blur */}
            <div className="absolute top-3 left-3 bg-paper rounded-[10px] px-3 py-1.5 border border-line">
              <span className="text-[10px] font-bold text-ink">
                19 ordering today
              </span>
            </div>
            <div className="absolute top-3 right-3 bg-green rounded-[10px] px-3 py-1.5">
              <span className="text-[10px] font-bold text-white">
                ₦0 delivery
              </span>
            </div>
            <div className="absolute bottom-3 left-3 bg-coral rounded-[10px] px-3 py-1.5">
              <span className="text-[10px] font-bold text-white">
                Save up to 40%
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <p className="text-[12px] text-ink-soft">
              Already a member?{" "}
              <a href="/auth" className="text-coral font-bold">
                Log in
              </a>
            </p>
            <p className="text-[12px] text-[var(--muted)]">
              Have an invite?{" "}
              <a
                href="/auth"
                className="text-[var(--muted)] font-semibold underline"
              >
                Join your office
              </a>
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* THE MATH                                        */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <Reveal>
            <p className="text-[11px] font-bold text-coral uppercase tracking-[0.1em] mb-2">
              The lunch math
            </p>
            <h2 className="font-display font-[800] text-[26px] text-ink tracking-[-0.03em] leading-tight mb-8">
              How much is your office
              <br />
              spending on lunch?
            </h2>
          </Reveal>

          {/* Without ChopDrop */}
          <Reveal delay={80}>
            <div className="bg-paper rounded-[16px] border border-line p-4 mb-3">
              <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.1em] mb-3">
                Without ChopDrop
              </div>
              <p className="text-[13px] text-ink-soft mb-1.5">
                30 people × ₦2,000/day
              </p>
              <p className="font-display font-[800] text-[26px] text-ink tracking-[-0.02em] tabular-nums">
                = ₦1,200,000
                <span className="text-[13px] font-medium text-[var(--muted)]">
                  /mo
                </span>
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-2">
                Each person orders alone. Full price. Plus delivery fees.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-line" />
              <span className="text-[12px] font-bold text-[var(--muted)]">
                VS
              </span>
              <div className="flex-1 h-px bg-line" />
            </div>
          </Reveal>

          {/* With ChopDrop — terracotta accent border */}
          <Reveal delay={160}>
            <div className="bg-paper rounded-[16px] border-2 border-coral p-4 mb-4">
              <div className="text-[9px] font-bold text-coral uppercase tracking-[0.1em] mb-3">
                With ChopDrop
              </div>
              <p className="text-[13px] text-ink-soft mb-1.5">
                30 people × ₦1,300/day
              </p>
              <p className="font-display font-[800] text-[26px] text-green tracking-[-0.02em] tabular-nums">
                = ₦780,000
                <span className="text-[13px] font-medium text-[var(--muted)]">
                  /mo
                </span>
              </p>
              <p className="text-[11px] text-ink-soft mt-2">
                Everyone orders together. Pool discount. ₦0 delivery.
              </p>
            </div>
          </Reveal>

          {/* Savings — solid terracotta, NO gradient */}
          <Reveal delay={240}>
            <div className="bg-coral rounded-[16px] p-6 text-center">
              <div className="text-[9px] font-bold text-white/60 uppercase tracking-[0.12em] mb-2">
                Your office saves
              </div>
              <div className="font-display font-[800] text-[40px] text-white tracking-[-0.03em] leading-none tabular-nums">
                ₦420,000
              </div>
              <div className="text-[12px] text-white/70 mt-1 mb-3">
                per month
              </div>
              <div className="bg-white/15 rounded-[10px] px-4 py-2 inline-block">
                <span className="text-[12px] text-white font-semibold">
                  ₦14,000 back in each pocket. Every month.
                </span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* HOW IT WORKS — sand background                  */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-12 px-5" style={{ background: "var(--sand)" }}>
          <Reveal>
            <p className="text-[11px] font-bold text-coral uppercase tracking-[0.1em] mb-2">
              How it works
            </p>
            <h2 className="font-display font-[800] text-[26px] text-ink tracking-[-0.03em] leading-tight mb-10">
              Three steps. Two minutes.
            </h2>
          </Reveal>

          {/* Step 1 */}
          <Reveal delay={80}>
            <div className="mb-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-coral text-white flex items-center justify-center text-[15px] font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-ink">
                    You set up your office
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    Takes 2 minutes
                  </p>
                </div>
              </div>
              <div className="bg-paper rounded-[16px] border border-line p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green" />
                  <span className="text-[10px] font-bold text-green">
                    Office created
                  </span>
                </div>
                <div className="text-[15px] font-bold text-ink mb-0.5">
                  Sterling Bank HQ
                </div>
                <div className="text-[11px] text-ink-soft mb-3">
                  20 Marina St, Lagos Island
                </div>
                <div
                  className="rounded-[10px] px-3.5 py-2.5 text-[10px] text-ink-soft font-medium"
                  style={{ background: "var(--sand)" }}
                >
                  chopdrop-app.vercel.app/join/sterling-hq
                </div>
              </div>
              <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
                Enter your company name and share the invite link to your office
                WhatsApp group.
              </p>
            </div>
          </Reveal>

          {/* Step 2 */}
          <Reveal delay={140}>
            <div className="mb-10">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-amber text-white flex items-center justify-center text-[15px] font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-ink">
                    Colleagues pick their meal
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    60 seconds each
                  </p>
                </div>
              </div>
              <div className="bg-paper rounded-[16px] border border-line overflow-hidden">
                <div className="flex h-[90px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={FOOD_JOLLOF}
                    alt=""
                    className="w-1/2 object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={FOOD_RICE}
                    alt=""
                    className="w-1/2 object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-ink">
                      Mama Tola&apos;s Kitchen
                    </span>
                    <span className="text-[9px] font-bold text-white bg-green px-2.5 py-1 rounded-[8px]">
                      POOL: 20% OFF
                    </span>
                  </div>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-ink-soft">
                        Base:{" "}
                        <strong className="text-ink">Jollof Rice</strong>
                      </span>
                      <span className="font-semibold tabular-nums">₦400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-soft">
                        Protein:{" "}
                        <strong className="text-ink">Chicken</strong>
                      </span>
                      <span className="font-semibold tabular-nums">₦480</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-soft">
                        Side:{" "}
                        <strong className="text-ink">Plantain</strong>
                      </span>
                      <span className="font-semibold tabular-nums">₦240</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-soft">
                        Drink:{" "}
                        <span className="text-[var(--muted)]">Zobo</span>
                      </span>
                      <span className="font-semibold tabular-nums">₦240</span>
                    </div>
                    <div className="h-px bg-line" />
                    <div className="flex justify-between font-bold text-[14px]">
                      <span className="text-green">Total</span>
                      <span className="tabular-nums">₦1,360</span>
                    </div>
                    <p className="text-[10px] text-coral font-bold">
                      You save ₦340 (20%)
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
                Everyone picks their own meal. More people = cheaper prices — up
                to 40% off.
              </p>
            </div>
          </Reveal>

          {/* Step 3 */}
          <Reveal delay={200}>
            <div className="mb-8">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-green text-white flex items-center justify-center text-[15px] font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-ink">
                    Food arrives at reception
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">By 1:00 PM</p>
                </div>
              </div>
              <div className="bg-paper rounded-[16px] border border-line p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
                  <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                  <span className="text-[10px] font-bold text-green">
                    Delivered · 12:58 PM
                  </span>
                </div>
                <div
                  className="flex items-center gap-3.5 mb-3.5 pb-3.5 border-b"
                  style={{ borderColor: "var(--sand)" }}
                >
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: "var(--sand)" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--secondary)"
                      strokeWidth="1.5"
                    >
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-ink">
                      TUNDE
                    </div>
                    <div className="text-[11px] text-ink-soft">
                      <strong className="text-ink">Jollof + Chicken</strong> ·{" "}
                      <span className="text-[var(--muted)]">
                        Extra meat · Zobo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: "var(--sand)" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--secondary)"
                      strokeWidth="1.5"
                    >
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-[14px] text-ink">
                      BLESSING
                    </div>
                    <div className="text-[11px] text-ink-soft">
                      <strong className="text-ink">
                        Fried Rice + Turkey
                      </strong>{" "}
                      · <span className="text-[var(--muted)]">Plantain</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
                One batch delivery. Everyone&apos;s bag has their name. Pick up
                and eat.
              </p>
            </div>
          </Reveal>

          <Reveal delay={250}>
            <a
              href="/start"
              className="w-full bg-coral text-white text-center font-bold text-[15px] h-[50px] inline-flex items-center justify-center rounded-[12px] active:scale-[0.98] transition-transform"
            >
              Set Up My Office
            </a>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* CAPTAIN PERKS — dark charcoal section           */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="px-5 py-12 bg-ink">
          <Reveal>
            <p className="text-[11px] font-bold text-green uppercase tracking-[0.1em] mb-2">
              Pool Captain perks
            </p>
            <h2 className="font-display font-[800] text-[26px] text-white tracking-[-0.03em] leading-tight mb-2">
              Wait — what do I get
              <br />
              out of this?
            </h2>
            <p className="text-[14px] text-white/60 mb-8">
              You become your office&apos;s Pool Captain.
            </p>
          </Reveal>

          <div className="space-y-3 mb-8">
            <Reveal delay={100}>
              <div className="rounded-[16px] p-4 border border-white/10 bg-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[12px] bg-coral/20 flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C4572A"
                      strokeWidth="1.5"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-[800] text-coral uppercase tracking-[0.08em]">
                    Free lunch
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">
                  When 15+ colleagues order, your lunch is on us. Every day.
                </p>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="rounded-[16px] p-4 border border-white/10 bg-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[12px] bg-amber/20 flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4A24E"
                      strokeWidth="1.5"
                    >
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-[800] text-amber uppercase tracking-[0.08em]">
                    Monthly bonus
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">
                  ₦500 per pool with 20+ orders. Up to ₦10,000/month cash.
                </p>
              </div>
            </Reveal>

            <Reveal delay={260}>
              <div className="rounded-[16px] p-4 border border-white/10 bg-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[12px] bg-green/20 flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1A7D4B"
                      strokeWidth="1.5"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-[800] text-green uppercase tracking-[0.08em]">
                    Office hero
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-white leading-snug">
                  You save everyone money. They&apos;ll thank you every single
                  day.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={340}>
            <div className="mb-6">
              <p className="text-[13px] text-white/50">Your total effort?</p>
              <p className="text-[16px] text-white font-bold mt-1">
                Send one WhatsApp message each morning.
              </p>
              <p className="text-[11px] text-white/40 mt-1">
                The app does the rest.
              </p>
            </div>
            <a
              href="/start"
              className="w-full bg-coral text-white text-center font-bold text-[15px] h-[50px] inline-flex items-center justify-center rounded-[12px] active:scale-[0.98] transition-transform"
            >
              Set Up My Office
            </a>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* SOCIAL PROOF                                    */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <Reveal>
            <h2 className="font-display font-[800] text-[26px] text-ink tracking-[-0.03em] text-center leading-tight mb-8">
              Join offices already
              <br />
              saving with ChopDrop
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <div className="bg-paper rounded-[16px] p-4 mb-3 border border-line">
              <p className="text-[14px] text-ink-soft italic leading-relaxed mb-4">
                &ldquo;I used to spend 30 minutes every day collecting lunch
                orders on WhatsApp. Now I just tap &apos;Send Reminder&apos; and
                eat free.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-coral flex items-center justify-center text-white text-[11px] font-bold">
                  AO
                </div>
                <div>
                  <div className="text-[13px] font-bold text-ink">
                    Pool Captain
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">
                    Office in Ikeja · 28 colleagues
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="bg-paper rounded-[16px] p-4 mb-6 border border-line">
              <p className="text-[14px] text-ink-soft italic leading-relaxed mb-4">
                &ldquo;Our team of 35 saves over ₦400K per month. Setup took 2
                minutes. Best decision I made this quarter.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green flex items-center justify-center text-white text-[11px] font-bold">
                  CE
                </div>
                <div>
                  <div className="text-[13px] font-bold text-ink">
                    Office Manager
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">
                    Lagos Island · 35 colleagues
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Metrics row */}
          <Reveal delay={240}>
            <div className="bg-paper rounded-[16px] border border-line p-1.5">
              <div className="grid grid-cols-3">
                <div className="p-3.5 text-center">
                  <div className="font-display font-[800] text-[22px] text-green tabular-nums">
                    20+
                  </div>
                  <div className="text-[9px] text-[var(--muted)] font-medium mt-0.5">
                    pilot offices
                  </div>
                </div>
                <div
                  className="p-3.5 text-center border-x"
                  style={{ borderColor: "var(--sand)" }}
                >
                  <div className="font-display font-[800] text-[22px] text-green tabular-nums">
                    ₦0
                  </div>
                  <div className="text-[9px] text-[var(--muted)] font-medium mt-0.5">
                    delivery fee
                  </div>
                </div>
                <div className="p-3.5 text-center">
                  <div className="font-display font-[800] text-[22px] text-green tabular-nums">
                    40%
                  </div>
                  <div className="text-[9px] text-[var(--muted)] font-medium mt-0.5">
                    max savings
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* FAQ                                             */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="px-5 py-12">
          <Reveal>
            <p className="text-[11px] font-bold text-coral uppercase tracking-[0.1em] mb-2">
              FAQ
            </p>
            <h2 className="font-display font-[800] text-[22px] text-ink tracking-[-0.03em] mb-6">
              Common questions
            </h2>
          </Reveal>
          {[
            {
              q: "Is it really free?",
              a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for guaranteed orders. You pay the discounted food price only.",
            },
            {
              q: "What if only 3 people order?",
              a: "You still get your food — at the regular price. Discounts kick in at 5+. Most offices hit 10+ within the first week.",
            },
            {
              q: "What vendors are available?",
              a: "We partner with vetted local vendors near your office. Have a favorite? We\u2019ll onboard them.",
            },
            {
              q: "What if I don\u2019t want to be captain forever?",
              a: "Transfer the role in one tap. But most captains stay — free lunch every day is hard to give up.",
            },
            {
              q: "How does payment work?",
              a: "Everyone pays for their own plate via card or bank transfer through Paystack. No collecting cash.",
            },
            {
              q: "Can people customize their food?",
              a: "Yes — everyone picks their own meal. Exactly what you want, not a fixed combo.",
            },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 30}>
              <div className={i > 0 ? "border-t border-line" : ""}>
                <button
                  type="button"
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-[14px] font-semibold text-ink pr-4">
                    {item.q}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      faq === i ? "rotate-180" : ""
                    }`}
                    style={{ background: "var(--sand)" }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--secondary)"
                      strokeWidth="2.5"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    faq === i
                      ? "max-h-40 opacity-100 pb-4"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-[13px] text-ink-soft leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* FINAL CTA — solid terracotta                    */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-14 px-5 text-center bg-coral">
          <Reveal>
            <h2 className="font-display font-[800] text-[26px] text-white tracking-[-0.03em] leading-tight mb-6">
              Ready to save your
              <br />
              office ₦400K+ per month?
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <a
              href="/start"
              className="w-full bg-white text-coral text-center font-bold text-[16px] h-[50px] inline-flex items-center justify-center rounded-[12px] active:scale-[0.98] transition-transform mb-1"
            >
              Set Up My Office
            </a>
            <p className="text-[11px] font-medium text-white/50 mb-4">
              Free · Takes 2 minutes
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[13px] text-white/80">
              Or{" "}
              <a href={WA_LINK} className="text-white font-bold underline">
                WhatsApp us
              </a>{" "}
              — we&apos;ll set it up with you live
            </p>
          </Reveal>
        </section>

        {/* Footer */}
        <section className="px-5 py-8 text-center">
          <Logo size={24} />
          <p className="text-[12px] text-[var(--muted)] mt-2">
            Cheaper lunch. Zero stress.
          </p>
          <p className="text-[10px] text-[var(--muted)] mt-4">
            © 2026 Arete Ltd (trading as ChopDrop)
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            Lagos, Nigeria · @chopdrop.ng
          </p>
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
