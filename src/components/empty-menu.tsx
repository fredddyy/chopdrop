"use client";

import { useState } from "react";
import { Logo } from "./logo";
import { BottomNav } from "./bottom-nav";
import Link from "next/link";

function BowlIllustration() {
  return (
    <svg viewBox="0 0 200 180" width={200} height={180} aria-hidden="true">
      {/* Steam */}
      <path d="M74 62 Q70 50 74 38 Q78 26 74 14" stroke="#F4937F" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M100 58 Q96 44 100 30 Q104 16 100 4" stroke="#F4937F" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M126 62 Q122 50 126 38 Q130 26 126 14" stroke="#F4937F" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Plate shadow */}
      <ellipse cx="100" cy="164" rx="62" ry="9" fill="#D8EBE2" />
      {/* Bowl body */}
      <path d="M38 100 Q38 154 100 154 Q162 154 162 100 Z" fill="#E8604C" />
      {/* Bowl rim */}
      <ellipse cx="100" cy="100" rx="62" ry="14" fill="#F4937F" />
      {/* Lid */}
      <path d="M48 100 Q48 72 100 72 Q152 72 152 100" fill="#1A3C2A" />
      <ellipse cx="100" cy="100" rx="52" ry="11" fill="#2D5A3D" />
      {/* Lid handle */}
      <rect x="90" y="62" width="20" height="12" rx="6" fill="#1A3C2A" />
      <ellipse cx="100" cy="62" rx="10" ry="5" fill="#2D5A3D" />
      {/* Drop mark on bowl */}
      <g transform="translate(84, 106) scale(0.32)">
        <path d="M50 4 C58 12 88 35 88 50 L88 80 A18 18 0 0 1 70 98 L30 98 A18 18 0 0 1 12 80 L12 50 C12 35 42 12 50 4 Z" fill="rgba(255,255,255,0.25)" />
        <path d="M32 70 Q50 86 68 70" stroke="rgba(255,255,255,0.6)" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const STEPS = [
  { time: "9:00 AM", label: "Menu goes live", sub: "Today's meals published", active: true },
  { time: "10:30 AM", label: "Order cutoff", sub: "Last chance to add items", active: false },
  { time: "by 12 PM", label: "Office drop", sub: "Your food arrives on or before 12", active: false },
];

export function EmptyMenu() {
  const [notified, setNotified] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("chopdrop-notify") === "true";
    return false;
  });
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <main className="flex-1 max-w-sm mx-auto w-full min-h-screen pb-20 bg-cream">
      {/* Top nav */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 sticky top-0 z-10 bg-cream border-b border-line">
        <Logo size={30} />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-soft">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-coral">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] font-semibold text-green">Ikeja</span>
        </div>
      </div>

      {/* Date strip */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-ink-soft">Today</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-soft text-green">{today}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-coral" />
          <span className="text-[11px] font-semibold text-ink-soft">Menu not yet live</span>
        </div>
      </div>

      {/* Hero illustration */}
      <div className="flex flex-col items-center px-5 pt-8 pb-6 text-center">
        <BowlIllustration />
        <h1 className="font-display font-[900] text-[24px] mt-4 mb-2 leading-tight tracking-[-0.5px]">
          Kitchen&apos;s getting<br />ready for you
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-soft max-w-[280px]">
          Today&apos;s menu hasn&apos;t been published yet. The team is finalising today&apos;s selections — check back soon.
        </p>
      </div>

      {/* Notify button */}
      <div className="px-5 mb-6">
        <button
          type="button"
          onClick={() => { setNotified(true); localStorage.setItem("chopdrop-notify", "true"); }}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
          style={{
            background: notified ? "#EDF4F0" : "#E8604C",
            color: notified ? "#1A3C2A" : "#fff",
            border: notified ? "2px solid #D8EBE2" : "2px solid transparent",
          }}
        >
          {notified ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green"><path d="m5 12 4 4L19 6" /></svg>
              You&apos;ll be notified at 9:00 AM
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
              Notify me when menu is live
            </>
          )}
        </button>
      </div>

      {/* Schedule timeline */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-6 border border-line">
        <div className="px-5 py-3 bg-green">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/70">Today&apos;s schedule</p>
        </div>
        {STEPS.map((step, i) => (
          <div key={step.time} className="flex items-start gap-4 px-5 py-4 bg-paper" style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${step.active ? "bg-coral text-white" : "bg-green-soft text-ink-soft"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {i === 0 ? <><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M16 3v18M16 3c4 2 4 8 0 10" /></> :
                 i === 1 ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> :
                 <><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>}
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-[13px] font-bold ${step.active ? "text-ink" : "text-ink-soft"}`}>{step.label}</p>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${step.active ? "bg-green-soft text-green" : "border border-line text-ink-soft"}`}>{step.time}</span>
              </div>
              <p className="text-[11px] mt-0.5 text-ink-soft">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="px-5 mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-soft mb-4">How ChopDrop works</p>
        <div className="space-y-3">
          {[
            { n: "01", title: "Connect your office", body: "Enter your office code to unlock free delivery on every drop." },
            { n: "02", title: "Order before 10:30 AM", body: "Browse today's menu, build your box, and pay securely via Paystack." },
            { n: "03", title: "Collect by 12:00 PM", body: "Your food arrives on or before 12. Your box has a unique code." },
          ].map((item) => (
            <div key={item.n} className="flex items-start gap-4 p-4 rounded-2xl bg-green-soft">
              <span className="text-[10px] font-[900] w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-green text-white">{item.n}</span>
              <div>
                <p className="text-[13px] font-bold text-ink mb-0.5">{item.title}</p>
                <p className="text-[11px] leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Minimum basket notice */}
      <div className="mx-5 mb-8 flex items-start gap-3 p-4 rounded-2xl" style={{ background: "#FFF8F0", border: "1px solid rgba(232,96,76,0.2)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>
        <p className="text-[11px] leading-relaxed text-ink">
          <strong>Minimum order ₦2,500.</strong> Office drops are free. Solo delivery costs ₦1,000. Self-pickup is always free.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-5 border-t border-line mt-auto">
        <Logo size={22} />
        <Link href="/orders" className="flex items-center gap-1 text-[11px] font-semibold text-coral">
          View past orders
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
