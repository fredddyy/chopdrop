"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";

const WA_LINK =
  "https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20want%20to%20set%20up%20my%20office";

/* ── Food photography (to be replaced with project's own) ── */
const PHOTOS = [
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=900&h=1350&fit=crop",
  "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=900&h=1350&fit=crop",
  "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=900&h=1350&fit=crop",
];
const PHOTO_CTA =
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=1600&h=900&fit=crop";
const PHOTO_FOOTER =
  "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=800&h=1200&fit=crop";

/* ── CSS custom properties for the Three Stones palette ── */
const PAGE_VARS: Record<string, string> = {
  "--bg": "#eeecea",
  "--surface": "#e4e1dd",
  "--ink": "#333231",
  "--muted": "#6b6763",
  "--accent": "#5c6b54",
  "--accent-ink": "#ffffff",
  "--field": "#cdc3b6",
  "--field-ink": "#333231",
  "--step-small": "clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)",
  "--step-body": "clamp(1.125rem, 1.05rem + 0.3vw, 1.3125rem)",
  "--step-lead": "clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)",
  "--step-head": "clamp(2rem, 1.3rem + 3.2vw, 4rem)",
};

/* ── Crossfading food photos (signature move) ── */
function Crossfade() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PHOTOS.length), 5500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-full h-full">
      {PHOTOS.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt="Nigerian food"
          width={900}
          height={1350}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: "opacity 1.6s ease",
          }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}

/* ── Stripe motif (from the bukateria awning) ── */
function Stripe({
  h = 56,
  w = 28,
  round = true,
}: {
  h?: number;
  w?: number;
  round?: boolean;
}) {
  return (
    <div
      className={`flex overflow-hidden ${round ? "rounded-t-[16px]" : ""}`}
      style={{ height: h }}
    >
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="shrink-0 h-full"
          style={{
            width: w,
            background: i % 2 === 0 ? "var(--ink)" : "var(--bg)",
          }}
        />
      ))}
    </div>
  );
}

/* ── Pool calculator (the live thing) ── */
function PoolCalc() {
  const [n, setN] = useState(20);
  const price =
    n >= 25 ? 1200 : n >= 15 ? 1400 : n >= 10 ? 1600 : n >= 5 ? 1800 : 2000;
  const saved = (2000 - price) * n * 20;
  const pct = Math.round(((2000 - price) / 2000) * 100);

  return (
    <div
      className="rounded-[16px] p-6 lg:p-8"
      style={{ background: "var(--surface)" }}
    >
      <label
        className="block mb-4"
        style={{ fontSize: "var(--step-body)", fontWeight: 500 }}
      >
        How many people in your office?
      </label>
      <input
        type="range"
        min={3}
        max={50}
        value={n}
        onChange={(e) => setN(+e.target.value)}
        className="w-full mb-6 h-2 appearance-none rounded-none"
        style={{
          accentColor: "var(--accent)",
          background: "var(--muted)",
        }}
      />
      <div className="flex justify-between items-baseline mb-6">
        <span style={{ fontSize: "var(--step-body)", color: "var(--muted)" }}>
          {n} people
        </span>
        <span
          style={{
            fontSize: "var(--step-lead)",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ₦{price.toLocaleString()}/plate
        </span>
      </div>
      <div className="flex justify-between items-baseline">
        <span style={{ fontSize: "var(--step-body)", color: "var(--muted)" }}>
          {pct}% off
        </span>
        <div className="text-right">
          <div
            style={{
              fontSize: "var(--step-head)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₦{saved.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: "var(--step-small)",
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            saved per month
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Itinerary row ── */
function ItRow({ left, right }: { left: string; right: string }) {
  return (
    <div
      className="flex items-baseline gap-2 py-3"
      style={{ fontSize: "var(--step-body)" }}
    >
      <span className="shrink-0">{left}</span>
      <span
        className="flex-1 self-end mb-1"
        style={{
          borderBottom: "3px dotted var(--muted)",
          opacity: 0.3,
          minWidth: 20,
        }}
      />
      <span
        className="shrink-0"
        style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}
      >
        {right}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════ */
/* PAGE                                             */
/* ════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div
      className="min-h-svh"
      style={{
        ...PAGE_VARS,
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "'Zilla Slab', serif",
      } as React.CSSProperties}
    >
      {/* ── Mobile sticky bottom bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <a
            href="/auth"
            style={{ fontSize: "var(--step-small)", fontWeight: 500 }}
          >
            Log in
          </a>
          <a
            href="/start"
            className="active:scale-[0.98] transition-transform"
            style={{
              background: "var(--accent)",
              color: "var(--accent-ink)",
              fontWeight: 600,
              fontSize: "var(--step-small)",
              padding: "12px 24px",
            }}
          >
            Set Up My Office
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SPLIT STAGE                             */}
      {/* ═══════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-3 lg:p-3">
        {/* ── Content column ── */}
        <div>
          {/* Mobile: sticky food photo behind hero */}
          <div className="lg:hidden h-[60svh] sticky top-0 z-0 overflow-hidden">
            <Crossfade />
          </div>

          {/* HERO CARD */}
          <div
            className="relative z-10 mx-3 -mt-6 lg:mt-0 lg:mx-0 rounded-[16px] overflow-hidden"
            style={{ background: "var(--surface)" }}
          >
            <Stripe />
            <div className="px-6 py-10 lg:px-12 lg:py-16 text-center">
              <div className="mb-8">
                <Logo size={28} />
              </div>
              <h1
                style={{
                  fontSize: "clamp(40px, 3.6vw, 56px)",
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.0,
                  marginBottom: 20,
                }}
              >
                Lunch is cheaper
                <br />
                together.
              </h1>
              <p
                style={{
                  fontSize: "var(--step-body)",
                  color: "var(--muted)",
                  maxWidth: "36ch",
                  margin: "0 auto 32px",
                  lineHeight: 1.5,
                }}
              >
                ChopDrop pools your office lunch orders from local vendors. More
                people ordering = cheaper plates for everyone.
              </p>
              <a
                href="/start"
                className="inline-block active:scale-[0.98] transition-transform"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  fontWeight: 600,
                  fontSize: "var(--step-body)",
                  padding: "16px 40px",
                }}
              >
                Set Up My Office
              </a>
              <div
                className="flex justify-center gap-6 lg:gap-8 mt-8 flex-wrap"
                style={{
                  fontSize: "var(--step-small)",
                  color: "var(--muted)",
                }}
              >
                <a href="/menu" className="underline">
                  Browse menu
                </a>
                <a href="/auth" className="underline">
                  Log in
                </a>
                <a href="/auth" className="underline">
                  Join office
                </a>
              </div>
            </div>
          </div>

          {/* Cover mobile sticky photo with bg */}
          <div
            className="relative z-10"
            style={{ background: "var(--bg)" }}
          >
            {/* ── PROOF: The math ── */}
            <section
              className="px-6 lg:px-12"
              style={{ paddingTop: 120, paddingBottom: 120 }}
            >
              <h2
                style={{
                  fontSize: "var(--step-head)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  marginBottom: 48,
                }}
              >
                The math
              </h2>
              <div
                className="lg:grid lg:grid-cols-2 lg:gap-12"
                style={{ fontSize: "var(--step-body)", lineHeight: 1.5 }}
              >
                <div className="mb-8 lg:mb-0">
                  <div
                    style={{
                      color: "var(--muted)",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    Without ChopDrop
                  </div>
                  <div>30 people × ₦2,000/day</div>
                  <div
                    style={{
                      fontSize: "var(--step-lead)",
                      fontWeight: 600,
                      marginTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    = ₦1,200,000/mo
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "var(--accent)",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    With ChopDrop
                  </div>
                  <div>30 people × ₦1,300/day</div>
                  <div
                    style={{
                      fontSize: "var(--step-lead)",
                      fontWeight: 600,
                      marginTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    = ₦780,000/mo
                  </div>
                </div>
              </div>
              <div className="mt-12">
                <div
                  style={{
                    fontSize: "var(--step-head)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₦420,000
                </div>
                <div
                  style={{
                    fontSize: "var(--step-body)",
                    color: "var(--muted)",
                    marginTop: 8,
                  }}
                >
                  saved per month. ₦14,000 back in each pocket.
                </div>
              </div>
              <div className="mt-16">
                <PoolCalc />
              </div>
            </section>

            {/* ── HOW IT WORKS: Itinerary slip ── */}
            <section style={{ paddingTop: 120, paddingBottom: 120 }}>
              <div className="lg:grid lg:grid-cols-12 lg:gap-8 px-6 lg:px-12">
                <div className="lg:col-span-5">
                  <h2
                    style={{
                      fontSize: "var(--step-head)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      marginBottom: 24,
                    }}
                  >
                    How it works
                  </h2>
                  <p
                    style={{
                      fontSize: "var(--step-body)",
                      color: "var(--muted)",
                      maxWidth: "30ch",
                      lineHeight: 1.5,
                    }}
                  >
                    Set up in two minutes. Everyone picks and pays for their own
                    plate.
                  </p>
                </div>
                <div className="lg:col-span-6 lg:col-start-7 mt-8 lg:mt-0">
                  <div
                    className="rounded-[16px] overflow-hidden"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="px-6 py-8">
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--step-body)",
                          marginBottom: 4,
                        }}
                      >
                        Morning
                      </div>
                      <ItRow left="Create your office pool" right="2 min" />
                      <ItRow
                        left="Share link on WhatsApp"
                        right="30 sec"
                      />

                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--step-body)",
                          marginTop: 28,
                          marginBottom: 4,
                        }}
                      >
                        Before noon
                      </div>
                      <ItRow
                        left="Colleagues pick their meals"
                        right="60 sec each"
                      />
                      <ItRow
                        left="Everyone pays via Paystack"
                        right="automatic"
                      />

                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--step-body)",
                          marginTop: 28,
                          marginBottom: 4,
                        }}
                      >
                        1:00 PM
                      </div>
                      <ItRow left="Food arrives at reception" right="one batch" />

                      {/* Inverted result row */}
                      <div
                        className="flex justify-between items-center -mx-6 -mb-8 mt-8 px-6 py-4"
                        style={{
                          background: "var(--ink)",
                          color: "var(--bg)",
                          fontSize: "var(--step-body)",
                          fontWeight: 600,
                        }}
                      >
                        <span>Everyone saves</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          ₦14,000/mo each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Desktop: sticky photo column ── */}
        <div className="hidden lg:block">
          <div className="sticky top-3 h-[calc(100svh-24px)] rounded-[16px] overflow-hidden">
            <Crossfade />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* FEATURES — full width, field colour     */}
      {/* ═══════════════════════════════════════ */}
      <section style={{ background: "var(--field)", padding: "120px 0" }}>
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto lg:grid lg:grid-cols-12 lg:gap-8">
          <h2
            className="lg:col-span-5 lg:sticky lg:top-8 self-start"
            style={{
              fontSize: "clamp(48px, 6vw, 96px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              marginBottom: 48,
            }}
          >
            Captain
            <br />
            perks
          </h2>
          <div className="lg:col-span-5 lg:col-start-7 space-y-20 lg:space-y-32">
            {/* Free lunch */}
            <div>
              <h3
                style={{
                  fontSize: "clamp(24px, 2vw, 28px)",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                Free lunch
              </h3>
              <div className="lg:flex lg:gap-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS[1]}
                  alt="Jollof rice"
                  width={180}
                  height={240}
                  className="w-full lg:w-[180px] h-auto lg:h-[240px] object-cover mb-4 lg:mb-0 shrink-0"
                  style={{ aspectRatio: "3/4" }}
                  loading="lazy"
                />
                <p
                  style={{
                    fontSize: "var(--step-body)",
                    lineHeight: 1.5,
                  }}
                >
                  When 15 or more colleagues order through your pool, your lunch
                  is free. Every day. Most offices hit this within a week.
                </p>
              </div>
            </div>

            {/* Cash bonus */}
            <div>
              <h3
                style={{
                  fontSize: "clamp(24px, 2vw, 28px)",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                Monthly cash bonus
              </h3>
              <div className="lg:flex lg:flex-row-reverse lg:gap-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS[2]}
                  alt="Rice dish"
                  width={180}
                  height={240}
                  className="w-full lg:w-[180px] h-auto lg:h-[240px] object-cover mb-4 lg:mb-0 shrink-0"
                  style={{ aspectRatio: "3/4" }}
                  loading="lazy"
                />
                <p
                  style={{
                    fontSize: "var(--step-body)",
                    lineHeight: 1.5,
                  }}
                >
                  ₦500 for every pool with 20 or more orders. Up to ₦10,000 per
                  month, paid to your account.
                </p>
              </div>
            </div>

            {/* Office hero */}
            <div>
              <h3
                style={{
                  fontSize: "clamp(24px, 2vw, 28px)",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                Office hero
              </h3>
              <div className="lg:flex lg:gap-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS[0]}
                  alt="Nigerian food spread"
                  width={180}
                  height={240}
                  className="w-full lg:w-[180px] h-auto lg:h-[240px] object-cover mb-4 lg:mb-0 shrink-0"
                  style={{ aspectRatio: "3/4" }}
                  loading="lazy"
                />
                <p
                  style={{
                    fontSize: "var(--step-body)",
                    lineHeight: 1.5,
                  }}
                >
                  You save everyone money. They thank you every day. Your total
                  effort: send one WhatsApp message each morning. The app does
                  the rest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* TESTIMONIAL                             */}
      {/* ═══════════════════════════════════════ */}
      <section style={{ padding: "160px 0" }}>
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 lg:col-start-2 mb-8 lg:mb-0">
            <div
              className="w-full max-w-[280px]"
              style={{
                aspectRatio: "3/4",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(40px, 4vw, 60px)",
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                AO
              </span>
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-32">
            <blockquote
              style={{
                fontSize: "clamp(24px, 2.6vw, 40px)",
                fontWeight: 400,
                lineHeight: 1.2,
                maxWidth: "26ch",
              }}
            >
              I used to spend 30 minutes every day collecting lunch orders on
              WhatsApp. Now I tap one button and eat free.
            </blockquote>
            <div className="mt-8" style={{ fontSize: "var(--step-body)" }}>
              <div style={{ fontWeight: 500 }}>Pool Captain, Ikeja</div>
              <div style={{ color: "var(--muted)" }}>28 colleagues</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* FAQ — continuous reading text            */}
      {/* ═══════════════════════════════════════ */}
      <section style={{ padding: "120px 0" }}>
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto lg:grid lg:grid-cols-12 lg:gap-8">
          <h2
            className="lg:col-span-3"
            style={{
              fontSize: "clamp(28px, 2.4vw, 32px)",
              fontWeight: 600,
              marginBottom: 32,
            }}
          >
            Questions
          </h2>
          <div
            className="lg:col-span-8 lg:col-start-5 lg:columns-2 lg:gap-14"
            style={{ fontSize: "var(--step-body)", lineHeight: 1.55 }}
          >
            {[
              {
                q: "Is it really free?",
                a: "Yes. No subscription, no hidden fees. Vendors pay a small commission for guaranteed orders. You pay the discounted food price only.",
              },
              {
                q: "What if only 3 people order?",
                a: "You still get your food at the regular price. Discounts kick in at 5. Most offices hit 10 within the first week.",
              },
              {
                q: "What vendors are available?",
                a: "We partner with vetted local vendors near your office. Have a favourite? We will onboard them.",
              },
              {
                q: "Can I stop being captain?",
                a: "Transfer the role in one tap. But most captains stay. Free lunch every day is hard to give up.",
              },
              {
                q: "How does payment work?",
                a: "Everyone pays for their own plate via card or bank transfer through Paystack. No collecting cash.",
              },
              {
                q: "Can people customise their food?",
                a: "Yes. Everyone picks their own meal: base, protein, side, drink. Exactly what you want.",
              },
            ].map((item, i) => (
              <p
                key={i}
                className="mb-5"
                style={{ breakInside: "avoid" }}
              >
                <span style={{ fontWeight: 500 }}>{item.q} </span>
                {item.a}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* CTA — full-bleed photograph              */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative" style={{ height: "90svh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PHOTO_CTA}
          alt="Nigerian food"
          width={1600}
          height={900}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.7)" }}
          loading="lazy"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-16 lg:items-end">
          <div className="lg:max-w-[480px] lg:text-right">
            <h2
              style={{
                fontSize: "clamp(28px, 3.4vw, 52px)",
                fontWeight: 400,
                color: "#fff",
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              Save together.
            </h2>
            <p
              style={{
                fontSize: "var(--step-body)",
                color: "rgba(255,255,255,0.8)",
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Set up your office in two minutes. Everyone picks their meal, pays
              their share, and eats for less.
            </p>
            <a
              href="/start"
              className="inline-block active:scale-[0.98] transition-transform"
              style={{
                background: "var(--bg)",
                color: "var(--ink)",
                fontWeight: 600,
                fontSize: "var(--step-body)",
                padding: "16px 40px",
              }}
            >
              Set Up My Office
            </a>
            <p
              className="mt-4"
              style={{
                fontSize: "var(--step-small)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Or{" "}
              <a
                href={WA_LINK}
                className="underline"
                style={{ color: "#fff" }}
              >
                WhatsApp us
              </a>{" "}
              and we set it up with you
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* FOOTER — photo half + menu half          */}
      {/* ═══════════════════════════════════════ */}
      <footer className="lg:grid lg:grid-cols-2 min-h-svh">
        <div className="h-[50svh] lg:h-auto overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTO_FOOTER}
            alt="Nigerian food"
            width={800}
            height={1200}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div
          className="p-8 lg:p-16 flex flex-col"
          style={{ background: "var(--field)" }}
        >
          <Stripe h={8} w={8} round={false} />
          <div className="mt-12 mb-8">
            <Logo size={20} />
          </div>
          <nav className="space-y-4 lg:space-y-5 mb-auto">
            {[
              { label: "Menu", href: "/menu" },
              { label: "Start", href: "/start" },
              { label: "Orders", href: "/orders" },
              { label: "About", href: "/about" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block hover:translate-x-3 transition-transform"
                style={{
                  fontSize: "clamp(24px, 2.6vw, 40px)",
                  fontWeight: 600,
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div
            className="mt-12 flex gap-12"
            style={{ fontSize: "var(--step-small)", color: "var(--muted)" }}
          >
            <div>
              <div>Lagos, Nigeria</div>
              <div>@chopdrop.ng</div>
            </div>
            <div>
              <a href={WA_LINK} className="underline">
                WhatsApp
              </a>
            </div>
          </div>
          <div
            className="mt-8"
            style={{ fontSize: "var(--step-small)", color: "var(--muted)" }}
          >
            © 2026 Arete Ltd (trading as ChopDrop)
          </div>
        </div>
      </footer>

      {/* Bottom bar clearance on mobile */}
      <div className="h-16 lg:hidden" style={{ background: "var(--field)" }} />
    </div>
  );
}
