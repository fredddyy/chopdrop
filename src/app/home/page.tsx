"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  groupTarget: number;
  groupDiscount: number;
  livePools: { count: number; totalMembers: number; totalSize: number; bestFill: number; memberNames: string[]; memberAvatars: string[]; pools: Array<{ minSize: number; memberCount: number; memberNames: string[]; memberAvatars: string[]; deadline: string }>; earliestDeadline: string | null };
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

function ChopCountdownBar({ productId }: { productId: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    let code: string | null = null;
    try {
      const saved = localStorage.getItem("chopdrop-chop-codes");
      if (saved) { const codes = JSON.parse(saved); code = codes[productId] || null; }
    } catch {}
    if (!code) return;
    fetch(`/api/chop/${code}`).then(r => r.json()).then(d => {
      if (d.success && d.data?.expiresAt) {
        const deadline = new Date(d.data.expiresAt).getTime();
        const tick = () => setLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
      }
    }).catch(() => {});
  }, [productId]);
  if (left <= 0) return null;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const display = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return (
    <div className="absolute bottom-0 left-0 right-0 py-1 flex items-center justify-center gap-1" style={{ background: "rgba(0,0,0,0.65)" }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
      <span className="text-[8px] font-bold text-white tabular-nums">{display}</span>
    </div>
  );
}

function MiniCountdown({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const iv = setInterval(() => setLeft(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(iv);
  }, [deadline]);
  if (left <= 0) return <span style={{ color: "var(--coral)" }}>expired</span>;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const urgent = left < 600;
  return (
    <span className="text-[8px] font-medium tabular-nums inline-flex items-center gap-0.5" style={{ color: urgent ? "var(--coral)" : "var(--text-muted)", animation: urgent ? "pulse 1.5s ease-in-out infinite" : "none" }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
      {h > 0 ? `${h}h${m}m` : `${m}m`}
    </span>
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
  const [activeCategory, setActiveCategory] = useState("Food");
  const [categories, setCategories] = useState<Array<{ name: string; imageUrl: string | null }>>([]);
  const [groceryItems, setGroceryItems] = useState<Array<{ id: string; name: string; description: string | null; imageUrl: string | null; subcategory: string | null; retailPrice: number; groupPrice: number; vendorId: string; vendorName: string }>>([]);
  const [grocerySubcategories, setGrocerySubcategories] = useState<string[]>([]);
  const [groceryStores, setGroceryStores] = useState<Array<{ id: string; name: string; imageUrl: string | null; bannerUrl: string | null; address: string; itemCount: number }>>([]);
  const [activeSubcategory, setActiveSubcategory] = useState("Stores");
  const touchStartX = useRef(0);
  const swipeCategory = useCallback((direction: "left" | "right") => {
    setActiveCategory(prev => {
      const catList = categories.length > 0 ? categories.map(c => c.name) : ["Food", "Groceries", "Gadgets", "Fashion", "Home"];
      const idx = catList.indexOf(prev);
      const next = direction === "left" ? Math.min(idx + 1, catList.length - 1) : Math.max(idx - 1, 0);
      return catList[next];
    });
  }, [categories]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [filter, setFilter] = useState<"all" | "deals">("all");
  const [locationSheet, setLocationSheet] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const hasAddress = !!(deliveryAddress || userArea);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.areaName) setUserArea(p.areaName);
        if (p.name?.trim()) { setUserName(p.name.trim()); setIsReturning(true); }
        if (p.deliveryAddress?.trim()) setDeliveryAddress(p.deliveryAddress.trim());
      }
      const dismissed = localStorage.getItem("chopdrop-location-prompt-dismissed");
      if (dismissed) setPromptDismissed(true);
    } catch {}

    loadFeed();
    fetch("/api/categories").then(r => r.json()).then(d => { if (d.success) setCategories(d.data); }).catch(() => {});
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.success && d.data) {
        if (d.data.avatarUrl) setUserAvatar(d.data.avatarUrl);
        if (d.data.name?.trim() && !userName) { setUserName(d.data.name.trim()); setIsReturning(true); }
      }
    }).catch(() => {});
  }, []);

  // Reload feed when category changes
  useEffect(() => { loadFeed(activeCategory); }, [activeCategory]);

  // Fetch grocery items when Groceries category is active
  useEffect(() => {
    if (activeCategory !== "Groceries") return;
    fetch("/api/grocery-items").then(r => r.json()).then(d => {
      if (d.success) {
        setGroceryItems(d.data.products);
        setGrocerySubcategories(d.data.subcategories);
        setGroceryStores(d.data.stores || []);
        setActiveSubcategory("Stores");
      }
    }).catch(() => {});
  }, [activeCategory]);

  function saveLocation(address: string, area?: string) {
    setDeliveryAddress(address);
    if (area) setUserArea(area);
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      const profile = stored ? JSON.parse(stored) : {};
      localStorage.setItem("chopdrop-customer", JSON.stringify({ ...profile, deliveryAddress: address, areaName: area || profile.areaName }));
    } catch {}
    setLocationSheet(false);
    setLocationInput("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const addr = data.display_name?.split(",").slice(0, 3).join(",") || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          const area = data.address?.suburb || data.address?.city_district || data.address?.city || "";
          saveLocation(addr, area);
          // Also save coordinates
          try {
            const stored = localStorage.getItem("chopdrop-customer");
            const profile = stored ? JSON.parse(stored) : {};
            localStorage.setItem("chopdrop-customer", JSON.stringify({ ...profile, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
          } catch {}
        } catch { saveLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`); }
        setLocating(false);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function dismissPrompt() {
    setPromptDismissed(true);
    try { localStorage.setItem("chopdrop-location-prompt-dismissed", "1"); } catch {}
  }

  function loadFeed(cat?: string) {
    const c = cat ?? activeCategory;
    setLoading(true);
    setError(false);
    fetch(`/api/feed${c ? `?category=${encodeURIComponent(c)}` : ""}`)
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
        fetch(`/api/feed${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ""}`)
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
      <header className="px-5 pt-3 pb-2">
        {/* Top row — avatar + greeting + cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/account" className="shrink-0 press-feedback">
              <div className="w-[44px] h-[44px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: "var(--sand)", border: "2px solid var(--border)" }}>
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[18px] font-bold" style={{ color: "var(--text-muted)" }}>{userName ? userName.charAt(0).toUpperCase() : "?"}</span>
                )}
              </div>
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Hey,</p>
              <p className="text-[20px] font-extrabold leading-tight truncate tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{userName.split(" ")[0] || "there"}.</p>
            </div>
          </div>
          <Link href="/cart" aria-label="Cart" className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </Link>
        </div>

        {/* Top tabs — Stores / Deals — with underline on active */}
        <div className="flex gap-6 mt-5">
          {(["all", "deals"] as const).map(key => {
            const active = filter === key;
            const label = key === "all" ? "STORES" : "DEALS";
            return (
              <button key={key} type="button" onClick={() => setFilter(key)}
                className="text-[13px] tracking-[0.06em] press-feedback pb-2"
                style={{
                  fontWeight: active ? 800 : 500,
                  color: active ? "var(--text)" : "var(--text-muted)",
                  borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
                  transition: "color 200ms ease-out, border-color 200ms ease-out",
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <Link href="/search" className="mt-3 flex items-center h-[42px] px-4 rounded-[12px] gap-2.5" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>Search restaurants, food...</span>
        </Link>

        {/* Location prompt — shows when no address saved */}
        {!hasAddress && !promptDismissed && (
          <div className="mt-3 rounded-[16px] p-4 card-enter" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral-soft)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--coral)" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Where should we deliver?</p>
                  <p className="text-[12px] mt-0.5 leading-[150%]" style={{ color: "var(--text-muted)" }}>Enter your address to see restaurants and delivery times near you.</p>
                </div>
              </div>
              <button type="button" onClick={dismissPrompt} className="shrink-0 p-1 press-feedback" aria-label="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={useMyLocation}
                className="flex-1 h-[40px] rounded-[12px] flex items-center justify-center gap-1.5 text-[12px] font-bold text-white press-feedback"
                style={{ background: "var(--coral)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4m10-10h-4M6 12H2" /></svg>
                {locating ? "Finding..." : "Use my location"}
              </button>
              <button type="button" onClick={() => setLocationSheet(true)}
                className="flex-1 h-[40px] rounded-[12px] flex items-center justify-center text-[12px] font-bold press-feedback"
                style={{ background: "var(--sand)", color: "var(--text)" }}>
                Enter address
              </button>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar" style={{ touchAction: "pan-x" }}>
          {(categories.length > 0 ? categories : [
            { name: "Food", imageUrl: null },
            { name: "Groceries", imageUrl: null },
            { name: "Gadgets", imageUrl: null },
            { name: "Fashion", imageUrl: null },
            { name: "Home", imageUrl: null },
          ]).map(c => {
            const active = activeCategory === c.name;
            return (
              <button key={c.name} type="button" onClick={() => setActiveCategory(c.name)}
                className="h-[34px] px-4 rounded-full shrink-0 press-feedback text-[12px] font-semibold"
                style={{
                  background: active ? "var(--text)" : "transparent",
                  color: active ? "white" : "var(--text-secondary)",
                  border: active ? "1px solid var(--text)" : "1px solid var(--border)",
                  transition: "all 200ms ease-out",
                }}>
                {c.name}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="px-5 pt-4 space-y-5 card-enter">
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
          <h2 className="text-[16px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load restaurants</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => loadFeed()} className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white cursor-pointer press-feedback" style={{ background: "var(--coral)" }}>
            Try again
          </button>
        </div>
      )}

      {/* ═══ GROCERY GRID — shown when Groceries category active ═══ */}
      {activeCategory === "Groceries" && (groceryItems.length > 0 || groceryStores.length > 0) && (
        <div className="pt-4 pb-24"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStartX.current; if (Math.abs(dx) > 60) swipeCategory(dx < 0 ? "left" : "right"); }}>
          {/* Stores view — full-width store cards */}
          {activeSubcategory === "Stores" && groceryStores.length > 0 && (
            <div className="px-5 flex flex-col gap-4">
              {groceryStores.map(store => (
                <Link key={store.id} href={`/store/${store.id}`} className="press-feedback block">
                  <div className="relative rounded-[16px] overflow-hidden" style={{ height: store.bannerUrl ? "140px" : "90px", background: "var(--sand)" }}>
                    {store.bannerUrl ? (
                      <StoreImg src={store.bannerUrl} fallback={store.name.charAt(0)} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--emerald)" }}>
                        <span className="text-[28px] font-extrabold text-white" style={{ opacity: 0.4 }}>{store.name.charAt(0)}</span>
                      </div>
                    )}
                    {store.imageUrl && (
                      <div className="absolute bottom-3 left-3 w-[40px] h-[40px] rounded-[12px] overflow-hidden" style={{ border: "3px solid white" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={store.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[16px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{store.name}</h3>
                    <p className="text-[11px] font-bold mt-0.5" style={{ color: "var(--text-muted)" }}>{store.itemCount} items · {store.address}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Subcategory view — items grouped by store in horizontal scroll */}
          {activeSubcategory !== "Stores" && (() => {
            const filtered = groceryItems.filter(g => g.subcategory === activeSubcategory);
            const byStore = new Map<string, { name: string; id: string; items: typeof filtered }>();
            for (const item of filtered) {
              if (!byStore.has(item.vendorId)) byStore.set(item.vendorId, { name: item.vendorName, id: item.vendorId, items: [] });
              byStore.get(item.vendorId)!.items.push(item);
            }
            return (
              <div className="space-y-6">
                {Array.from(byStore.values()).map(group => (
                  <div key={group.id}>
                    <div className="px-5 flex items-center justify-between mb-2">
                      <Link href={`/store/${group.id}`} className="press-feedback">
                        <h3 className="text-[16px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{group.name}</h3>
                      </Link>
                      <Link href={`/store/${group.id}`} className="text-[11px] font-bold press-feedback" style={{ color: "var(--coral)" }}>See all →</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pl-5 pr-2">
                      {group.items.map(item => (
                        <Link key={item.id} href={`/product/${item.id}`} className="press-feedback block shrink-0" style={{ width: "140px" }}>
                          <div className="relative rounded-[12px] overflow-hidden" style={{ aspectRatio: "1", background: "var(--sand)" }}>
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[20px]" style={{ opacity: 0.3 }}>🛒</span>
                              </div>
                            )}
                          </div>
                          <div className="pt-1.5">
                            <p className="text-[12px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                            <span className="text-[14px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(item.retailPrice)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {activeCategory !== "Groceries" && !loading && !error && (() => {
        const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
        const handleTouchEnd = (e: React.TouchEvent) => {
          // Don't swipe tabs if touch was inside a horizontal scroll container
          let el = e.target as HTMLElement | null;
          while (el) {
            if (el.scrollWidth > el.clientWidth && el.classList.contains("overflow-x-auto")) return;
            el = el.parentElement;
          }
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 60) swipeCategory(dx < 0 ? "left" : "right");
        };
        const isItemView = filter === "deals";
        const filteredRestaurants = inactiveRestaurants.filter(r => {
          if (filter === "all") return true;
          if (filter === "deals") return r.groupDealCount > 0;
          return true;
        });
        const filteredItems = isItemView
          ? dealItems
          : [];
        return (
        <div key={filter} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="card-enter">
          {/* ═══ DEALS PAGE ═══ */}
          {isItemView && (
            <div className="pt-4 space-y-8 px-5 pb-6">

              {/* ── Price Chop — 2-col cards with store name + chop target ── */}
              {filteredItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                    <h3 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Price Chop</h3>
                  </div>
                  <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>Invite friends to chop the price down</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(() => {
                      // Find the single active chop product
                      let activeChopId: string | null = null;
                      try {
                        const saved = localStorage.getItem("chopdrop-chop-codes");
                        if (saved) {
                          const codes: Record<string, string> = JSON.parse(saved);
                          const itemIds = filteredItems.slice(0, 9).map(i => i.id);
                          activeChopId = itemIds.find(pid => !!codes[pid]) || null;
                        }
                      } catch {}
                      return filteredItems.slice(0, 9).map((item, idx) => {
                      const chopPrice = item.groupPrice < item.retailPrice ? item.groupPrice : Math.round(item.retailPrice * 0.7);
                      const chopPct = Math.round(((item.retailPrice - chopPrice) / item.retailPrice) * 100);
                      const isActive = activeChopId === item.id;
                      const isDormant = activeChopId !== null && !isActive;
                      return (
                      <Link key={`chop-${item.id}`} href={`/chop/product/${item.id}`} className="press-feedback block" style={{ opacity: isDormant ? 0.45 : 1, transition: "opacity 200ms ease-out" }}>
                        <div className="relative rounded-[10px] overflow-hidden" style={{ aspectRatio: "1", background: "var(--sand)" }}>
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{item.name.charAt(0)}</span>
                            </div>
                          )}
                          <span className="absolute top-1.5 left-1.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full text-white" style={{ background: isActive ? "var(--emerald)" : "var(--coral)" }}>
                            {isActive ? "ACTIVE" : `-${chopPct}%`}
                          </span>
                          {isActive && <ChopCountdownBar productId={item.id} />}
                          {!isActive && !isDormant && (
                            <div className="absolute bottom-1.5 left-1.5 w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.9)" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="pt-1.5">
                          <p className="text-[11px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                          <p className="text-[9px] font-medium truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{item.restaurantName}</p>
                          <div className="flex items-baseline gap-0.5 mt-1">
                            <span className="text-[11px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(chopPrice)}</span>
                            <span className="text-[9px] font-bold line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(item.retailPrice)}</span>
                          </div>
                        </div>
                      </Link>
                      );
                    });
                    })()}
                  </div>
                </div>
              )}

              {/* ── Free Delivery ── */}
              {(() => {
                const freeDeliveryStores = inactiveRestaurants.filter(r => (r as unknown as { deliveryFee?: number }).deliveryFee === 0 || (r as unknown as { freeDeliveryMin?: number }).freeDeliveryMin === 0);
                return freeDeliveryStores.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      <h3 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Free Delivery</h3>
                    </div>
                    <div className="space-y-2">
                      {freeDeliveryStores.slice(0, 5).map(r => (
                        <Link key={r.id} href={`/store/${r.id}`} className="flex items-center gap-3 py-2.5 press-feedback" style={{ borderBottom: "1px solid var(--border)" }}>
                          <div className="w-[44px] h-[44px] rounded-[12px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                            {r.imageUrl && <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{r.name}</p>
                            <p className="text-[10px] font-medium" style={{ color: "var(--emerald)" }}>Free delivery today</p>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Empty state */}
              {filteredItems.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>No deals right now</p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Check back soon — new deals drop daily.</p>
                </div>
              )}
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
                <h2 className="text-[16px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
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
                          <div className="absolute bottom-3 left-3 w-[46px] h-[46px] rounded-[12px] overflow-hidden" style={{ border: "3px solid white" }}>
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
                              <div key={i} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: ["var(--coral)", "var(--emerald)", "#D4A24E", "#6366F1", "#EC4899"][i % 5], border: "2px solid white" }}>
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
                          <div className="absolute bottom-3 left-3 w-[46px] h-[46px] rounded-[12px] overflow-hidden" style={{ border: "3px solid white" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Discount badge — top left of banner */}
                        {r.groupDiscount > 0 && (
                          <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white" style={{ background: "var(--coral)" }}>
                            {r.groupDiscount}% off · 3+ people
                          </span>
                        )}
                        {/* Group activity — on banner */}
                        {(r.livePools.count > 0 || r.groupDealCount > 0) && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-white" style={{ background: r.livePools.count > 0 ? "var(--coral)" : "rgba(0,0,0,0.7)" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            {r.livePools.count > 0
                              ? `${r.livePools.count} ${r.livePools.count === 1 ? "group" : "groups"} buying`
                              : `${r.groupDealCount} ${r.groupDealCount === 1 ? "deal" : "deals"}`}
                          </span>
                        )}
                        {/* Pool rows — bottom-right of banner */}
                        {r.livePools.pools.length > 0 && (
                          <div className="absolute bottom-2 right-2 flex flex-col gap-0.5 items-end">
                            {r.livePools.pools.slice(0, 3).map((pool, pi) => (
                              <div key={pi} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.65)" }}>
                                <div className="flex -space-x-1">
                                  {Array.from({ length: Math.min(pool.minSize, 5) }).map((_, j) => {
                                    const filled = j < pool.memberCount;
                                    return (
                                      <div key={j} className="w-[14px] h-[14px] rounded-full flex items-center justify-center overflow-hidden"
                                        style={{ background: filled ? "var(--coral)" : "rgba(255,255,255,0.15)", border: filled ? "1px solid rgba(0,0,0,0.6)" : "1px dashed rgba(255,255,255,0.3)" }}>
                                        {filled && pool.memberAvatars[j]
                                          ? <img src={pool.memberAvatars[j]} alt="" className="w-full h-full object-cover" />
                                          : filled ? <span className="text-[5px] font-bold text-white">{pool.memberNames[j]?.charAt(0) || "!"}</span>
                                          : null}
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="text-[7px] font-bold text-white tabular-nums">{pool.memberCount}/{pool.minSize}</span>
                                <MiniCountdown deadline={pool.deadline} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info — below banner */}
                      <div className="pt-2.5 pb-1">
                        <h3 className="text-[16px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{r.name}</h3>
                        {/* Deal info — only when restaurant has a deal configured */}
                        {r.groupTarget > 0 && r.groupDiscount > 0 && (() => {
                          const spotsNeeded = r.groupTarget;
                          const discountPct = r.groupDiscount;
                          const liveMembers = r.livePools.totalMembers;
                          const liveSize = spotsNeeded;
                          const hasLive = r.livePools.count > 0;
                          return hasLive ? (
                          <p className="text-[10px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                            {discountPct}% off · {r.livePools.count} {r.livePools.count === 1 ? "group" : "groups"} active
                          </p>
                          ) : (
                          <p className="text-[10px] font-medium mt-1.5" style={{ color: "var(--text-muted)" }}>
                            {discountPct}% off with 3+ people
                          </p>
                          );
                        })()}

                        {/* Social proof — recent activity */}
                        {r.recentOrderCount > 0 && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex -space-x-1.5" aria-hidden="true">
                              {r.recentOrderNames.slice(0, 3).map((name, i) => (
                                <div key={i} className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: ["var(--coral)", "var(--emerald)", "#D4A24E"][i % 3], border: "1.5px solid white" }}>
                                  {name.charAt(0)}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                              {r.recentOrderCount} {r.recentOrderCount === 1 ? "order" : "orders"} this week
                            </span>
                          </div>
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
              <h2 className="text-[14px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
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
              <h2 className="text-[16px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No restaurants yet</h2>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>We&apos;re adding restaurants in your area. Check back soon.</p>
            </div>
          )}
        </div>
        );
      })()}

      {/* ═══ FULL-SCREEN LOCATION SHEET ═══ */}
      {locationSheet && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Set delivery address">
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setLocationSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 sheet-enter" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[428px] mx-auto rounded-t-[16px] px-5 pt-5 pb-8" style={{ background: "var(--card)", minHeight: "70vh" }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Delivery address</h2>
                <button type="button" onClick={() => setLocationSheet(false)} className="w-8 h-8 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Use my location */}
              <button type="button" onClick={useMyLocation} disabled={locating}
                className="w-full h-[48px] rounded-[12px] flex items-center gap-3 px-4 press-feedback mb-4 disabled:opacity-50"
                style={{ background: "var(--coral-soft)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4m10-10h-4M6 12H2" /></svg>
                <span className="text-[14px] font-bold" style={{ color: "var(--coral)" }}>{locating ? "Finding your location..." : "Use my current location"}</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>or enter address</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>

              {/* Address input */}
              <div className="relative mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Search for an address..."
                  autoFocus
                  className="w-full h-[48px] pl-11 pr-4 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                  style={{ background: "var(--sand)", color: "var(--text)" }}
                />
              </div>

              {/* Popular areas */}
              <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-muted)" }}>Popular areas</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Victoria Island", "Lekki", "Ikeja", "Yaba", "Maryland", "Surulere", "Ikoyi", "Ajah", "Gbagada", "Magodo", "Festac"].map(area => (
                  <button key={area} type="button" onClick={() => saveLocation(area, area)}
                    className="h-[34px] px-3.5 rounded-[12px] text-[12px] font-bold press-feedback"
                    style={{ background: userArea === area ? "var(--coral)" : "var(--sand)", color: userArea === area ? "white" : "var(--text-secondary)" }}>
                    {area}
                  </button>
                ))}
              </div>

              {/* Confirm manual input */}
              {locationInput.trim().length > 3 && (
                <button type="button" onClick={() => saveLocation(locationInput.trim())}
                  className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[14px] font-bold text-white press-feedback"
                  style={{ background: "var(--coral)" }}>
                  Confirm address
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
