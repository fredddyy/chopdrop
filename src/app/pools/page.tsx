"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface PoolItem {
  id: string;
  product: { id: string; name: string; imageUrl: string | null; groupPrice: number; retailPrice: number };
  name: string | null;
  status: string;
  minSize: number;
  memberCount: number;
  deadline: string;
  creatorName: string;
  myQuantity: number;
  myPaymentStatus: string;
}

type Tab = "active" | "history";

export default function PoolsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/pools?mine=true")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (d.success) setPools(d.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const activePools = pools.filter((p) => p.status === "OPEN" || p.status === "FILLED");
  const pastPools = pools.filter((p) => p.status === "COMPLETED" || p.status === "EXPIRED" || p.status === "CANCELLED");
  const current = tab === "active" ? activePools : pastPools;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Pools</h1>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 mb-4">
        {(["active", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="h-[34px] px-4 rounded-[8px] text-[12px] font-bold cursor-pointer"
            style={{
              background: tab === t ? "var(--dark)" : "var(--sand)",
              color: tab === t ? "white" : "var(--text-secondary)",
              transition: "background 200ms, color 200ms",
            }}
          >
            {t === "active" ? `Active${activePools.length > 0 ? ` (${activePools.length})` : ""}` : `History${pastPools.length > 0 ? ` (${pastPools.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-5 flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[80px] rounded-[8px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center pt-12 px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load pools</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Log in to see your pools, or check your connection.</p>
          <Link href="/auth?returnTo=/pools" className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>
            Log in
          </Link>
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

            return (
              <Link
                key={pool.id}
                href={`/product/${pool.product.id}`}
                className="flex gap-3 p-3 rounded-[8px] press-feedback card-enter card-enter-1"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {/* Product thumbnail */}
                <div className="w-14 h-14 rounded-[8px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                  {pool.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pool.product.imageUrl} alt={pool.product.name} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Pool info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{pool.product.name}</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {pool.name || `${pool.creatorName}'s group`} · {pool.myQuantity} {pool.myQuantity === 1 ? "item" : "items"}
                  </p>

                  {/* Progress bar */}
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

                {/* Status + price */}
                <div className="shrink-0 text-right flex flex-col justify-between">
                  <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fp(pool.product.groupPrice * pool.myQuantity)}</span>
                  {isFilled && <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>Filled!</span>}
                  {isCompleted && <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>Done</span>}
                  {isExpired && <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Expired</span>}
                  {isCancelled && <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Cancelled</span>}
                  {pool.status === "OPEN" && hoursLeft > 0 && (
                    <span className="text-[10px] font-bold" style={{ color: isHot ? "var(--coral)" : "var(--text-muted)" }}>{hoursLeft}h left</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center pt-12 px-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-[17px] font-extrabold text-center" style={{ color: "var(--text)" }}>
            {tab === "active" ? "No active pools" : "No pool history"}
          </h2>
          <p className="text-[13px] text-center mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tab === "active"
              ? "Join or start a group deal on any product. Track it here."
              : "Completed and expired pools show here."}
          </p>
          <Link href="/discover" className="mt-5 h-[44px] px-6 rounded-[8px] text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>
            Browse deals
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
