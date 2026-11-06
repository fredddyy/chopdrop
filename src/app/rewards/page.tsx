"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

function ScratchCard({ canScratch, todayPrize, onClaim }: { canScratch: boolean; todayPrize: number | null; onClaim: (prize: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratch] = useState(false);
  const [prize, setPrize] = useState(todayPrize);
  const [claiming, setClaiming] = useState(false);
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
    ctx.fillStyle = "#C8D96A";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#A8B84A";
    ctx.font = "bold 18px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH ME", rect.width / 2, rect.height / 2 + 6);
  }, []);

  useEffect(() => {
    if (canScratch && !todayPrize) initCanvas();
  }, [initCanvas, canScratch, todayPrize]);

  async function claimPrize() {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/rewards/scratch", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPrize(data.data.prize);
        setRevealed(true);
        onClaim(data.data.prize);
      }
    } catch {}
    setClaiming(false);
  }

  function scratch(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x * 2, y * 2, 40, 0, Math.PI * 2);
    ctx.fill();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    for (let i = 3; i < imageData.data.length; i += 4) { if (imageData.data[i] === 0) clear++; }
    scratchPct.current = clear / (imageData.data.length / 4);
    if (scratchPct.current > 0.55) {
      setRevealed(true);
      claimPrize();
    }
  }

  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!scratching) return;
    const pt = "touches" in e ? e.touches[0] : e;
    scratch(pt.clientX, pt.clientY);
  }

  // Already claimed today
  if (todayPrize || (revealed && prize)) {
    const displayPrize = prize || todayPrize || 0;
    return (
      <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "#17271F" }}>Daily Scratch</p>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: "#17271F", color: "var(--lime)" }}>Claimed today ✓</span>
        </div>
        <div className="rounded-[16px] p-6 text-center" style={{ background: "rgba(255,255,255,0.5)" }}>
          <p className="text-[44px] font-extrabold tabular-nums leading-none celebrate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "#17271F" }}>{fp(displayPrize)}</p>
          <p className="text-[14px] font-bold mt-2" style={{ color: "#17271F" }}>Meal credit added!</p>
        </div>
        <p className="text-[12px] mt-3 leading-[155%]" style={{ color: "#17271F", opacity: 0.7 }}>
          Added to your wallet. Scratch again tomorrow.
        </p>
      </div>
    );
  }

  // Can't scratch (not logged in or error)
  if (!canScratch) {
    return (
      <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
        <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "#17271F" }}>Daily Scratch</p>
        <p className="text-[13px] mt-2" style={{ color: "#17271F", opacity: 0.7 }}>Log in to scratch and win meal credit.</p>
      </div>
    );
  }

  // Ready to scratch
  return (
    <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "#17271F" }}>Daily Scratch</p>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: "#17271F", color: "var(--lime)" }}>1 of 1 remaining</span>
      </div>
      <div className="relative rounded-[16px] overflow-hidden" style={{ height: "120px", background: "rgba(255,255,255,0.5)" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[36px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "#17271F" }}>?</p>
          <p className="text-[13px] font-bold mt-1" style={{ color: "#17271F" }}>Scratch to reveal</p>
        </div>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-pointer" style={{ touchAction: "none" }}
          onMouseDown={() => setScratch(true)} onMouseUp={() => setScratch(false)} onMouseLeave={() => setScratch(false)} onMouseMove={handleMove}
          onTouchStart={() => setScratch(true)} onTouchEnd={() => setScratch(false)} onTouchMove={handleMove} />
      </div>
      <p className="text-[12px] mt-3 leading-[155%]" style={{ color: "#17271F", opacity: 0.6 }}>
        Scratch to reveal your prize. Win up to {fp(50000)} meal credit.
      </p>
    </div>
  );
}

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [points, setPoints] = useState(0);
  const [poolsJoined, setPoolsJoined] = useState(0);
  const [streak, setStreak] = useState({ current: 0, longest: 0, canCheckIn: false });
  const [scratch, setScratch] = useState({ canScratch: false, todayPrize: null as number | null });
  const [checkingIn, setCheckingIn] = useState(false);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setWalletBalance(d.data.walletBalance || 0);
          setPoints(d.data.points || 0);
          setPoolsJoined(d.data.poolsJoined || 0);
          setStreak(d.data.streak || { current: 0, longest: 0, canCheckIn: false });
          setScratch(d.data.scratch || { canScratch: false, todayPrize: null });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function checkIn() {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/rewards/streak", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStreak({ current: data.data.current, longest: data.data.longest, canCheckIn: false });
        if (data.data.bonusAwarded) {
          setWalletBalance((b) => b + 10000);
        }
      }
    } catch {}
    setCheckingIn(false);
  }

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
        <Link href="/wallet" className="h-[30px] px-3 rounded-full flex items-center gap-1.5 text-[11px] font-bold" style={{ background: "var(--lime)", color: "#17271F" }}>
          {fp(walletBalance)}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
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
            <p className="text-[40px] font-extrabold tabular-nums leading-none text-white mt-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px" }}>{loading ? "—" : points}</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--subdued)" }}>Chop points · {poolsJoined} pools joined</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-extrabold tabular-nums leading-none text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1px" }}>{loading ? "—" : fp(walletBalance)}</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--subdued)" }}>meal credit</p>
          </div>
        </div>
      </div>

      {/* ── Daily Scratch ── */}
      <div className="px-5 mt-5">
        <ScratchCard
          canScratch={scratch.canScratch}
          todayPrize={scratch.todayPrize}
          onClaim={(prize) => { setWalletBalance((b) => b + prize); setScratch({ canScratch: false, todayPrize: prize }); }}
        />
      </div>

      {/* ── Streak ── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{streak.current} day{streak.current !== 1 ? "s" : ""}. Keep the fire.</h3>
          {streak.longest >= 7 && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>Best: {streak.longest}</span>}
        </div>
        <div className="flex gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full h-10 rounded-[10px] flex items-center justify-center text-[13px] font-bold" style={{
                background: i < streak.current ? "var(--coral)" : "var(--sand)",
                color: i < streak.current ? "white" : "var(--text-muted)",
              }}>
                {d}
              </div>
            </div>
          ))}
        </div>
        {streak.canCheckIn ? (
          <button type="button" onClick={checkIn} disabled={checkingIn}
            className="mt-3 w-full h-[40px] rounded-full text-[13px] font-bold cursor-pointer press-feedback disabled:opacity-50"
            style={{ background: "var(--coral)", color: "white" }}>
            {checkingIn ? "Checking in..." : "Check in today"}
          </button>
        ) : (
          <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
            {streak.current >= 7 ? "7-day streak complete! ₦100 bonus earned." : `Check in ${7 - streak.current} more days to unlock ₦100 bonus.`}
          </p>
        )}
      </div>

      {/* ── How you earned it — white card ── */}
      <div className="px-5 mt-6">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--card)" }}>
          <h3 className="text-[17px] font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>How you earned it</h3>
          <div className="space-y-3">
            {[
              { label: "Pool joins", detail: `${poolsJoined} × 20 points`, points: `+${poolsJoined * 20}` },
              { label: "Streak bonuses", detail: `${Math.floor(streak.longest / 7)} × ₦100 credit`, points: `+${Math.floor(streak.longest / 7) * 100}` },
              { label: "Scratch wins", detail: "Daily scratch card prizes", points: `${fp(walletBalance)}` },
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
            Invite a friend · Earn ₦200 credit →
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 mt-6 mb-4">
        <p className="text-[11px] leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Meal credit applies at checkout. Points and credit are separate balances; credit isn&apos;t cash.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
