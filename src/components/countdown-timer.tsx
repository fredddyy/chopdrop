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
      return <span className="text-[11px] font-bold text-[#f05f4b]">Closed</span>;
    }
    // Flip-clock style compact digits — works on light backgrounds
    return (
      <div className="flex items-center gap-[3px]">
        {pad(timeLeft.hours).split("").map((d, i) => (
          <span key={`h${i}`} className="w-[20px] h-[24px] bg-[#0f4030] rounded-[5px] flex items-center justify-center text-[13px] font-mono font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]">{d}</span>
        ))}
        <span className="text-[#9ca3af] text-[11px] font-bold mx-[1px]">:</span>
        {pad(timeLeft.minutes).split("").map((d, i) => (
          <span key={`m${i}`} className="w-[20px] h-[24px] bg-[#0f4030] rounded-[5px] flex items-center justify-center text-[13px] font-mono font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]">{d}</span>
        ))}
        <span className="text-[#9ca3af] text-[11px] font-bold mx-[1px]">:</span>
        {pad(timeLeft.seconds).split("").map((d, i) => (
          <span key={`s${i}`} className="w-[20px] h-[24px] bg-[#f05f4b] rounded-[5px] flex items-center justify-center text-[13px] font-mono font-bold text-white shadow-[0_1px_2px_rgba(240,95,75,0.2)]">{d}</span>
        ))}
      </div>
    );
  }

  if (timeLeft.expired) {
    return (
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-[10px] px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        <span className="text-[11px] font-bold text-white/70">Orders closed</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-[10px] px-3 py-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <div className="flex items-center gap-[3px]">
        {pad(timeLeft.hours).split("").map((d, i) => (
          <span key={`h${i}`} className="w-[20px] h-[24px] bg-white/15 rounded-[4px] flex items-center justify-center text-[13px] font-mono font-bold text-white">{d}</span>
        ))}
        <span className="text-white/40 text-[11px] font-bold mx-[1px]">:</span>
        {pad(timeLeft.minutes).split("").map((d, i) => (
          <span key={`m${i}`} className="w-[20px] h-[24px] bg-white/15 rounded-[4px] flex items-center justify-center text-[13px] font-mono font-bold text-white">{d}</span>
        ))}
        <span className="text-white/40 text-[11px] font-bold mx-[1px]">:</span>
        {pad(timeLeft.seconds).split("").map((d, i) => (
          <span key={`s${i}`} className="w-[20px] h-[24px] bg-white/15 rounded-[4px] flex items-center justify-center text-[13px] font-mono font-bold text-white">{d}</span>
        ))}
      </div>
    </div>
  );
}
