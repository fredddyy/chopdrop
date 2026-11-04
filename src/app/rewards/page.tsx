"use client";

import { BottomNav } from "@/components/bottom-nav";

export default function RewardsPage() {
  const streak = 4;
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Rewards</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Chop<span style={{ color: "var(--coral)" }}>Drop</span>
            </span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Hero greeting ── */}
      <div className="px-5 mt-5">
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#17271F" }}>
          Chop. Collect.<br />Come back.
        </h1>
      </div>

      {/* ── Points + Credit card ── */}
      <div className="px-5 mt-5">
        <div className="p-5 rounded-[22px] flex items-center justify-between" style={{ background: "#17271F" }}>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--lime)" }}>Your little wins add up</p>
            <p className="text-[40px] font-extrabold tabular-nums leading-none text-white mt-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px" }}>0</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--subdued)" }}>Chop points</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-extrabold tabular-nums leading-none text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1px" }}>{"\u20A6"}0</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--subdued)" }}>meal credit</p>
          </div>
        </div>
      </div>

      {/* ── Daily Scratch ── */}
      <div className="px-5 mt-5">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "#17271F" }}>Daily Scratch</p>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: "#17271F", color: "var(--lime)" }}>Coming soon</span>
          </div>
          <p className="text-[15px] font-bold" style={{ color: "#17271F" }}>
            Scratch daily to win meal credit. Join pools to earn more scratches.
          </p>
        </div>
      </div>

      {/* ── Streak ── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{streak} days. Keep the fire.</h3>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>7-day streak</span>
        </div>
        <div className="flex gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full h-10 rounded-[10px] flex items-center justify-center text-[13px] font-bold" style={{
                background: i < streak ? "var(--coral)" : "var(--sand)",
                color: i < streak ? "white" : "var(--text-muted)",
              }}>
                {d}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
          Check in {7 - streak} more days to unlock +100 points.
        </p>
      </div>

      {/* ── How you earned it — white card ── */}
      <div className="px-5 mt-6">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--card)" }}>
          <h3 className="text-[17px] font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>How you earned it</h3>
          <div className="space-y-3">
            {[
              { label: "Orders", detail: "6 \u00d7 20 points", points: "+120" },
              { label: "Reviews", detail: "2 \u00d7 30 points", points: "+60" },
              { label: "Referrals", detail: "2 \u00d7 50 points", points: "+100" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "#17271F" }}>{item.label}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{item.detail}</p>
                </div>
                <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--coral)" }}>{item.points}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-[13px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>
            Invite a friend · Earn 50 points →
          </button>
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="px-5 mt-6 mb-4">
        <p className="text-[11px] leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Meal credit applies at checkout. Points and credit are separate balances; credit isn&apos;t cash.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
