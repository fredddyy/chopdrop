"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface PoolOrder {
  id: string;
  status: string;
  minSize: number;
  memberCount: number;
  deadline: string;
  myPaymentStatus: string;
  creatorName: string;
  product: { id: string; name: string; imageUrl: string | null; groupPrice: number; retailPrice: number; vendor?: { name: string } };
}

interface GroupOrderItem {
  id: string;
  status: string;
  deadline: string;
  deliveryAddress: string;
  deliveryFee: number;
  inviteCode: string;
  restaurantName: string;
  memberCount: number;
  mySubtotal: number;
  myPaymentStatus: string;
}

type Tab = "active" | "history";

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [pools, setPools] = useState<PoolOrder[]>([]);
  const [groupOrders, setGroupOrders] = useState<GroupOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pools?mine=true").then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/group-orders?mine=true").then((r) => r.ok ? r.json() : { success: false }).catch(() => ({ success: false })),
    ]).then(([poolData, goData]) => {
      if (poolData.success) setPools(poolData.data);
      if (goData.success) setGroupOrders(goData.data || []);
      setLoading(false);
    });
  }, []);

  const activePools = pools.filter((p) => p.status === "OPEN" || p.status === "FILLED");
  const pastPools = pools.filter((p) => p.status === "COMPLETED" || p.status === "EXPIRED" || p.status === "CANCELLED");
  const activeGroupOrders = groupOrders.filter((g) => g.status === "OPEN" || g.status === "CLOSED" || g.status === "ORDERED" || g.status === "READY");
  const pastGroupOrders = groupOrders.filter((g) => g.status === "DELIVERED" || g.status === "CANCELLED");
  const totalActive = activePools.length + activeGroupOrders.length;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Activity</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#1C1C1E", fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Activity</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-4 flex">
        {([
          ["active", `Active${totalActive > 0 ? ` · ${totalActive}` : ""}`],
          ["history", "History"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key as Tab)}
            className="flex-1 h-[40px] text-[13px] font-bold cursor-pointer rounded-full"
            style={{ background: tab === key ? "#1C1C1E" : "transparent", color: tab === key ? "white" : "var(--text-muted)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ ACTIVE TAB ═══ */}
      {tab === "active" && (
        <div className="px-5 mt-4">
          {loading ? (
            <div className="py-8 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-[120px] rounded-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : totalActive === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
              </div>
              <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>No active orders</h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Join a pool or order solo — your active orders will appear here.</p>
              <Link href="/discover" className="h-[40px] px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center mt-4 press-feedback" style={{ background: "var(--coral)" }}>Browse deals</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activePools.map((pool) => {
                const spotsLeft = pool.minSize - pool.memberCount;
                const fillPct = Math.round((pool.memberCount / pool.minSize) * 100);
                const minsLeft = Math.max(0, Math.round((new Date(pool.deadline).getTime() - Date.now()) / 60000));
                return (
                  <div key={pool.id} className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
                    {/* Header: pill + timestamp */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: pool.status === "FILLED" ? "var(--emerald-soft)" : "var(--coral-soft)", color: pool.status === "FILLED" ? "var(--emerald)" : "var(--coral)" }}>
                        {pool.status === "FILLED" ? "Filled · Cooking" : "Pool · Filling"}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Today · {new Date(pool.deadline).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: false })}</span>
                    </div>
                    {/* Product: image + name + vendor + price */}
                    <div className="flex items-start gap-3">
                      <div className="w-[60px] h-[60px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                        {pool.product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pool.product.imageUrl} alt={pool.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[18px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{pool.product.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[17px] font-extrabold leading-[145%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{pool.product.name}</h4>
                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{pool.product.vendor?.name || "Restaurant"} · ★ 4.9</p>
                        <p className="text-[20px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#1C1C1E" }}>{fp(pool.product.groupPrice)}</p>
                      </div>
                    </div>
                    {/* Filling progress */}
                    {pool.status === "OPEN" && (
                      <>
                        <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold" style={{ color: "#1C1C1E" }}>
                          <span>Filling — {pool.memberCount}/{pool.minSize}</span>
                          <span style={{ color: "var(--coral)" }}>{minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m left` : `${minsLeft}m left`}</span>
                        </div>
                        <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
                          <div className="h-full" style={{ width: `${fillPct}%`, background: "var(--emerald)", borderRadius: "9px" }} />
                        </div>
                        <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>
                          You&apos;re paid in. {spotsLeft === 1 ? "One more person to fill the pool." : `${spotsLeft} more to fill the pool.`}
                        </p>
                        <button className="mt-2 text-[12px] font-bold cursor-pointer" style={{ color: "var(--coral)" }} onClick={() => { if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title: "ChopDrop pool", text: `${pool.product.name} for ${fp(pool.product.groupPrice)}. We need ${spotsLeft} more or nobody eats!`, url: `${window.location.origin}/product/${pool.product.id}` }).catch(() => {}); }}>
                          Share to fill the pool →
                        </button>
                      </>
                    )}
                    {pool.status === "FILLED" && (
                      <p className="text-[12px] mt-3" style={{ color: "var(--text-muted)" }}>{pool.memberCount}/{pool.minSize} confirmed. Vendor is cooking. We&apos;ll notify you when ready.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Group orders */}
          {activeGroupOrders.length > 0 && (
            <div className="flex flex-col gap-3 mt-3">
              {activeGroupOrders.map((go) => {
                const minsLeft = Math.max(0, Math.round((new Date(go.deadline).getTime() - Date.now()) / 60000));
                return (
                  <Link key={go.id} href={`/group/${go.inviteCode}`} className="p-4 rounded-[22px] press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "#FEF2F0", color: "var(--coral)" }}>
                        Group order · {go.status === "OPEN" ? "Ordering" : go.status}
                      </span>
                      {go.status === "OPEN" && <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>{minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft}m left`}</span>}
                    </div>
                    <h4 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{go.restaurantName}</h4>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{go.memberCount} people · {go.deliveryAddress}</p>
                    {go.mySubtotal > 0 && (
                      <p className="text-[12px] font-bold mt-1" style={{ color: "#1C1C1E" }}>Your items: {fp(go.mySubtotal)} · {go.myPaymentStatus === "SUCCESS" ? "Paid ✓" : "Unpaid"}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === "history" && (
        <div className="px-5 mt-4">
          {loading ? (
            <div className="py-8 space-y-3">
              <div className="h-[80px] rounded-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          ) : pastPools.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
              <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>No past orders yet</h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Completed and refunded orders will show here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pastPools.map((pool) => (
                <div key={pool.id} className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-[48px] h-[48px] rounded-[10px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                      {pool.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pool.product.imageUrl} alt={pool.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[14px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{pool.product.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold truncate" style={{ color: "#1C1C1E" }}>{pool.product.name}</h4>
                      <p className="text-[13px] font-extrabold tabular-nums" style={{ color: "#1C1C1E" }}>{fp(pool.product.groupPrice)}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{
                        background: pool.status === "COMPLETED" ? "var(--emerald-soft)" : pool.status === "EXPIRED" ? "var(--coral-soft)" : "var(--sand)",
                        color: pool.status === "COMPLETED" ? "var(--emerald)" : pool.status === "EXPIRED" ? "var(--coral)" : "var(--text-muted)",
                      }}>
                        {pool.status === "COMPLETED" ? "Completed" : pool.status === "EXPIRED" ? "Expired · Refunded" : "Cancelled"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
