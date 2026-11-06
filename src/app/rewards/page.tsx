"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

const PRIZES = [5000, 10000, 15000, 10000, 5000, 20000, 10000, 5000, 50000, 10000]; // kobo

function ScratchCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratch] = useState(false);
  const [prize] = useState(() => PRIZES[Math.floor(Math.random() * PRIZES.length)]);
  const [claimed, setClaimed] = useState(false);
  const scratchPct = useRef(0);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    // Metallic lime surface
    ctx.fillStyle = "#C8D96A";
    ctx.fillRect(0, 0, rect.width, rect.height);
    // "SCRATCH ME" text
    ctx.fillStyle = "#A8B84A";
    ctx.font = "bold 18px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH ME", rect.width / 2, rect.height / 2 + 6);
  }, []);

  useEffect(() => {
    if (!claimed) initCanvas();
  }, [initCanvas, claimed]);

  function scratch(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x * 2, y * 2, 40, 0, Math.PI * 2);
    ctx.fill();
    // Check scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) clear++;
    }
    scratchPct.current = clear / (imageData.data.length / 4);
    if (scratchPct.current > 0.55) {
      setRevealed(true);
      setClaimed(true);
    }
  }

  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!scratching) return;
    const pt = "touches" in e ? e.touches[0] : e;
    scratch(pt.clientX, pt.clientY);
  }

  if (claimed) {
    return (
      <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "#17271F" }}>Daily Scratch</p>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: "#17271F", color: "var(--lime)" }}>Claimed today ✓</span>
        </div>
        <div className="rounded-[16px] p-6 text-center" style={{ background: "rgba(255,255,255,0.5)" }}>
          <p className="text-[44px] font-extrabold tabular-nums leading-none celebrate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "#17271F" }}>{fp(prize)}</p>
          <p className="text-[14px] font-bold mt-2" style={{ color: "#17271F" }}>Meal credit. Yours!</p>
        </div>
        <p className="text-[12px] mt-3 leading-[155%]" style={{ color: "#17271F", opacity: 0.7 }}>
          Added to your credit balance. Scratch again tomorrow — a new chance at up to {fp(50000)}.
        </p>
        <p className="text-[12px] font-extrabold mt-2" style={{ color: "#17271F" }}>Next scratch in 20h 14m</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "#17271F" }}>Daily Scratch</p>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: "#17271F", color: "var(--lime)" }}>1 of 1 remaining</span>
      </div>
      {/* Scratch area */}
      <div className="relative rounded-[16px] overflow-hidden" style={{ height: "120px", background: "rgba(255,255,255,0.5)" }}>
        {/* Prize underneath */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[36px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "#17271F" }}>{fp(prize)}</p>
          <p className="text-[13px] font-bold mt-1" style={{ color: "#17271F" }}>Meal credit. Yours!</p>
        </div>
        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ touchAction: "none" }}
          onMouseDown={() => setScratch(true)}
          onMouseUp={() => setScratch(false)}
          onMouseLeave={() => setScratch(false)}
          onMouseMove={handleMove}
          onTouchStart={() => setScratch(true)}
          onTouchEnd={() => setScratch(false)}
          onTouchMove={handleMove}
        />
      </div>
      <p className="text-[12px] mt-3 leading-[155%]" style={{ color: "#17271F", opacity: 0.6 }}>
        Scratch to reveal your prize. Join pools to earn more scratches.
      </p>
    </div>
  );
}

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

      {/* ── Stat cards — pools joined + streak ── */}
      <div className="px-5 mt-5 flex gap-3">
        <div className="flex-1 p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" className="mb-2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
          <p className="text-[28px] font-extrabold leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>2</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>pools joined</p>
        </div>
        <div className="flex-1 p-4 rounded-[22px]" style={{ background: "var(--lime)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#17271F" strokeWidth="2" strokeLinecap="round" className="mb-2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          <p className="text-[28px] font-extrabold leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{streak} days</p>
          <p className="text-[11px] mt-1" style={{ color: "#17271F", opacity: 0.7 }}>current streak</p>
        </div>
      </div>

      {/* ── Wallet link ── */}
      <div className="px-5 mt-3">
        <Link href="/wallet" className="flex items-center gap-3 p-4 rounded-[22px] press-feedback" style={{ background: "var(--card)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /></svg>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{"\u20A6"}0</p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Wallet · Store credit for your next chop</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
      </div>

      {/* ── Daily Scratch ── */}
      <div className="px-5 mt-5">
        <ScratchCard />
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
          <button className="mt-4 text-[13px] font-bold cursor-pointer" style={{ color: "var(--coral)" }} onClick={() => { if (navigator.share) navigator.share({ title: "ChopDrop", text: "Join me on ChopDrop — pool orders and save!", url: window.location.origin }); }}>
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
