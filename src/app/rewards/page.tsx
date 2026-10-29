"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

function formatPrice(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

interface OfficeStats {
  officeName: string;
  lifetimeOrders: number;
  todayOrders: number;
}

const ACTIVE_TIERS = [
  { min: 0, pct: 0, label: "Base price", unlockLabel: "Starting tier" },
  { min: 10, pct: 3, label: "3% back", unlockLabel: "10 orders in today's pool" },
  { min: 20, pct: 5, label: "5% back", unlockLabel: "20 orders in today's pool" },
  { min: 30, pct: 8, label: "8% back", unlockLabel: "30 orders in today's pool" },
];

const MILESTONE_TIERS = [
  { lifetime: 50, pct: 15, label: "15% back", status: "coming" as const },
  { lifetime: 100, pct: 30, label: "30% back", status: "coming" as const },
];

export default function RewardsPage() {
  const [stats, setStats] = useState<OfficeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData.success || !meData.data.office) {
          setLoading(false);
          return;
        }
        const officeId = meData.data.office.id;
        const officeName = meData.data.office.name;

        // Get lifetime order count
        const detailsRes = await fetch(`/api/admin/offices/${officeId}/details`);
        const detailsData = await detailsRes.json();
        const lifetimeOrders = detailsData.success ? detailsData.data.stats.totalOrders : 0;
        const todayOrders = detailsData.success ? detailsData.data.stats.todayOrders : 0;

        setStats({ officeName, lifetimeOrders, todayOrders });
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const lifetimeOrders = stats?.lifetimeOrders || 0;

  // Find current milestone level
  const currentMilestone = MILESTONE_TIERS.filter(m => lifetimeOrders >= m.lifetime).length;
  const nextMilestone = MILESTONE_TIERS[currentMilestone] || null;
  const progressToNext = nextMilestone
    ? Math.min(100, (lifetimeOrders / nextMilestone.lifetime) * 100)
    : 100;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/menu" className="w-10 h-10 rounded-full bg-white flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <Logo size={24} />
          <div className="w-10" />
        </div>

        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Pool Rewards</h1>
        <p className="text-[15px] mt-1" style={{ color: "var(--text-secondary)" }}>
          {stats ? `${stats.officeName} — ${lifetimeOrders} lifetime orders` : "Your office unlocks rewards together"}
        </p>
      </div>

      {loading ? (
        <div className="px-5 py-12 text-center">
          <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* ── TODAY'S ACTIVE TIERS ── */}
          <div className="px-5 mt-2">
            <div className="rounded-[20px] overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-4 py-3.5" style={{ background: "var(--dark)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-white">Today&apos;s pool tiers</span>
                  {stats && (
                    <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {stats.todayOrders} orders today
                    </span>
                  )}
                </div>
                <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  More people order today, better rates for everyone
                </p>
              </div>

              <div className="p-4 space-y-2" style={{ background: "var(--card)" }}>
                {ACTIVE_TIERS.map((tier, i) => {
                  const isActive = stats ? stats.todayOrders >= tier.min : false;
                  const isCurrent = stats
                    ? (i < ACTIVE_TIERS.length - 1
                        ? stats.todayOrders >= tier.min && stats.todayOrders < ACTIVE_TIERS[i + 1].min
                        : stats.todayOrders >= tier.min)
                    : false;

                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-[14px]" style={{
                      background: isCurrent ? "var(--sand)" : "transparent",
                      outline: isCurrent ? "1.5px solid var(--border)" : "none",
                    }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
                        background: isActive ? "var(--emerald)" : "var(--sand)",
                      }}>
                        {isActive ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                        ) : (
                          <span className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>{tier.min}+</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold" style={{ color: isActive ? "var(--text)" : "var(--text-muted)" }}>
                          {tier.label}
                        </div>
                        <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                          {tier.unlockLabel}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--coral)", color: "white" }}>Now</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── MILESTONE TIERS (LOCKED) ── */}
          <div className="px-5 mt-6">
            <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Milestone rewards</h2>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
              Unlocked by your office&apos;s total orders over time — not just today
            </p>

            {/* Progress bar to next milestone */}
            {nextMilestone && (
              <div className="rounded-[16px] p-4 mb-4" style={{ background: "var(--dark)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-white">
                    {nextMilestone.label} — {nextMilestone.lifetime} lifetime orders
                  </span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: "var(--gold)" }}>
                    {lifetimeOrders}/{nextMilestone.lifetime}
                  </span>
                </div>
                <div className="h-[6px] rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${Math.max(2, progressToNext)}%`,
                    background: "var(--gold)",
                  }} />
                </div>
                <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {nextMilestone.lifetime - lifetimeOrders} more orders to unlock
                </p>
              </div>
            )}

            {/* Milestone cards */}
            <div className="space-y-3">
              {MILESTONE_TIERS.map((milestone, i) => {
                const unlocked = lifetimeOrders >= milestone.lifetime;
                return (
                  <div key={i} className="rounded-[16px] p-4 flex items-center gap-4" style={{
                    background: unlocked ? "rgba(13,159,95,0.06)" : "var(--card)",
                    border: unlocked ? "1px solid rgba(13,159,95,0.15)" : "1px solid var(--border)",
                    opacity: unlocked ? 1 : 0.7,
                  }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{
                      background: unlocked ? "var(--emerald)" : "var(--sand)",
                    }}>
                      {unlocked ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[17px] font-extrabold" style={{ color: unlocked ? "var(--emerald)" : "var(--text)" }}>
                          {milestone.label}
                        </span>
                        {!unlocked && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "var(--sand)", color: "var(--text-muted)" }}>
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {unlocked
                          ? "Unlocked! This tier is active for your daily pools."
                          : `Reach ${milestone.lifetime} total office orders to unlock`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Future tease */}
            <div className="mt-4 p-4 rounded-[16px] text-center" style={{ background: "var(--sand)" }}>
              <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                More tiers coming as ChopDrop grows. Keep ordering together.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="px-5 mt-8 mb-4">
            <h2 className="text-[16px] font-extrabold mb-3" style={{ color: "var(--text)" }}>How it works</h2>
            <div className="space-y-3">
              {[
                { title: "Daily pool tiers", desc: "Based on how many people order TODAY. Resets each day." },
                { title: "Milestone tiers", desc: "Based on your office's TOTAL orders ever. Once unlocked, stays forever." },
                { title: "Pool refund guarantee", desc: "Pay today's price. If more people join and the tier improves, you get the difference as credit." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--sand)" }}>
                    <span className="text-[11px] font-bold" style={{ color: "var(--text-secondary)" }}>{i + 1}</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{item.title}</div>
                    <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}
