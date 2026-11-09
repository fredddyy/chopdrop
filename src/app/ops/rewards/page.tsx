"use client";

import { useState, useEffect } from "react";

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export default function RewardsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCreditIssued: 0,
    totalCreditSpent: 0,
    activeStreaks: 0,
    scratchesToday: 0,
    prizesAwarded: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/dashboard/metrics");
        const data = await res.json();
        if (data.success && data.data) {
          setStats((prev) => ({
            ...prev,
            totalCreditIssued: data.data.creditLiability ?? 0,
          }));
        }
      } catch {
        // Metrics endpoint may not include all reward fields yet
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  function formatNaira(kobo: number): string {
    return "\u20A6" + (kobo / 100).toLocaleString();
  }

  const statCards: StatCard[] = [
    {
      label: "Total Credit Issued",
      value: formatNaira(stats.totalCreditIssued),
      sub: "All-time wallet credits",
      accent: "#E84C3D",
    },
    {
      label: "Total Credit Spent",
      value: formatNaira(stats.totalCreditSpent),
      sub: "Credits applied to orders",
      accent: "#1C1C1E",
    },
    {
      label: "Active Streaks",
      value: String(stats.activeStreaks),
      sub: "Users on a streak right now",
      accent: "#16A34A",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-bold text-[#1C1C1E] tracking-[-0.02em]"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Rewards &amp; Credits
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Manage wallet credits, scratch cards, and streak rewards
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border border-[#E5E7EB]"
          >
            <p className="text-xs font-medium text-[#6B7280] mb-1">
              {card.label}
            </p>
            <p
              className="text-[24px] font-bold tabular-nums leading-tight"
              style={{ color: card.accent ?? "#1C1C1E" }}
            >
              {card.value}
            </p>
            {card.sub && (
              <p className="text-[11px] text-[#9CA3AF] mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Credit Transactions */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-6">
        <h2
          className="text-lg font-bold text-[#1C1C1E] mb-1"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Credit Transactions
        </h2>
        <div className="mt-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F3F4F6] mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#6B7280]">Coming soon</p>
          <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs mx-auto">
            Will show all wallet transactions across users — credits issued,
            spent, and expired
          </p>
        </div>
      </section>

      {/* Scratch Card Activity */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-6">
        <h2
          className="text-lg font-bold text-[#1C1C1E] mb-1"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Scratch Card Activity
        </h2>
        <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
          <div className="rounded-xl bg-[#FEF2F2] p-4">
            <p className="text-xs font-medium text-[#9CA3AF]">
              Scratches today
            </p>
            <p className="text-[22px] font-bold text-[#E84C3D] tabular-nums mt-1">
              {stats.scratchesToday}
            </p>
          </div>
          <div className="rounded-xl bg-[#F0FDF4] p-4">
            <p className="text-xs font-medium text-[#9CA3AF]">
              Prizes awarded
            </p>
            <p className="text-[22px] font-bold text-[#16A34A] tabular-nums mt-1">
              {stats.prizesAwarded}
            </p>
          </div>
        </div>
        <div className="py-6 text-center">
          <p className="text-sm font-medium text-[#6B7280]">Coming soon</p>
          <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs mx-auto">
            Daily scratch card stats — win rate, total prizes, popular prize
            tiers
          </p>
        </div>
      </section>

      {/* Streak Leaderboard */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2
          className="text-lg font-bold text-[#1C1C1E] mb-1"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Streak Leaderboard
        </h2>
        <div className="mt-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F3F4F6] mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
              <circle cx="12" cy="8" r="7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#6B7280]">Coming soon</p>
          <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs mx-auto">
            Users with the longest active ordering streaks and their reward
            tiers
          </p>
        </div>
      </section>
    </div>
  );
}
