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
  begCode: string | null;
  begDiscount: number;
}

type Tab = "pools" | "members" | "activity";

export default function PoolsPage() {
  const [tab, setTab] = useState<Tab>("pools");
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [userName, setUserName] = useState("");
  const [userArea, setUserArea] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.name) setUserName(p.name);
        if (p.areaName) setUserArea(p.areaName);
      }
    } catch {}
    loadPools();
  }, []);

  function loadPools() {
    setLoading(true);
    fetch("/api/pools?mine=true")
      .then((r) => {
        if (r.status === 401) { setAuthError(true); setLoading(false); return null; }
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => { if (d?.success) setPools(d.data); if (d) setLoading(false); })
      .catch(() => setLoading(false));
  }

  const activePools = pools.filter((p) => p.status === "OPEN" || p.status === "FILLED");
  const totalSaved = pools.reduce((sum, p) => sum + ((p.product.retailPrice - p.product.groupPrice) * p.myQuantity), 0);

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Pools</p>
          <h1 className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Your food people</h1>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Location ── */}
      {userArea && (
        <div className="px-5 mt-2">
          <span className="text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: "#17271F", color: "white" }}>{userArea}</span>
        </div>
      )}

      {loading ? (
        <div className="px-5 pt-8 space-y-4" aria-busy="true">
          <div className="h-[90px] rounded-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-[120px] rounded-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "150ms" }} />
        </div>
      ) : authError ? (
        <div className="flex flex-col items-center pt-16 px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "#17271F" }}>Log in to see your pools</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Your active deals and savings appear here.</p>
          <Link href="/auth?returnTo=/pools" className="h-[50px] px-6 rounded-full text-[14px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Log in</Link>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="px-5 mt-4 flex">
            {(["pools", "members", "activity"] as Tab[]).map((t) => (
              <button
                key={t} type="button" onClick={() => setTab(t)}
                className="flex-1 h-[40px] text-[13px] font-bold cursor-pointer rounded-full"
                style={{
                  background: tab === t ? "#17271F" : "transparent",
                  color: tab === t ? "white" : "var(--text-muted)",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "pools" && (
            <>
              {/* ── Stats card ── */}
              <div className="px-5 mt-4">
                <div className="p-5 rounded-[22px] flex items-center justify-between" style={{ background: "var(--lime)" }}>
                  <div>
                    <p className="text-[28px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1px", color: "#17271F" }}>{fp(totalSaved)}</p>
                    <p className="text-[11px] font-semibold mt-1" style={{ color: "#17271F", opacity: 0.6 }}>saved together</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[28px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1px", color: "#17271F" }}>{pools.length}</p>
                    <p className="text-[11px] font-semibold mt-1" style={{ color: "#17271F", opacity: 0.6 }}>pools joined</p>
                  </div>
                </div>
              </div>

              {/* ── Active pools ── */}
              <div className="px-5 mt-5 flex items-center justify-between">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>On the table</h3>
                <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{activePools.length} active</span>
              </div>

              {activePools.length > 0 ? (
                <div className="px-5 mt-3 flex flex-col gap-4">
                  {activePools.map((pool) => {
                    const fillPct = Math.round((pool.memberCount / pool.minSize) * 100);
                    const minutesLeft = Math.max(0, Math.round((new Date(pool.deadline).getTime() - Date.now()) / 60000));
                    const isPaid = pool.myPaymentStatus === "SUCCESS";
                    return (
                      <Link
                        key={pool.id}
                        href={`/product/${pool.product.id}?pool=${pool.id}`}
                        className="block p-4 rounded-[22px] press-feedback"
                        style={{ background: "var(--card)" }}
                      >
                        {/* Product row */}
                        <div className="flex items-start gap-3">
                          <div className="w-[70px] h-[70px] rounded-[16px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                            {pool.product.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={pool.product.imageUrl} alt={pool.product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isPaid && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full inline-block mb-1" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>Paid</span>
                            )}
                            <h4 className="text-[17px] font-extrabold leading-[145%] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{pool.product.name}</h4>
                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{pool.creatorName}{pool.areaName ? ` · ${pool.areaName}` : ""}</p>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="mt-2">
                          <span className="text-[20px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "var(--coral)" }}>{fp(pool.product.groupPrice)}</span>
                          <span className="text-[12px] line-through tabular-nums ml-2" style={{ color: "var(--text-muted)" }}>{fp(pool.product.retailPrice)}</span>
                        </div>
                        {/* Progress — full width */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[12px] font-extrabold" style={{ color: "#17271F" }}>
                            <span>{pool.memberCount}/{pool.minSize} plates claimed</span>
                            <span style={{ color: "var(--coral)" }}>{minutesLeft > 60 ? `${Math.floor(minutesLeft / 60)}h left` : `${minutesLeft}m left`}</span>
                          </div>
                          <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
                            <div className="h-full" style={{ width: `${fillPct}%`, background: "var(--coral)", borderRadius: "9px" }} />
                          </div>
                        </div>
                        {/* Beg price link */}
                        {pool.begCode && (
                          <a
                            href={`/beg/${pool.begCode}`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 h-9 px-4 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 press-feedback"
                            style={{ background: "var(--lime)", color: "#17271F" }}
                          >
                            {pool.begDiscount > 0 ? `${fp(pool.begDiscount)} saved via beg price` : "Beg price \u2014 share to save more"}
                          </a>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 mt-6 text-center">
                  <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>No active pools. Join one from Discover.</p>
                </div>
              )}

              {/* ── Start a pool CTA ── */}
              <div className="px-5 mt-5">
                <Link
                  href="/discover"
                  className="flex items-center gap-3 p-5 rounded-[22px] press-feedback"
                  style={{ background: "var(--lime)" }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#17271F" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Start a pool</p>
                    <p className="text-[12px]" style={{ color: "#17271F", opacity: 0.6 }}>Find a deal and bring your people along.</p>
                  </div>
                </Link>
              </div>
            </>
          )}

          {tab === "members" && (
            <div className="px-5 mt-8 text-center">
              <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>Crews coming soon. For now, share pool links with friends on WhatsApp.</p>
            </div>
          )}

          {tab === "activity" && (
            <div className="px-5 mt-8 text-center">
              <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>Pool activity feed coming soon.</p>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </main>
  );
}
