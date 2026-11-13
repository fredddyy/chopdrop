"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface ActiveOrder {
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string | null;
  restaurantBanner: string | null;
  restaurantAddress: string;
  groupOrderId: string;
  inviteCode: string;
  deadline: string;
  coordinatorName: string;
  memberCount: number;
  memberNames: string[];
  paidMemberCount: number;
  tiers: { min: number; discount: number }[];
  currentDiscount: number;
  nextTier: { min: number; discount: number } | null;
  spotsToNextTier: number;
  lowestPrice: number;
}

interface InactiveRestaurant {
  id: string;
  name: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  address: string;
  lowestPrice: number;
  lowestRetailPrice: number;
  tiers: { min: number; discount: number }[];
}

function fmt(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

function StoreImg({ src, fallback }: { src: string | null; fallback: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
        <span className="text-[28px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{fallback}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setErr(true)} />
  );
}

export default function HomePage() {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [inactiveRestaurants, setInactiveRestaurants] = useState<InactiveRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState(0);
  const [userArea, setUserArea] = useState("");
  const [userName, setUserName] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.areaName) setUserArea(p.areaName);
        if (p.name?.trim()) { setUserName(p.name.trim()); setIsReturning(true); }
      }
    } catch {}

    fetch("/api/feed")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setActiveOrders(d.data.activeOrders);
          setInactiveRestaurants(d.data.inactiveRestaurants);
          setTotalActive(d.data.totalActive);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Silent refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetch("/api/feed")
          .then(r => r.json())
          .then(d => {
            if (d.success) {
              setActiveOrders(d.data.activeOrders);
              setInactiveRestaurants(d.data.inactiveRestaurants);
              setTotalActive(d.data.totalActive);
            }
          })
          .catch(() => {});
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 px-5 pt-3 pb-2" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Chop<span style={{ color: "var(--coral)" }}>Drop</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userArea && (
              <span className="text-[11px] font-bold px-3 h-[28px] rounded-full flex items-center" style={{ background: "var(--sand)", color: "var(--text-secondary)" }}>
                {userArea}
              </span>
            )}
            <Link href="/cart" aria-label="Cart" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            </Link>
          </div>
        </div>
        {/* Search link */}
        <Link href="/search" className="mt-2.5 flex items-center h-[38px] px-3.5 rounded-[10px] gap-2" style={{ background: "var(--sand)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Search restaurants, food...</span>
        </Link>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="px-5 pt-4 space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-[16px]" style={{ height: "180px", background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      )}

      {!loading && (
        <div>
          {/* ═══ LIVE ORDERS — restaurants with active group orders ═══ */}
          {activeOrders.length > 0 && (
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--coral)" }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "var(--coral)" }} />
                </span>
                <h2 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                  Live now · {totalActive} order{totalActive !== 1 ? "s" : ""}
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                {activeOrders.map((order) => {
                  const minsLeft = Math.max(0, Math.round((new Date(order.deadline).getTime() - Date.now()) / 60000));
                  const tierLabel = order.currentDiscount > 0 ? `${order.currentDiscount}% off` : "No discount yet";
                  const maxTier = order.tiers.length > 0 ? order.tiers[order.tiers.length - 1] : null;
                  const fillPct = maxTier ? Math.min(100, Math.round((order.paidMemberCount / maxTier.min) * 100)) : 0;

                  return (
                    <Link
                      key={order.groupOrderId}
                      href={`/group/${order.inviteCode}`}
                      className="rounded-[16px] overflow-hidden press-feedback"
                      style={{ background: "var(--card)" }}
                    >
                      {/* Banner */}
                      <div className="h-[130px] relative" style={{ background: "var(--sand)" }}>
                        <StoreImg src={order.restaurantBanner || order.restaurantImage} fallback={order.restaurantName.charAt(0)} />
                        {/* Restaurant avatar */}
                        {order.restaurantImage && (
                          <div className="absolute bottom-3 left-3 w-[40px] h-[40px] rounded-full overflow-hidden" style={{ border: "3px solid white" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={order.restaurantImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Tier badge */}
                        {order.currentDiscount > 0 && (
                          <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2 py-1 rounded-[8px] text-white" style={{ background: "var(--emerald)" }}>
                            {order.currentDiscount}% off
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="text-[16px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{order.restaurantName}</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{order.restaurantAddress}</p>

                        {/* Avatars + member count */}
                        <div className="flex items-center gap-2.5 mt-3">
                          <div className="flex -space-x-2">
                            {order.memberNames.slice(0, 4).map((name, i) => (
                              <div key={i} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: ["var(--coral)", "var(--emerald)", "#D4A24E", "#6366F1", "#EC4899"][i % 5], border: "2px solid white" }}>
                                {name.charAt(0)}
                              </div>
                            ))}
                            {order.memberCount > 4 && (
                              <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "var(--sand)", color: "var(--text-muted)", border: "2px solid white" }}>
                                +{order.memberCount - 4}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[12px] font-bold" style={{ color: "var(--text)" }}>
                              {order.memberCount} {order.memberCount === 1 ? "person" : "people"} ordering
                            </p>
                            {order.memberCount === 1 && (
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{order.coordinatorName} started this</p>
                            )}
                          </div>
                        </div>

                        {/* Tier progress */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(fillPct, 3)}%`, background: order.currentDiscount > 0 ? "var(--emerald)" : "var(--coral)" }} />
                          </div>
                          <span className="text-[10px] font-bold shrink-0" style={{ color: order.currentDiscount > 0 ? "var(--emerald)" : "var(--text-muted)" }}>
                            {tierLabel}
                          </span>
                        </div>
                        {order.nextTier && (
                          <p className="text-[10px] font-bold mt-1" style={{ color: "var(--coral)" }}>
                            {order.spotsToNextTier} more {order.spotsToNextTier === 1 ? "person" : "people"} to unlock {order.nextTier.discount}% off
                          </p>
                        )}

                        {/* Countdown + CTA row */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>
                            {minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m left` : `${minsLeft}m left`}
                          </span>
                          <span className="h-[34px] px-5 rounded-[10px] flex items-center justify-center text-[12px] font-bold text-white" style={{ background: "var(--coral)" }}>
                            Join this order
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ COLD START — social proof + zero-risk + price stories ═══ */}
          {activeOrders.length === 0 && inactiveRestaurants.length > 0 && (
            <div className="px-5 pt-4">
              {/* Returning user greeting */}
              {isReturning ? (
                <div className="mb-4">
                  <h2 className="text-[20px] font-extrabold leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                    Hey {userName.split(" ")[0]}, ready<br />to order?
                  </h2>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Pick a restaurant and share with your people. More join, everyone saves.
                  </p>
                </div>
              ) : (
                /* First-time user — social proof, not explanation */
                <div className="mb-4">
                  <h2 className="text-[20px] font-extrabold leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                    Lunch is cheaper<br />when you order together.
                  </h2>
                  <p className="text-[12px] mt-1 leading-[155%]" style={{ color: "var(--text-muted)" }}>
                    Pick a restaurant. Share with friends. Everyone&apos;s bill drops up to 30%. No one joins? You still eat at regular price. No extra cost.
                  </p>
                </div>
              )}

              {/* Restaurant cards — price story + low-commitment CTA */}
              <div className="flex flex-col gap-3">
                {inactiveRestaurants.map((r) => {
                  const bestTier = r.tiers.length > 0 ? r.tiers[r.tiers.length - 1] : null;
                  const groupPrice = bestTier && r.lowestRetailPrice > 0
                    ? Math.round(r.lowestRetailPrice * (1 - bestTier.discount / 100))
                    : 0;
                  return (
                    <Link key={r.id} href={`/store/${r.id}`} aria-label={`Browse ${r.name} menu`} className="rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
                      {/* Banner with name overlay */}
                      <div className="p-2 pb-0">
                        <div className="h-[100px] relative rounded-[12px] overflow-hidden" style={{ background: "var(--sand)" }}>
                          <StoreImg src={r.bannerUrl || r.imageUrl} fallback={r.name.charAt(0)} />
                          <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "rgba(28,28,30,0.7)" }}>
                            <h3 className="text-[14px] font-extrabold text-white truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{r.name}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 pt-2.5">
                        {/* Price story — solo vs group (concrete naira, not abstract %) */}
                        {r.lowestRetailPrice > 0 && groupPrice > 0 && groupPrice < r.lowestRetailPrice ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-[17px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>{fmt(groupPrice)}</span>
                            <span className="text-[12px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(r.lowestRetailPrice)}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>with {bestTier?.min}+ people</span>
                          </div>
                        ) : r.lowestPrice > 0 ? (
                          <p className="text-[16px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>From {fmt(r.lowestPrice)}</p>
                        ) : null}
                        {/* Tier chips */}
                        {r.tiers.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            {r.tiers.map((t, i) => (
                              <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-[8px]"
                                style={{
                                  background: i === r.tiers.length - 1 ? "var(--emerald)" : "var(--emerald-soft)",
                                  color: i === r.tiers.length - 1 ? "white" : "var(--emerald)",
                                }}>
                                {t.min}+ = {t.discount}% off
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Ghost avatars — seats waiting to be filled */}
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="flex -space-x-1.5" aria-hidden="true">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-[22px] h-[22px] rounded-full" style={{ border: "1.5px dashed var(--border)", background: "var(--sand)" }} />
                            ))}
                          </div>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Invite friends, everyone saves</span>
                        </div>
                        {/* Low-commitment CTA — "Browse menu" not "Start order" */}
                        <div className="mt-3 h-[42px] rounded-[12px] flex items-center justify-between px-4 text-white" style={{ background: "var(--coral)" }}>
                          <span className="text-[13px] font-bold">Browse menu</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ RESTAURANTS BELOW ACTIVE ORDERS — compact grid ═══ */}
          {activeOrders.length > 0 && inactiveRestaurants.length > 0 && (
            <div className="px-5 mt-6">
              <h2 className="text-[15px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                Start a new order
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {inactiveRestaurants.map((r) => (
                  <Link key={r.id} href={`/store/${r.id}`} className="rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
                    <div className="p-1.5 pb-0">
                      <div className="h-[90px] relative rounded-[10px] overflow-hidden" style={{ background: "var(--sand)" }}>
                        <StoreImg src={r.bannerUrl || r.imageUrl} fallback={r.name.charAt(0)} />
                        {r.imageUrl && (
                          <div className="absolute bottom-1.5 left-1.5 w-[26px] h-[26px] rounded-full overflow-hidden" style={{ border: "2px solid white" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 pt-2">
                      <p className="text-[12px] font-bold truncate" style={{ color: "var(--text)" }}>{r.name}</p>
                      {r.tiers.length > 0 && (
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--emerald)" }}>Save up to {r.tiers[r.tiers.length - 1].discount}%</p>
                      )}
                      <p className="text-[10px] font-bold mt-1" style={{ color: "var(--coral)" }}>Start order →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ═══ EMPTY STATE ═══ */}
          {activeOrders.length === 0 && inactiveRestaurants.length === 0 && (
            <div className="py-20 text-center px-8">
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No restaurants yet</h2>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>We&apos;re adding restaurants in your area. Check back soon.</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
