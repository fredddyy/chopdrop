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
    // Inline compact — for sticky bars
    if (timeLeft.expired) {
      return <span className="text-[11px] font-bold text-coral">Closed</span>;
    }
    return (
      <span className="font-display font-bold text-[12px] tracking-[0.04em] whitespace-nowrap">
        ⏱ {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    );
  }

  const bgClass = "border border-white/[0.18] bg-white/[0.09] text-white";

  if (timeLeft.expired) {
    return (
      <div className={`inline-flex items-center gap-3 ${bgClass} rounded-[13px] px-4 py-3`}>
        <div className="w-9 h-9 bg-red-soft rounded-[10px] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-coral">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.13em] opacity-70">Orders closed</div>
          <div className="font-display font-bold text-[18px] tracking-[0.06em] whitespace-nowrap">00 : 00 : 00</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${bgClass} rounded-[13px] px-4 py-3`}>
      <div className="w-9 h-9 bg-lime rounded-[10px] flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-extrabold uppercase tracking-[0.13em] opacity-70">Orders close in</div>
        <div className="font-display font-bold text-[18px] tracking-[0.06em] whitespace-nowrap">
          {pad(timeLeft.hours)} : {pad(timeLeft.minutes)} : {pad(timeLeft.seconds)}
        </div>
      </div>
    </div>
  );
}
