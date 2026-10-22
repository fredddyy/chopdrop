"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  cutoffTime: string;
  compact?: boolean;
}

export function CountdownTimer({ cutoffTime, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const [h, m] = cutoffTime.split(":").map(Number);
      const cutoff = new Date(now);
      cutoff.setHours(h, m, 0, 0);
      const diff = cutoff.getTime() - now.getTime();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      };
    }
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [cutoffTime]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    if (timeLeft.expired) {
      return <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>Closed</span>;
    }
    return (
      <div className="flex items-center gap-[3px]">
        {pad(timeLeft.hours).split("").map((d, i) => (
          <span key={`h${i}`} className="w-[22px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-mono font-bold text-white" style={{ background: "var(--dark)" }}>{d}</span>
        ))}
        <span className="text-[12px] font-bold mx-[1px]" style={{ color: "var(--text-muted)" }}>:</span>
        {pad(timeLeft.minutes).split("").map((d, i) => (
          <span key={`m${i}`} className="w-[22px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-mono font-bold text-white" style={{ background: "var(--dark)" }}>{d}</span>
        ))}
        <span className="text-[12px] font-bold mx-[1px]" style={{ color: "var(--text-muted)" }}>:</span>
        {pad(timeLeft.seconds).split("").map((d, i) => (
          <span key={`s${i}`} className="w-[22px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-mono font-bold text-white" style={{ background: "var(--coral)" }}>{d}</span>
        ))}
      </div>
    );
  }

  if (timeLeft.expired) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--coral)" }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        <span className="text-[12px] font-bold text-white/70">Closed</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--emerald)" }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <div className="flex items-center gap-[3px]">
        {pad(timeLeft.hours).split("").map((d, i) => (
          <span key={`h${i}`} className="w-[22px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-mono font-bold text-white" style={{ background: "rgba(255,255,255,0.15)" }}>{d}</span>
        ))}
        <span className="text-white/40 text-[12px] font-bold mx-[1px]">:</span>
        {pad(timeLeft.minutes).split("").map((d, i) => (
          <span key={`m${i}`} className="w-[22px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-mono font-bold text-white" style={{ background: "rgba(255,255,255,0.15)" }}>{d}</span>
        ))}
        <span className="text-white/40 text-[12px] font-bold mx-[1px]">:</span>
        {pad(timeLeft.seconds).split("").map((d, i) => (
          <span key={`s${i}`} className="w-[22px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-mono font-bold text-white" style={{ background: "rgba(255,255,255,0.15)" }}>{d}</span>
        ))}
      </div>
    </div>
  );
}
