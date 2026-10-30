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

  if (compact) {
    if (timeLeft.expired) {
      return <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>Closed</span>;
    }
    const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
    const isUrgent = totalMinutes < 30;
    const timeStr = timeLeft.hours > 0
      ? `${timeLeft.hours}h ${timeLeft.minutes}m left`
      : `${timeLeft.minutes} min left`;
    return (
      <span className={`text-[12px] font-bold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: isUrgent ? "var(--coral)" : "rgba(255,255,255,0.5)" }}>
        {timeStr}
      </span>
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

  // Full mode — still conversational
  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
  const isUrgent = totalMinutes < 30;
  const timeStr = timeLeft.hours > 0
    ? `${timeLeft.hours}h ${timeLeft.minutes}m left`
    : `${timeLeft.minutes} min left`;

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: isUrgent ? "rgba(232,96,76,0.15)" : "rgba(255,255,255,0.1)", border: `1px solid ${isUrgent ? "rgba(232,96,76,0.2)" : "rgba(255,255,255,0.1)"}` }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: isUrgent ? "var(--coral)" : "var(--emerald)" }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <span className={`text-[12px] font-bold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: isUrgent ? "var(--coral)" : "white" }}>
        {timeStr}
      </span>
    </div>
  );
}
