"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface PoolItem {
  id: string;
  product: { id: string; name: string; imageUrl: string | null; groupPrice: number; retailPrice: number };
  name: string | null;
  areaName: string | null;
  status: string;
  minSize: number;
  memberCount: number;
  deadline: string;
  creatorName: string;
  isCreator: boolean;
  myQuantity: number;
  myPaymentStatus: string;
}

type Tab = "active" | "history";
type ErrorKind = "auth" | "network" | null;

export default function PoolsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadPools();
  }, []);

  function loadPools() {
    setLoading(true);
    setErrorKind(null);
    fetch("/api/pools?mine=true")
      .then((r) => {
        if (r.status === 401) { setErrorKind("auth"); setLoading(false); return null; }
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => { if (d?.success) setPools(d.data); if (d) setLoading(false); })
      .catch(() => { setErrorKind("network"); setLoading(false); });
  }

  async function cancelPool(poolId: string) {
    setCancelling(true);
    const res = await fetch(`/api/pools/${poolId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setPools(prev => prev.map(p => p.id === poolId ? { ...p, status: "CANCELLED" } : p));
    }
    setCancelling(false);
    setCancelConfirm(null);
  }

  const activePools = pools.filter((p) => p.status === "OPEN" || p.status === "FILLED");
  const pastPools = pools.filter((p) => p.status === "COMPLETED" || p.status === "EXPIRED" || p.status === "CANCELLED");
  const current = tab === "active" ? activePools : pastPools;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      <div className="px-5 pt-6 pb-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Pools</h1>
      </div>

      <div className="px-5 flex gap-1 mb-4">
        {(["active", "history"] as Tab[]).map((t) => (
          <button
            key={t} type="button" onClick={() => setTab(t)}
            className="h-[34px] px-4 rounded-[8px] text-[12px] font-bold cursor-pointer"
            style={{ background: tab === t ? "var(--dark)" : "var(--sand)", color: tab === t ? "white" : "var(--text-secondary)", transition: "background 200ms, color 200ms" }}
          >
            {t === "active" ? `Active${activePools.length > 0 ? ` (${activePools.length})` : ""}` : `History${pastPools.length > 0 ? ` (${pastPools.length})` : ""}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-5 flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[80px] rounded-[8px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : errorKind === "auth" ? (
        /* Auth error — user not logged in */
        <div className="flex flex-col items-center pt-12 px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Log in to see your pools</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Your active and past group deals appear here.</p>
          <Link href="/auth?returnTo=/pools" className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Log in</Link>
        </div>
      ) : errorKind === "network" ? (
        /* Network error — retry */
        <div className="flex flex-col items-center pt-12 px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load pools</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={loadPools} className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>Try again</button>
        </div>
      ) : current.length > 0 ? (
        <div className="px-5 flex flex-col gap-3">
          {current.map((pool) => {
            const fillPct = Math.round((pool.memberCount / pool.minSize) * 100);
            const isHot = pool.minSize - pool.memberCount <= 2 && pool.status === "OPEN";
            const hoursLeft = Math.max(0, Math.round((new Date(pool.deadline).getTime() - Date.now()) / 3600000));
            const isFilled = pool.status === "FILLED";
            const isExpired = pool.status === "EXPIRED";
            const isCancelled = pool.status === "CANCELLED";
            const isCompleted = pool.status === "COMPLETED";
            const isPaid = pool.myPaymentStatus === "SUCCESS";

            return (
              <Link
                key={pool.id}
                href={`/product/${pool.product.id}?pool=${pool.id}`}
                className="flex gap-3 p-3 rounded-[8px] press-feedback card-enter card-enter-1"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="w-14 h-14 rounded-[8px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                  {pool.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pool.product.imageUrl} alt={pool.product.name} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{pool.product.name}</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {pool.name || `${pool.creatorName}'s group`}{pool.areaName ? ` · ${pool.areaName}` : ""} · {pool.myQuantity} {pool.myQuantity === 1 ? "item" : "items"}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${fillPct}%`,
                        background: isFilled || isCompleted ? "var(--emerald)" : isExpired || isCancelled ? "var(--text-muted)" : isHot ? "var(--coral)" : "var(--emerald)",
                      }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums shrink-0" style={{
                      color: isFilled || isCompleted ? "var(--emerald)" : isExpired || isCancelled ? "var(--text-muted)" : isHot ? "var(--coral)" : "var(--text-secondary)",
                    }}>
                      {pool.memberCount}/{pool.minSize}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right flex flex-col justify-between">
                  <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fp(pool.product.groupPrice * pool.myQuantity)}</span>

                  {/* Payment status — always show for active pools */}
                  {(pool.status === "OPEN" || isFilled) && (
                    <span className="text-[10px] font-bold" style={{ color: isPaid ? "var(--emerald)" : "var(--gold)" }}>
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  )}

                  {/* Status badges for past pools */}
                  {isCompleted && <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>Done</span>}
                  {isExpired && <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Expired</span>}
                  {isCancelled && <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Cancelled</span>}

                  {/* Time left */}
                  {pool.status === "OPEN" && hoursLeft > 0 && (
                    <span className="text-[10px]" style={{ color: isHot ? "var(--coral)" : "var(--text-muted)" }}>{hoursLeft}h left</span>
                  )}

                  {/* Cancel — 44px touch target, opens confirmation */}
                  {pool.status === "OPEN" && pool.isCreator && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCancelConfirm(pool.id); }}
                      className="h-[44px] flex items-center justify-end text-[11px] font-bold cursor-pointer"
                      style={{ color: "var(--coral)" }}
                    >
                      Cancel pool
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center pt-12 px-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-[17px] font-extrabold text-center" style={{ color: "var(--text)" }}>
            {tab === "active" ? "No active pools" : "No pool history"}
          </h2>
          <p className="text-[13px] text-center mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tab === "active" ? "Join or start a group deal on any product. Track it here." : "Completed and expired pools show here."}
          </p>
          <Link href="/discover" className="mt-5 h-[44px] px-6 rounded-[8px] text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse deals</Link>
        </div>
      )}

      {/* ── Cancel confirmation sheet ── */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" onClick={() => setCancelConfirm(null)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="relative w-full max-w-[480px] rounded-t-[16px] p-5 sheet-enter" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
            <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>Cancel this pool?</h3>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              This will cancel the group deal for all members. Everyone with a pending payment will be refunded. This can&apos;t be undone.
            </p>
            <div className="flex gap-2.5 mt-4">
              <button type="button" onClick={() => setCancelConfirm(null)}
                className="flex-1 h-[50px] rounded-[8px] text-[14px] font-bold cursor-pointer press-feedback"
                style={{ background: "var(--sand)", color: "var(--text)" }}>
                Keep pool
              </button>
              <button type="button" onClick={() => cancelPool(cancelConfirm)} disabled={cancelling}
                className="flex-1 h-[50px] rounded-[8px] text-[14px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
                style={{ background: "var(--coral)" }}>
                {cancelling ? "Cancelling..." : "Cancel pool"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
