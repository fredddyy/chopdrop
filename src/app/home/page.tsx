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
  cheapestItemName: string | null;
  hasBanner: boolean;
  rating: number;
  tiers: { min: number; discount: number }[];
  recentOrderCount: number;
  recentOrderNames: string[];
  groupDealCount: number;
  livePools: { count: number; totalMembers: number; bestFill: number; memberNames: string[] };
}

interface DealItem {
  id: string; name: string; imageUrl: string | null; retailPrice: number; groupPrice: number;
  savings: number; restaurantId: string; restaurantName: string; minPoolSize: number;
  activePool: { memberCount: number; minSize: number } | null;
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
  const [dealItems, setDealItems] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalActive, setTotalActive] = useState(0);
  const [weeklyOrderCount, setWeeklyOrderCount] = useState(0);
  const [userArea, setUserArea] = useState("");
  const [userName, setUserName] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [filter, setFilter] = useState<"all" | "deals" | "live" | "chop" | "popular">("all");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.areaName) setUserArea(p.areaName);
        if (p.name?.trim()) { setUserName(p.name.trim()); setIsReturning(true); }
      }
    } catch {}

    loadFeed();
  }, []);

  function loadFeed() {
    setLoading(true);
    setError(false);
    fetch("/api/feed")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setActiveOrders(d.data.activeOrders);
          setInactiveRestaurants(d.data.inactiveRestaurants);
          setDealItems(d.data.dealItems || []);
          setTotalActive(d.data.totalActive);
          setWeeklyOrderCount(d.data.weeklyOrderCount || 0);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

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
              setDealItems(d.data.dealItems || []);
              setTotalActive(d.data.totalActive);
              setWeeklyOrderCount(d.data.weeklyOrderCount || 0);
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
              <span className="text-[11px] font-bold pl-2.5 pr-3 h-[28px] rounded-full flex items-center gap-1" style={{ background: "var(--sand)", color: "var(--text-secondary)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--coral)" stroke="none" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
                {userArea}
              </span>
            )}
            <Link href="/cart" aria-label="Cart" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            </Link>
          </div>
        </div>
        {/* Search link */}
        <Link href="/search" className="mt-2.5 flex items-center h-[38px] px-3.5 rounded-[12px] gap-2" style={{ background: "var(--sand)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Search restaurants, food...</span>
        </Link>
        {/* Filter pills */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto hide-scrollbar">
          {([
            { key: "all", label: "All", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
            { key: "deals", label: "Group deals", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
            { key: "live", label: "Live", icon: <><span className="w-[6px] h-[6px] rounded-full shrink-0 animate-pulse" style={{ background: "var(--coral)" }} /><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></> },
            { key: "chop", label: "Free Chop", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg> },
            { key: "popular", label: "Popular", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
          ] as const).map(f => {
            const active = filter === f.key;
            return (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className="h-[34px] px-3.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 press-feedback inline-flex items-center gap-1.5"
              style={{
                background: active ? "var(--dark)" : "var(--card)",
                color: active ? "white" : "var(--text-secondary)",
                border: active ? "none" : "1px solid var(--border)",
                transition: "all 150ms ease-out",
              }}>
              {f.icon}
              {f.label}
            </button>
            );
          })}
        </div>
      </header>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="px-5 pt-4 space-y-5">
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div className="rounded-[16px]" style={{ height: "160px", background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120}ms` }} />
              <div className="pt-2.5 space-y-2">
                <div className="h-4 rounded-lg w-[55%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120 + 50}ms` }} />
                <div className="h-3 rounded-lg w-[75%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120 + 100}ms` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error + retry ── */}
      {!loading && error && (
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load restaurants</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={loadFeed} className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white cursor-pointer press-feedback" style={{ background: "var(--coral)" }}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (() => {
        const isItemView = filter === "deals" || filter === "live" || filter === "chop";
        const filteredRestaurants = inactiveRestaurants.filter(r => {
          if (filter === "all") return true;
          if (filter === "deals") return r.groupDealCount > 0;
          if (filter === "live") return r.livePools.count > 0;
          if (filter === "popular") return r.recentOrderCount > 0;
          if (filter === "chop") return r.groupDealCount > 0;
          return true;
        });
        const filteredItems = isItemView
          ? dealItems.filter(d => filter === "live" ? d.activePool !== null : true)
          : [];
        return (
        <div>
          {/* ═══ ITEM CARDS — shown when filtering by deals or live ═══ */}
          {isItemView && filteredItems.length > 0 && (
            <div className="px-5 pt-4">
              <h2 className="text-[18px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                {filter === "live" ? "Live group deals" : filter === "chop" ? "Chop to free" : "Group deals"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map(item => {
                  const poolMembers = item.activePool?.memberCount || 0;
                  const spotsLeft = item.minPoolSize - poolMembers;
                  const hasPool = item.activePool && poolMembers > 0;
                  const isChopMode = filter === "chop";
                  const chopFriendsNeeded = Math.ceil(item.retailPrice / 10000); // each friend chops ₦100
                  return (
                  <Link key={item.id} href={`/product/${item.id}`} className="press-feedback block rounded-[16px] overflow-hidden" style={{ background: "var(--card)", borderBottom: isChopMode ? "2px solid var(--gold)" : "2px solid var(--coral)" }}>
                    {/* Image */}
                    <div className="relative" style={{ aspectRatio: "4/3", background: "var(--sand)" }}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[24px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{item.name.charAt(0)}</span>
                        </div>
                      )}
                      {/* Ribbon — top left */}
                      {isChopMode ? (
                        <div className="absolute top-0 left-0 px-2.5 py-1 text-[10px] font-extrabold text-white" style={{ background: "var(--coral)", borderRadius: "0 0 12px 0" }}>
                          Chop to FREE
                        </div>
                      ) : (
                        <div className="absolute top-0 left-0 px-2.5 py-1 text-[10px] font-extrabold text-white" style={{ background: "var(--emerald)", borderRadius: "0 0 12px 0" }}>
                          -{item.savings}%
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="px-3 pt-2.5 pb-3">
                      <p className="text-[12px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{item.restaurantName}</p>
                      {/* Price */}
                      {isChopMode ? (
                        <div className="mt-1.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[18px] font-extrabold leading-none line-through tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-muted)" }}>{fmt(item.retailPrice)}</span>
                            <span className="text-[14px] font-extrabold leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>FREE</span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>if {chopFriendsNeeded} friends chop</p>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(item.groupPrice)}</span>
                          <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(item.retailPrice)}</span>
                        </div>
                      )}
                      {/* Bottom — progress bar or chop CTA */}
                      <div className="mt-2">
                        {isChopMode ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>
                              Share to chop
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                          </div>
                        ) : (
                          <>
                            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                              <div className="h-full rounded-full" style={{ width: `${hasPool ? Math.round((poolMembers / item.minPoolSize) * 100) : 0}%`, background: "var(--emerald)", transition: "width 0.5s ease" }} />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] font-bold" style={{ color: hasPool ? "var(--emerald)" : "var(--coral)" }}>
                                {hasPool ? `${poolMembers} joined` : `Need ${spotsLeft} people`}
                              </span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          )}
          {/* ═══ LIVE ORDERS — restaurants with active group orders ═══ */}
          {!isItemView && activeOrders.length > 0 && (
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
                          <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2 py-1 rounded-lg text-white" style={{ background: "var(--emerald)" }}>
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
                          <span className="h-[34px] px-5 rounded-[12px] flex items-center justify-center text-[12px] font-bold text-white" style={{ background: "var(--coral)" }}>
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
          {!isItemView && activeOrders.length === 0 && inactiveRestaurants.length > 0 && (
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

              {/* Chop to Free promo card */}
              {dealItems.length > 0 && filter === "all" && (
                <button type="button" onClick={() => setFilter("chop")} className="rounded-[16px] overflow-hidden p-4 text-left press-feedback mb-1" style={{ background: "var(--dark)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Free Chop</p>
                      <h3 className="text-[17px] font-extrabold text-white mt-1 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        Share with friends.<br />They chop. You eat free.
                      </h3>
                      <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {dealItems.length} items available to chop to ₦0
                      </p>
                    </div>
                    <div className="flex -space-x-2 shrink-0 ml-3">
                      {dealItems.slice(0, 3).map((d, i) => (
                        d.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={d.imageUrl} alt="" className="w-[40px] h-[40px] rounded-full object-cover" style={{ border: "2px solid var(--dark)" }} />
                        ) : (
                          <div key={i} className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: "var(--coral)", color: "white", border: "2px solid var(--dark)" }}>{d.name.charAt(0)}</div>
                        )
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>See chop deals</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </button>
              )}

              {/* Restaurant cards — Chowdeck DNA + group buying identity */}
              <div className="flex flex-col gap-4">
                {filteredRestaurants.map((r, idx) => {
                  const bestTier = r.tiers.length > 0 ? r.tiers[r.tiers.length - 1] : null;
                  const fallbackColors = ["#C4572A", "#1A7D4B", "#6366F1", "#D4A24E", "#EC4899", "#0EA5E9"];
                  const fallbackBg = fallbackColors[idx % fallbackColors.length];
                  return (
                    <Link key={r.id} href={`/store/${r.id}`} aria-label={`Browse ${r.name} menu`} className="press-feedback block">
                      {/* Banner — food photo with logo overlay + discount badge */}
                      <div className="relative rounded-[16px] overflow-hidden" style={{ height: r.hasBanner ? "160px" : "100px", background: r.hasBanner ? "var(--sand)" : fallbackBg }}>
                        {r.hasBanner ? (
                          <StoreImg src={r.bannerUrl} fallback={r.name.charAt(0)} />
                        ) : r.imageUrl ? (
                          /* Colored bg with centered logo for no-banner restaurants */
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-[56px] h-[56px] rounded-full overflow-hidden" style={{ border: "3px solid rgba(255,255,255,0.3)" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[32px] font-extrabold text-white" style={{ opacity: 0.4 }}>{r.name.charAt(0)}</span>
                          </div>
                        )}
                        {/* Logo overlay — bottom left on banner images */}
                        {r.hasBanner && r.imageUrl && (
                          <div className="absolute bottom-3 left-3 w-[40px] h-[40px] rounded-full overflow-hidden" style={{ border: "3px solid white" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Discount badge — on banner */}
                        {bestTier && (
                          <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-lg text-white" style={{ background: "var(--coral)" }}>
                            Up to {bestTier.discount}% off
                          </span>
                        )}
                        {/* Group deals count — on banner */}
                        {r.groupDealCount > 0 && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-white" style={{ background: "rgba(0,0,0,0.7)" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            {r.groupDealCount} {r.groupDealCount === 1 ? "deal" : "deals"}
                          </span>
                        )}
                      </div>

                      {/* Info — below banner, no card wrapper needed */}
                      <div className="pt-2.5 pb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{r.name}</h3>
                          {r.livePools.count > 0 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 shrink-0" style={{ background: "var(--coral)", color: "white" }}>
                              <div className="flex -space-x-1">
                                {r.livePools.memberNames.slice(0, 3).map((name, i) => (
                                  <div key={i} className="w-[14px] h-[14px] rounded-full flex items-center justify-center text-[6px] font-bold" style={{ background: ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.15)"][i], color: "white", border: "1px solid var(--coral)" }}>
                                    {name.charAt(0)}
                                  </div>
                                ))}
                              </div>
                              {r.livePools.count} active {r.livePools.count === 1 ? "group" : "groups"} · {r.livePools.totalMembers} {r.livePools.totalMembers === 1 ? "person" : "people"} in
                            </span>
                          )}
                        </div>
                        {/* Delivery metadata row */}
                        <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {r.lowestPrice > 0 && (
                            <>
                              <span className="font-bold" style={{ color: "var(--text)" }}>From {fmt(r.lowestPrice)}</span>
                              <span>·</span>
                            </>
                          )}
                          {r.rating > 0 && (
                            <>
                              <span style={{ color: "var(--emerald)" }}>★ {r.rating.toFixed(1)}</span>
                              <span>·</span>
                            </>
                          )}
                          <span>{r.cheapestItemName || r.address.split(",")[0]}</span>
                        </div>
                        {/* Social proof — recent activity on this restaurant */}
                        {r.recentOrderCount > 0 ? (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex -space-x-1.5" aria-hidden="true">
                              {r.recentOrderNames.slice(0, 3).map((name, i) => (
                                <div key={i} className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: ["var(--coral)", "var(--emerald)", "#D4A24E"][i % 3], border: "1.5px solid white" }}>
                                  {name.charAt(0)}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>
                              {r.recentOrderCount} {r.recentOrderCount === 1 ? "order" : "orders"} this week
                            </span>
                          </div>
                        ) : (
                          /* No recent orders — show tier chips or generic group line */
                          r.tiers.length > 0 ? (
                            <div className="flex items-center gap-1.5 mt-2">
                              {r.tiers.map((t, i) => (
                                <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                                  style={{
                                    background: i === r.tiers.length - 1 ? "var(--emerald)" : "var(--emerald-soft)",
                                    color: i === r.tiers.length - 1 ? "white" : "var(--emerald)",
                                  }}>
                                  {t.min}+ = {t.discount}%
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] font-bold mt-1.5" style={{ color: "var(--emerald)" }}>
                              Save up to 30% with group orders
                            </p>
                          )
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ RESTAURANTS BELOW ACTIVE ORDERS — compact grid ═══ */}
          {!isItemView && activeOrders.length > 0 && inactiveRestaurants.length > 0 && (
            <div className="px-5 mt-6">
              <h2 className="text-[15px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                Start a new order
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredRestaurants.map((r) => (
                  <Link key={r.id} href={`/store/${r.id}`} className="rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="p-1.5 pb-0">
                      <div className="h-[90px] relative rounded-[12px] overflow-hidden" style={{ background: "var(--sand)" }}>
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
        );
      })()}

      <BottomNav />
    </main>
  );
}
