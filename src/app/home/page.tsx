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
  livePools: { count: number; totalMembers: number; totalSize: number; bestFill: number; memberNames: string[] };
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

const TABS = [
  { key: "all" as const, label: "Stores" },
  { key: "deals" as const, label: "Group Order" },
  { key: "chop" as const, label: "Chop Price" },
  { key: "live" as const, label: "Live" },
  { key: "popular" as const, label: "Popular" },
];
type FilterKey = typeof TABS[number]["key"];

function TabBar({ filter, setFilter }: { filter: FilterKey; setFilter: (f: FilterKey) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const idx = TABS.findIndex(t => t.key === filter);
    const el = textRefs.current[idx];
    const container = containerRef.current;
    if (el && container) {
      setIndicator({ left: el.offsetLeft - container.scrollLeft, width: el.offsetWidth });
    }
  }, [filter]);

  useEffect(() => { updateIndicator(); }, [updateIndicator]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateIndicator, { passive: true });
    return () => el.removeEventListener("scroll", updateIndicator);
  }, [updateIndicator]);

  return (
    <div className="relative mt-3">
      <div ref={containerRef} className="flex gap-1 overflow-x-auto hide-scrollbar">
        {TABS.map((f, i) => {
          const active = filter === f.key;
          return (
            <button key={f.key} type="button"
              onClick={() => setFilter(f.key)}
              className={`${i === 0 ? "pr-2.5" : "px-2.5"} pb-2 text-[13px] font-semibold whitespace-nowrap shrink-0 press-feedback`}
              style={{ color: active ? "var(--coral)" : "var(--text-muted)", transition: "color 200ms ease-out" }}>
              <span ref={el => { textRefs.current[i] = el; }}>{f.label}</span>
            </button>
          );
        })}
      </div>
      {/* Full-width track line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--border)" }} />
      {/* Sliding active underline */}
      <div className="absolute bottom-0 h-[2px] rounded-full z-10" style={{
        left: `${indicator.left}px`,
        width: `${indicator.width}px`,
        background: "var(--coral)",
        transition: "left 250ms cubic-bezier(0.4,0,0.2,1), width 250ms cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
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
  const touchStartX = useRef(0);
  const swipeTab = useCallback((direction: "left" | "right") => {
    setFilter(prev => {
      const idx = TABS.findIndex(t => t.key === prev);
      const next = direction === "left" ? Math.min(idx + 1, TABS.length - 1) : Math.max(idx - 1, 0);
      return TABS[next].key;
    });
  }, []);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [filter, setFilter] = useState<"all" | "deals" | "live" | "chop" | "popular">("all");
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
  }, []);

  // Reload feed when category changes
  useEffect(() => { loadFeed(activeCategory); }, [activeCategory]);

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

      {/* ── Header — greeting + delivery ── */}
      <header className="px-5 pt-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Greeting + name */}
            <p className="text-[20px] font-extrabold leading-none tracking-[-0.03em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
              {(() => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; })()}, {(() => { const h = new Date().getHours(); return h < 12 ? "\u{1F44B}" : h < 17 ? "\u2600\uFE0F" : "\u{1F319}"; })()}
            </p>
            <p className="text-[14px] font-bold mt-0.5" style={{ color: "var(--text-secondary)" }}>{userName.split(" ")[0] || "there"}</p>
            {/* Delivery address — tappable */}
            <button type="button" onClick={() => setLocationSheet(true)} className="flex items-center gap-1 mt-1 press-feedback">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--coral)" stroke="none" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
              <span className="text-[11px] font-bold truncate" style={{ color: hasAddress ? "var(--coral)" : "var(--text-muted)" }}>
                {deliveryAddress || userArea || "Set your delivery address"}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={hasAddress ? "var(--coral)" : "var(--text-muted)"} strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>
          <Link href="/cart" aria-label="Cart" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </Link>
        </div>
        {/* Search link */}
        <Link href="/search" className="mt-3 flex items-center h-[42px] px-4 rounded-[12px] gap-2.5" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>Search restaurants, food...</span>
        </Link>
        {/* Location prompt card — shows when no address saved */}
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

        {/* Categories */}
        <p className="text-[18px] font-extrabold mt-4 mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Categories</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {(categories.length > 0 ? categories : [
            { name: "Food", imageUrl: "/categories/food.png" },
            { name: "Groceries", imageUrl: "/categories/groceries.png" },
            { name: "Gadgets", imageUrl: "/categories/gadgets.png" },
            { name: "Fashion", imageUrl: "/categories/fashion.png" },
            { name: "Home", imageUrl: "/categories/home.png" },
          ]).map(c => {
            const active = activeCategory === c.name;
            return (
            <button key={c.name} type="button" onClick={() => setActiveCategory(c.name)}
              className="h-[40px] px-3 rounded-[12px] flex items-center gap-2 shrink-0 press-feedback"
              style={{
                background: active ? "rgba(196,87,42,0.1)" : "var(--sand)",
                border: "1px solid transparent",
                transition: "all 150ms ease-out",
              }}>
              <span className="text-[14px] font-extrabold" style={{ color: active ? "var(--coral)" : "var(--text-secondary)" }}>{c.name}</span>
              {c.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="w-[24px] h-[24px] object-contain" />
              )}
            </button>
            );
          })}
        </div>
      </header>
      {/* Tabs — sticky */}
      <div className="sticky top-0 z-40 px-5" style={{ background: "var(--bg)" }}>
        <TabBar filter={filter} setFilter={setFilter} />
      </div>

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
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load restaurants</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => loadFeed()} className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white cursor-pointer press-feedback" style={{ background: "var(--coral)" }}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (() => {
        const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
        const handleTouchEnd = (e: React.TouchEvent) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 60) swipeTab(dx < 0 ? "left" : "right");
        };
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
        <div key={filter} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="card-enter">
          {/* ═══ ITEM CARDS — shown when filtering by deals or live ═══ */}
          {isItemView && filteredItems.length > 0 && (
            <div className="px-5 pt-4">
              <div className="grid grid-cols-3 gap-2.5">
                {filteredItems.map(item => {
                  const poolMembers = item.activePool?.memberCount || 0;
                  const spotsLeft = item.minPoolSize - poolMembers;
                  const hasPool = item.activePool && poolMembers > 0;
                  const isChopMode = filter === "chop";
                  const chopFriendsNeeded = Math.ceil(item.retailPrice / 10000); // each friend chops ₦100
                  return (
                  <Link key={item.id} href={`/product/${item.id}`} className="press-feedback block rounded-lg overflow-hidden">
                    {/* Image + add button */}
                    <div className="relative rounded-[12px] overflow-hidden" style={{ aspectRatio: "1", background: "var(--sand)" }}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[20px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{item.name.charAt(0)}</span>
                        </div>
                      )}
                      {/* Ribbon — top left */}
                      {isChopMode ? (
                        <div className="absolute top-0 left-0 px-1.5 py-0.5 text-[8px] font-extrabold text-white" style={{ background: "var(--coral)", borderRadius: "0 0 8px 0" }}>
                          FREE
                        </div>
                      ) : (
                        <div className="absolute top-0 left-0 px-1.5 py-0.5 text-[8px] font-extrabold text-white" style={{ background: "var(--emerald)", borderRadius: "0 0 8px 0" }}>
                          -{item.savings}%
                        </div>
                      )}
                      {/* Add button — bottom right on image */}
                      <div className="absolute bottom-1.5 right-1.5 w-[24px] h-[24px] rounded-lg flex items-center justify-center" style={{ background: "white" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="pt-1.5">
                      <p className="text-[11px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                      <p className="text-[9px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{item.restaurantName}</p>
                      {/* Price */}
                      {isChopMode ? (
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-[13px] font-extrabold leading-none line-through tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-muted)" }}>{fmt(item.retailPrice)}</span>
                          <span className="text-[11px] font-extrabold leading-none" style={{ color: "var(--emerald)" }}>FREE</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-[13px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(item.groupPrice)}</span>
                          <span className="text-[9px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(item.retailPrice)}</span>
                        </div>
                      )}
                      {/* Pool status box — full width */}
                      <div className="mt-1.5">
                        <div className="text-[9px] font-bold py-1.5 text-center rounded-lg" style={{
                          background: hasPool ? "rgba(26,125,75,0.1)" : "var(--sand)",
                          color: hasPool ? "var(--emerald)" : "var(--text-muted)",
                        }}>
                          {isChopMode
                            ? `${chopFriendsNeeded} friends to chop`
                            : hasPool ? `${poolMembers} Group Active` : `${item.minPoolSize} needed`}
                        </div>
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
                        {/* Live pool pill — top left of banner */}
                        {r.livePools.count > 0 ? (
                          <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-white" style={{ background: "var(--coral)" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            {r.livePools.count} active {r.livePools.count === 1 ? "group" : "groups"} · {r.livePools.totalMembers} {r.livePools.totalMembers === 1 ? "person" : "people"} in
                          </span>
                        ) : bestTier ? (
                          <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white" style={{ background: "var(--coral)" }}>
                            Up to {bestTier.discount}% off
                          </span>
                        ) : null}
                        {/* Group deals count — on banner */}
                        {r.groupDealCount > 0 && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-white" style={{ background: "rgba(0,0,0,0.7)" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            {r.groupDealCount} group {r.groupDealCount === 1 ? "deal" : "deals"}
                          </span>
                        )}
                      </div>

                      {/* Info — below banner */}
                      <div className="pt-2.5 pb-1">
                        <h3 className="text-[17px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{r.name}</h3>
                        {/* Group order info — people needed, discount, time */}
                        {(() => {
                          const firstTier = r.tiers[0] || { min: 5, discount: 10 };
                          const bestTierDisc = r.tiers.length > 0 ? r.tiers[r.tiers.length - 1] : { min: 10, discount: 30 };
                          const spotsNeeded = firstTier.min;
                          const liveMembers = r.livePools.totalMembers;
                          const liveSize = r.livePools.totalSize || spotsNeeded;
                          const hasLive = r.livePools.count > 0;
                          return (
                          <div className="mt-2.5">
                            <p className="text-[11px] font-bold" style={{ color: "var(--text-secondary)" }}>
                              {hasLive
                                ? `${liveMembers} of ${liveSize} joined · ${bestTierDisc.discount}% off · 2h window`
                                : `when ${spotsNeeded} people order together · 2h window`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="flex -space-x-1">
                                {Array.from({ length: Math.min(hasLive ? liveSize : spotsNeeded, 8) }).map((_, i) => {
                                  const filled = hasLive && i < liveMembers;
                                  return (
                                    <div key={i} className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[7px] font-bold"
                                      style={{ background: filled ? "var(--coral)" : "transparent", border: filled ? "1.5px solid white" : "1.5px dashed var(--border)", color: filled ? "white" : "var(--text-muted)" }}>
                                      {filled ? (r.livePools.memberNames[i]?.charAt(0) || "!") : "?"}
                                    </div>
                                  );
                                })}
                              </div>
                              {(hasLive ? liveSize : spotsNeeded) > 8 && (
                                <span className="text-[9px] font-bold" style={{ color: "var(--text-muted)" }}>+{(hasLive ? liveSize : spotsNeeded) - 8}</span>
                              )}
                              <span className="text-[9px] font-bold" style={{ color: hasLive ? "var(--coral)" : "var(--text-muted)" }}>
                                {hasLive ? `${liveSize - liveMembers} spots left` : `${spotsNeeded} spots`}
                              </span>
                            </div>
                          </div>
                          );
                        })()}

                        {/* Social proof — recent activity */}
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
                          r.tiers.length === 0 && (
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
                  className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white press-feedback"
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
