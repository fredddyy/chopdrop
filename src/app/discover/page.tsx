"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Store {
  id: string;
  name: string;
  imageUrl: string | null;
  heroImage: string | null;
  productCount: number;
  topItems: string[];
  deliveryEstimate: string;
  bestSaving: number;
  bestDealName: string | null;
  rating: number;
  orderCount: number;
  lowestPrice: number;
  lowestGroupPrice: number;
}

interface PoolProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  retailPrice: number;
  groupPrice: number;
  minPoolSize: number;
  poolMemberCount: number;
  poolDeadline: string | null;
  vendor: { name: string; imageUrl?: string | null };
  poolMemberNames?: string[];
  poolLastJoinedName?: string | null;
  poolLastJoinedAt?: string | null;
  isFlashDeal?: boolean;
  flashPrice?: number | null;
}

function fmt(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

function StoreHeroImg({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
        <span className="text-[36px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{fallback}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" onError={() => setFailed(true)} />
  );
}

function PoolImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  if (failed || !src) {
    return (
      <div className="w-[80px] h-[80px] rounded-[12px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
        <span className="text-[11px] font-bold text-center px-1 leading-tight" style={{ color: "var(--text-muted)" }}>{alt.slice(0, 12)}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-[80px] h-[80px] rounded-[12px] object-cover shrink-0" onError={handleError} />
  );
}


const AVATAR_COLORS = ["#1C1C1E", "#C4572A", "#1A7D4B", "#D4A24E", "#6366F1"];
const AREA_SUGGESTIONS = ["Victoria Island", "Lekki", "Ikeja", "Yaba", "Marina", "Surulere", "Ikoyi", "Ajah", "Gbagada", "Maryland", "Magodo", "Festac", "Apapa"];

// Real pool state from API data
function poolState(minSize: number, memberCount: number) {
  const joined = memberCount;
  return { joined, spotsLeft: minSize - joined, fillPct: minSize > 0 ? Math.round((joined / minSize) * 100) : 0 };
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const inCategoryMode = !!categoryParam;

  const [stores, setStores] = useState<Store[]>([]);
  const [poolProducts, setPoolProducts] = useState<PoolProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [userArea, setUserArea] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const cart = useCart();

  // Sync category from URL param
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
      setActiveSubcategory(null);
    }
  }, [categoryParam]);

  // Read profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.areaName) setUserArea(p.areaName);
        if (p.deliveryAddress) setUserAddress(p.deliveryAddress);
        if (p.name) setUserName(p.name);
        if (p.latitude) setUserLat(p.latitude);
        if (p.longitude) setUserLng(p.longitude);
      }
    } catch {}
    // Fetch real credit balance
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.success && d.data) setCreditBalance(d.data.balance); }).catch(() => {});
  }, []);

  function saveLocation(area: string, address?: string, lat?: number, lng?: number) {
    setUserArea(area);
    if (address) setUserAddress(address);
    setAreaOpen(false);
    setAreaInput("");
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      const profile = stored ? JSON.parse(stored) : {};
      localStorage.setItem("chopdrop-customer", JSON.stringify({
        ...profile, areaName: area,
        ...(address ? { deliveryAddress: address } : {}),
        ...(lat != null ? { latitude: lat, longitude: lng } : {}),
      }));
    } catch {}
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16`);
          const data = await res.json();
          const addr = data.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || "";
          const display = data.display_name?.split(",").slice(0, 3).join(",").trim() || "";
          saveLocation(area, display, latitude, longitude);
        } catch { setLocating(false); }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const areaSuggestions = areaInput.length >= 1
    ? AREA_SUGGESTIONS.filter((a) => a.toLowerCase().includes(areaInput.toLowerCase()))
    : AREA_SUGGESTIONS;

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [activeCategory, activeSubcategory, userLat, userLng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when user navigates back (pool joins won't reflect otherwise)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") fetchData();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeCategory, userLat, userLng]); // eslint-disable-line react-hooks/exhaustive-deps

  // 30-second polling for live FOMO updates
  useEffect(() => {
    const interval = setInterval(() => { if (document.visibilityState === "visible" && !loading) fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, [activeCategory, userLat, userLng, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData(signal?: AbortSignal) {
    setLoading(true);
    setError(false);
    try {
      const [storesResult, productsResult] = await Promise.allSettled([
        fetch(`/api/stores?category=${activeCategory}${userLat ? `&lat=${userLat}&lng=${userLng}` : ""}`, { signal }).then((r) => r.json()),
        fetch(`/api/products?category=${activeCategory}${activeSubcategory ? `&subcategory=${activeSubcategory}` : ""}&limit=20&page=1`, { signal }).then((r) => r.json()),
      ]);
      if (signal?.aborted) return;
      if (storesResult.status === "fulfilled" && storesResult.value.success) {
        setStores(storesResult.value.data);
      }
      if (productsResult.status === "fulfilled" && productsResult.value.success) {
        const withSavings = (productsResult.value.data as PoolProduct[]).filter(
          (p) => p.groupPrice < p.retailPrice && p.imageUrl,
        );
        setPoolProducts(withSavings);
        setPage(1);
        const meta = productsResult.value.meta;
        setHasMore(meta ? meta.page < meta.totalPages : false);
        if (productsResult.value.subcategories) {
          setSubcategories(productsResult.value.subcategories);
        }
      }
      if (storesResult.status === "rejected" && productsResult.status === "rejected") {
        setError(true);
      }
    } catch (e) {
      if (signal?.aborted) return;
      if ((e as Error).name !== "AbortError") setError(true);
    }
    if (signal?.aborted) return;
    setLoading(false);
  }

  // Infinite scroll — load more products
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !inCategoryMode) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/products?category=${activeCategory}${activeSubcategory ? `&subcategory=${activeSubcategory}` : ""}&limit=20&page=${nextPage}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const more = (data.data as PoolProduct[]).filter((p) => p.groupPrice < p.retailPrice && p.imageUrl);
        setPoolProducts(prev => [...prev, ...more]);
        setPage(nextPage);
        const meta = data.meta;
        setHasMore(meta ? meta.page < meta.totalPages : false);
      } else {
        setHasMore(false);
      }
    } catch { setHasMore(false); }
    setLoadingMore(false);
  }, [loadingMore, hasMore, inCategoryMode, page, activeCategory, activeSubcategory]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!inCategoryMode || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [inCategoryMode, hasMore, loadingMore, loadMore]);

  // Search filters
  const q = searchQuery.trim().toLowerCase();
  const filteredStores = q.length >= 2
    ? stores.filter((s) => s.name.toLowerCase().includes(q))
    : stores;
  const filteredPools = q.length >= 2
    ? poolProducts.filter((p) => p.name.toLowerCase().includes(q) || p.vendor.name.toLowerCase().includes(q))
    : poolProducts;

  // Sort pools by fill rate (most full first) — "Filling Now" at top
  const sortedPools = [...filteredPools].map((p, idx) => ({
    ...p,
    fill: poolState(p.minPoolSize, p.poolMemberCount || 0),
  })).sort((a, b) => {
    // Flash deals first, then by fill rate, then by savings
    if (a.isFlashDeal && !b.isFlashDeal) return -1;
    if (!a.isFlashDeal && b.isFlashDeal) return 1;
    if (b.fill.fillPct !== a.fill.fillPct) return b.fill.fillPct - a.fill.fillPct;
    const savA = ((a.retailPrice - a.groupPrice) / a.retailPrice);
    const savB = ((b.retailPrice - b.groupPrice) / b.retailPrice);
    return savB - savA;
  });

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header — home mode only ── */}
      {!inCategoryMode && <header className="sticky top-0 z-40" style={{ background: "var(--bg)" }}>
        {/* Row 1: Label + Wordmark + Actions */}
        <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Home</p>
              <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Chop<span style={{ color: "var(--coral)" }}>Drop</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/cart" aria-label="Shopping cart" className="relative w-11 h-11 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              {cart.totalItems > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: Location pill + points pill */}
        <div className="px-5 pb-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAreaOpen(!areaOpen)}
            className="flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-[11px] font-bold cursor-pointer"
            style={{ background: "var(--dark)", color: "white" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
            {userArea || "Your area"} · {userAddress?.split(",")[0] || "Set location"}
          </button>
          <Link href="/rewards" aria-label="Rewards" className="flex items-center gap-1 h-[30px] px-3 rounded-full text-[11px] font-bold" style={{ background: "var(--dark)", color: "white" }}>
            {fmt(creditBalance)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" /><path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /></svg>
          </Link>
        </div>

        {/* Category tabs removed — single feed for now */}
      </header>}

      {/* ── Category header — sticky, white ── */}
      {inCategoryMode && (
        <header className="sticky top-0 z-40" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="px-5 pt-3 pb-3 flex items-center gap-3">
            <button type="button" onClick={() => router.push("/discover")} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 press-feedback" style={{ background: "var(--sand)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <h1 className="text-[20px] font-extrabold flex-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{activeCategory}</h1>
            <Link href="/cart" aria-label="Cart" className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              {cart.totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>
        </header>
      )}

      {/* ── Location panel ── */}
      {areaOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Set delivery location" onClick={() => { setAreaOpen(false); setAreaInput(""); }} onKeyDown={(e) => { if (e.key === "Escape") { setAreaOpen(false); setAreaInput(""); } }}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.3)" }} />
          <div className="absolute top-[52px] left-5 right-5 max-w-[428px] mx-auto rounded-[12px] p-4 sheet-enter" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text)" }}>Where should we deliver?</p>
            <button type="button" onClick={useMyLocation} disabled={locating} className="w-full h-11 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer mb-3 disabled:opacity-50" style={{ background: "var(--emerald)", color: "white" }}>
              {locating ? "Finding you..." : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>Use my location</>}
            </button>
            <input type="text" aria-label="Type your delivery area" placeholder="Or type your area, e.g. Lekki Phase 1" value={areaInput} onChange={(e) => setAreaInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && areaInput.trim()) saveLocation(areaInput.trim()); }} className="w-full h-11 px-4 rounded-[8px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] mb-2" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
            <div className="flex flex-wrap gap-1.5">
              {areaSuggestions.slice(0, 8).map((a) => (
                <button key={a} type="button" onClick={() => saveLocation(a)} className="h-8 px-3 rounded-[6px] text-[12px] font-bold cursor-pointer" style={{ background: userArea === a ? "var(--dark)" : "var(--sand)", color: userArea === a ? "white" : "var(--text-secondary)" }}>{a}</button>
              ))}
            </div>
            {userAddress && <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>Current: {userAddress}</p>}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="px-5 pt-6" aria-busy="true">
          <div className="h-8 rounded w-[70%] mb-2" style={{ background: "var(--sand)" }} />
          <div className="h-4 rounded w-[50%] mb-6" style={{ background: "var(--sand)" }} />
          <div className="rounded-[16px] overflow-hidden mb-4" style={{ background: "var(--dark)" }}>
            <div className="h-[200px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div className="p-4 space-y-2">
              <div className="h-4 rounded w-[60%]" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="h-6 rounded w-[35%]" style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3 mb-3">
              <div className="w-[70px] h-[70px] rounded-[12px] shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120}ms` }} />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 rounded w-[65%]" style={{ background: "var(--sand)" }} />
                <div className="h-5 rounded w-[30%]" style={{ background: "var(--sand)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load deals</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => fetchData()} className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>Try again</button>
        </div>
      ) : (
        <div>
          {/* ═══ HOME MODE — category grid entry point ═══ */}
          {!inCategoryMode && (
            <div className="px-5 pt-4">
              <h1 className="text-[22px] font-extrabold leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "var(--text)" }}>
                Buy together. Pay less.
              </h1>

              {/* Search — tappable link to /search */}
              <Link href="/search" className="mt-3 mb-4 flex items-center h-[42px] px-4 rounded-[12px] gap-2.5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Search for food, stores, deals...</span>
              </Link>

              {/* Category cards — solid color surface, photo floats on top */}
              <div className="flex gap-3">
                {/* Left column */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* Food — tall */}
                  <Link href="/discover?category=Food" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#C4572A", height: "230px" }}>
                    <span className="absolute top-3 left-3.5 text-[22px] font-extrabold text-white leading-none tracking-[-0.5px] z-10" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>Food</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/categories/food.png" alt="Food" className="absolute object-contain pointer-events-none" style={{ width: "140%", height: "110%", bottom: "-10%", right: "-25%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))" }} loading="lazy" />
                  </Link>
                  {/* Gadgets — short */}
                  <Link href="/discover?category=Electronics" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#A5B4FC", height: "180px" }}>
                    <span className="absolute top-3 left-3.5 text-[22px] font-extrabold leading-none tracking-[-0.5px] z-10" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#312E81" }}>Gadgets</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/categories/gadgets.png" alt="Gadgets" className="absolute object-contain pointer-events-none" style={{ width: "140%", height: "120%", bottom: "-8%", right: "-18%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))" }} loading="lazy" />
                  </Link>
                </div>
                {/* Right column */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* Groceries — short */}
                  <Link href="/discover?category=Groceries" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#1A7D4B", height: "180px" }}>
                    <span className="absolute top-3 left-3.5 text-[22px] font-extrabold text-white leading-none tracking-[-0.5px] z-10" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>Groceries</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/categories/groceries.png" alt="Groceries" className="absolute object-contain pointer-events-none" style={{ width: "110%", height: "115%", bottom: "-10%", right: "-10%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.2))" }} loading="lazy" />
                  </Link>
                  {/* Fashion — tall */}
                  <Link href="/discover?category=Fashion" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#EC4899", height: "230px" }}>
                    <span className="absolute top-3 left-3.5 text-[22px] font-extrabold text-white leading-none tracking-[-0.5px] z-10" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>Fashion</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/categories/fashion.png" alt="Fashion" className="absolute object-contain pointer-events-none" style={{ width: "130%", height: "110%", bottom: "-10%", right: "-20%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.15))" }} loading="lazy" />
                  </Link>
                </div>
              </div>
              {/* Home & Living — full width */}
              <Link href="/discover?category=Home" className="relative overflow-hidden rounded-[20px] press-feedback mt-3 block" style={{ background: "#D4A24E", height: "140px" }}>
                <span className="absolute top-3 left-3.5 text-[22px] font-extrabold text-white leading-none tracking-[-0.5px] z-10" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>Home &<br />Living</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/categories/home.png" alt="Home & Living" className="absolute object-contain pointer-events-none" style={{ width: "75%", height: "130%", bottom: "-20%", right: "-5%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.15))" }} loading="lazy" />
              </Link>

              {/* ── Flash deal banner (if active) ── */}
              {sortedPools.filter(p => p.isFlashDeal).length > 0 && (() => {
                const flash = sortedPools.find(p => p.isFlashDeal)!;
                const sav = Math.round(((flash.retailPrice - flash.groupPrice) / flash.retailPrice) * 100);
                const mins = flash.poolDeadline ? Math.max(0, Math.round((new Date(flash.poolDeadline).getTime() - Date.now()) / 60000)) : 0;
                return (
                  <Link href={`/product/${flash.id}`} className="mt-5 block rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--coral)" }}>
                    <div className="flex">
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded text-white" style={{ background: "rgba(255,255,255,0.2)" }}>Flash deal</span>
                          {mins > 0 && <span className="text-[11px] font-extrabold text-white">{mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m left`}</span>}
                        </div>
                        <p className="text-[16px] font-extrabold text-white leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{flash.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-[20px] font-extrabold text-white tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fmt(flash.groupPrice)}</span>
                          <span className="text-[11px] line-through" style={{ color: "rgba(255,255,255,0.5)" }}>{fmt(flash.retailPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                            <div className="h-full rounded-full" style={{ width: `${flash.fill.fillPct}%`, background: "white" }} />
                          </div>
                          <span className="text-[10px] font-bold text-white shrink-0">{flash.fill.joined}/{flash.minPoolSize}</span>
                        </div>
                      </div>
                      {flash.imageUrl && (
                        <div className="w-[100px] shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flash.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })()}

              {/* ── Trending now — horizontal scroll on home ── */}
              {sortedPools.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Trending now</h3>
                    <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{sortedPools.filter(p => !p.isFlashDeal).length} deals</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {!inCategoryMode && sortedPools.length > 0 && (
            <div className="overflow-x-auto hide-scrollbar">
              <div className="flex gap-3 px-5 pb-2" style={{ width: "max-content" }}>
                {sortedPools.filter(p => !p.isFlashDeal).slice(0, 8).map((p, idx) => {
                  const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                  const spotsLeft = p.minPoolSize - p.fill.joined;
                  const savingsAmount = p.retailPrice - p.groupPrice;
                  const emptyCtas = [`Save ${fmt(savingsAmount)}`, `${sav}% off · ${spotsLeft} spots`, `${spotsLeft} spots`];
                  return (
                    <Link key={`home-${p.id}`} href={`/product/${p.id}`} className="shrink-0 w-[220px] rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
                      <div className="p-2 pb-0">
                        <div className="h-[140px] relative rounded-[10px] overflow-hidden" style={{ background: "var(--sand)" }}>
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[20px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{p.name.charAt(0)}</div>
                          )}
                          {sav >= 10 && (
                            <span className="absolute top-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ background: "var(--emerald)" }}>{sav}% off</span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-[12px] font-bold truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-[15px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(p.groupPrice)}</span>
                          <span className="text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                        </div>
                        <p className="text-[10px] font-bold mt-1" style={{ color: p.fill.joined > 0 ? "var(--emerald)" : "var(--text-muted)" }}>
                          {p.fill.joined > 0 ? `${p.fill.joined} of ${p.minPoolSize} joined` : `${spotsLeft} spots open`}
                        </p>
                        <div className="mt-2 h-[30px] rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "var(--coral)" }}>
                          {p.fill.joined > 0 ? `Join · ${spotsLeft} left` : emptyCtas[idx % emptyCtas.length]}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          {!inCategoryMode && (
            <div className="px-5">

              {/* ── Live activity counter ── */}
              {sortedPools.length > 0 && (
                <div className="mt-5 flex items-center justify-center gap-2 py-3 rounded-[12px]" style={{ background: "var(--sand)" }}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--emerald)" }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "var(--emerald)" }} />
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: "var(--text)" }}>
                    {sortedPools.reduce((s, p) => s + p.fill.joined, 0)} people in active pools
                  </span>
                </div>
              )}

              {/* ── How it works — moved below products ── */}
              <div className="mt-5 rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-2.5" style={{ color: "var(--emerald)" }}>New here? How it works</p>
                <div className="flex gap-3">
                  {[
                    { step: "1", label: "Pick a deal", sub: "Browse any category" },
                    { step: "2", label: "Join a group", sub: "More people = lower price" },
                    { step: "3", label: "Everyone saves", sub: "Didn't fill? Full refund" },
                  ].map((s) => (
                    <div key={s.step} className="flex-1 text-center">
                      <div className="w-7 h-7 rounded-full mx-auto flex items-center justify-center text-[11px] font-extrabold text-white mb-1" style={{ background: "var(--emerald)" }}>{s.step}</div>
                      <p className="text-[11px] font-bold" style={{ color: "var(--text)" }}>{s.label}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-4 mb-4" />
            </div>
          )}

          {/* ═══ CATEGORY MODE — search + pills + grid ═══ */}
          {inCategoryMode && (
            <div className="px-5 pt-2">
              {/* Scoped search */}
              <Link href={`/search?category=${activeCategory}`} className="mb-3 flex items-center h-[42px] px-4 rounded-[12px] gap-2.5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Search {activeCategory.toLowerCase()}...</span>
              </Link>
              {/* Subcategory pills */}
              {subcategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSubcategory(null)}
                    className="h-[32px] px-3.5 rounded-full text-[12px] font-bold whitespace-nowrap shrink-0"
                    style={{ background: !activeSubcategory ? "var(--dark)" : "var(--card)", color: !activeSubcategory ? "white" : "var(--text-secondary)", border: activeSubcategory ? "1px solid var(--border)" : "none" }}
                  >
                    All
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                      className="h-[32px] px-3.5 rounded-full text-[12px] font-bold whitespace-nowrap shrink-0"
                      style={{ background: activeSubcategory === sub ? "var(--dark)" : "var(--card)", color: activeSubcategory === sub ? "white" : "var(--text-secondary)", border: activeSubcategory === sub ? "none" : "1px solid var(--border)" }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ CATEGORY FEED — 2-column product grid with join CTAs ═══ */}
          {inCategoryMode && (
            <div className="px-5 mt-4">
              {/* Flash deal compact banner (if active in this category) */}
              {sortedPools.some(p => p.isFlashDeal) && (() => {
                const flash = sortedPools.find(p => p.isFlashDeal)!;
                const flashSav = Math.round(((flash.retailPrice - flash.groupPrice) / flash.retailPrice) * 100);
                const flashMins = flash.poolDeadline ? Math.max(0, Math.round((new Date(flash.poolDeadline).getTime() - Date.now()) / 60000)) : 0;
                return (
                  <Link href={`/product/${flash.id}`} className="mb-4 block rounded-[14px] p-3 press-feedback" style={{ background: "var(--coral)" }}>
                    <div className="flex items-center gap-3">
                      {flash.imageUrl && (
                        <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flash.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded text-white" style={{ background: "rgba(255,255,255,0.2)" }}>Flash</span>
                          {flashMins > 0 && <span className="text-[10px] font-bold text-white">{flashMins > 60 ? `${Math.floor(flashMins / 60)}h ${flashMins % 60}m` : `${flashMins}m left`}</span>}
                        </div>
                        <p className="text-[13px] font-bold text-white truncate mt-0.5">{flash.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[16px] font-extrabold text-white tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fmt(flash.groupPrice)}</p>
                        <p className="text-[10px] text-white">{flashSav}% off</p>
                      </div>
                    </div>
                  </Link>
                );
              })()}

              {/* ═══ TOP SELLERS — store activity cards ═══ */}
              {filteredStores.length > 0 && (
                <section className="mt-2 -mx-5" role="region" aria-label="Top sellers">
                  <div className="px-5 flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                      Top sellers{userArea ? ` near ${userArea}` : ""}
                    </h3>
                    <Link href="/search" className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>See all</Link>
                  </div>
                  <div className="overflow-x-auto hide-scrollbar">
                    <div className="flex gap-3 px-5 pb-2 w-max">
                      {filteredStores.map((store) => (
                          <Link key={store.id} href={`/store/${store.id}`} aria-label={`Visit ${store.name}`} className="shrink-0 w-[270px] rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
                            {/* Hero banner — 160px per design system */}
                            <div className="h-[160px] relative" style={{ background: "var(--sand)" }}>
                              {(store.heroImage || store.imageUrl) ? (
                                <StoreHeroImg src={store.heroImage || store.imageUrl || ""} alt={store.name} fallback={store.name.charAt(0)} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-[36px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{store.name.charAt(0)}</span>
                                </div>
                              )}
                              {store.bestSaving > 0 && (
                                <span className="absolute top-2.5 left-2.5 text-[10px] font-extrabold px-2 py-1 rounded-[8px] text-white" style={{ background: "var(--coral)" }}>
                                  Up to {store.bestSaving}% off
                                </span>
                              )}
                              {store.orderCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-1 rounded-[8px]" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                                  {store.orderCount}+ orders
                                </span>
                              )}
                              {/* Store logo overlay */}
                              {store.imageUrl && store.heroImage && (
                                <div className="absolute bottom-2.5 left-2.5 w-[36px] h-[36px] rounded-[10px] overflow-hidden ring-2 ring-white" style={{ background: "var(--card)" }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={store.imageUrl} alt={`${store.name} logo`} className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              )}
                            </div>
                            {/* Info — answers: what, how cheap, who's buying */}
                            <div className="p-3">
                              <h4 className="text-[14px] font-bold truncate" style={{ color: "var(--text)" }}>{store.name}</h4>
                              {/* Price anchor */}
                              {store.lowestGroupPrice > 0 && (
                                <div className="flex items-baseline gap-1.5 mt-1">
                                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>From</span>
                                  <span className="text-[15px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(store.lowestGroupPrice)}</span>
                                  {store.lowestPrice > store.lowestGroupPrice && (
                                    <span className="text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(store.lowestPrice)}</span>
                                  )}
                                </div>
                              )}
                              {/* Metadata row */}
                              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] overflow-hidden" style={{ color: "var(--text-muted)" }}>
                                <span className="shrink-0">{store.deliveryEstimate}</span>
                                {store.rating > 0 && <><span>·</span><span className="shrink-0" style={{ color: "var(--emerald)" }}>★ {store.rating.toFixed(1)}</span></>}
                              </div>
                              {/* Savings callout */}
                              {store.bestSaving > 0 && (
                                <p className="text-[11px] font-bold mt-1.5" style={{ color: "var(--coral)" }}>
                                  Save up to {store.bestSaving}% on group deals
                                </p>
                              )}
                            </div>
                          </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Section header */}
              {sortedPools.length > 0 && (
                <div className="flex items-center justify-between mb-3 mt-5">
                  <h3 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{sortedPools.length} {activeCategory.toLowerCase()} deal{sortedPools.length !== 1 ? "s" : ""}</h3>
                </div>
              )}

              {/* 2-column product grid with featured wide card every 6th */}
              {sortedPools.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {sortedPools.map((p, idx) => {
                    const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                    const spotsLeft = p.minPoolSize - p.fill.joined;
                    const memberNames = p.poolMemberNames || [];
                    const lastJoined = p.poolLastJoinedName;
                    const lastJoinedAt = p.poolLastJoinedAt;
                    const agoMin = lastJoinedAt ? Math.floor((Date.now() - new Date(lastJoinedAt).getTime()) / 60000) : 0;
                    const savingsAmount = p.retailPrice - p.groupPrice;
                    const isFeatured = idx > 0 && idx % 6 === 0;

                    // ── Featured wide card (every 6th item) ──
                    if (isFeatured) {
                      return (
                        <Link key={`cat-feat-${p.id}`} href={`/product/${p.id}`} className="col-span-2 rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--dark)", border: "1px solid var(--border)" }}>
                          <div className="flex">
                            <div className="w-[140px] h-[140px] shrink-0" style={{ background: "var(--sand)" }}>
                              {p.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                              )}
                            </div>
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div>
                                {sav >= 10 && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white inline-block mb-1.5" style={{ background: "var(--emerald)" }}>{sav}% off</span>}
                                <p className="text-[16px] font-extrabold text-white leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{p.name}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--subdued)" }}>{p.vendor.name}</p>
                                {lastJoined && agoMin <= 30 && (
                                  <p className="text-[10px] font-bold mt-1" style={{ color: "var(--emerald)" }}>{lastJoined} joined {agoMin <= 1 ? "just now" : `${agoMin}m ago`}</p>
                                )}
                              </div>
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[22px] font-extrabold tabular-nums text-white leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fmt(p.groupPrice)}</span>
                                  <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--subdued)" }}>{fmt(p.retailPrice)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.max(p.fill.fillPct, 3)}%`, background: p.fill.fillPct >= 80 ? "var(--coral)" : "var(--emerald)" }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-white shrink-0">{p.fill.joined > 0 ? `${p.fill.joined}/${p.minPoolSize}` : `${spotsLeft} spots`}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    }

                    // ── Standard 2-col card ──
                    return (
                      <Link key={`cat-${p.id}`} href={`/product/${p.id}`} className="rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
                        <div className="p-2 pb-0">
                          <div className="h-[120px] relative rounded-[12px] overflow-hidden" style={{ background: "var(--sand)" }}>
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[24px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{p.name.charAt(0)}</div>
                            )}
                            {sav >= 10 && (
                              <span className="absolute top-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ background: "var(--emerald)" }}>{sav}% off</span>
                            )}
                            {memberNames.length > 0 && (
                              <div className="absolute bottom-2 left-2 flex -space-x-1.5">
                                {memberNames.slice(0, 3).map((name, i) => (
                                  <div key={i} className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white" style={{ background: ["var(--coral)", "var(--emerald)", "var(--gold)"][i % 3] }}>
                                    {name.charAt(0)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-[13px] font-bold truncate leading-tight" style={{ color: "var(--text)" }}>{p.name}</p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                          {lastJoined && agoMin <= 30 && (
                            <p className="text-[10px] font-bold mt-1" style={{ color: "var(--emerald)" }}>
                              {lastJoined} joined {agoMin <= 1 ? "just now" : `${agoMin}m ago`}
                            </p>
                          )}
                          <div className="flex items-baseline gap-1 mt-1.5">
                            <span className="text-[17px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(p.groupPrice)}</span>
                            <span className="text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                          </div>
                          {/* Fill progress bar */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(p.fill.fillPct, 2)}%`, background: p.fill.fillPct >= 80 ? "var(--coral)" : "var(--emerald)" }} />
                            </div>
                            <span className="text-[9px] font-bold shrink-0" style={{ color: p.fill.joined > 0 ? "var(--emerald)" : "var(--text-muted)" }}>
                              {p.fill.joined > 0 ? `${p.fill.joined}/${p.minPoolSize}` : `${spotsLeft} spots`}
                            </span>
                          </div>
                          {/* CTA — color reflects fill state */}
                          <div className="mt-2 h-[34px] rounded-[12px] flex items-center justify-center text-[12px] font-bold text-white" style={{ background: p.fill.fillPct >= 80 ? "#DC2626" : p.fill.joined > 0 ? "var(--emerald)" : "var(--coral)" }}>
                            {p.fill.joined > 0 ? (spotsLeft <= 2 ? `Last ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""}!` : `Join · ${spotsLeft} left`) : `Save ${fmt(savingsAmount)}`}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              {inCategoryMode && hasMore && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-6">
                  {loadingMore && <div className="w-5 h-5 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />}
                </div>
              )}
              {inCategoryMode && !hasMore && sortedPools.length > 20 && (
                <p className="text-center text-[11px] py-4" style={{ color: "var(--text-muted)" }}>You&apos;ve seen all {activeCategory.toLowerCase()} deals</p>
              )}
            </div>
          )}

          {/* Top sellers moved to top of category feed */}

          {/* ── Demand signal — bottom of category page ── */}
          {inCategoryMode && (
            <div className="px-5 mt-6">
              <button
                type="button"
                onClick={() => { if (navigator.share) navigator.share({ title: "ChopDrop", text: `What ${activeCategory.toLowerCase()} do you want near you?`, url: window.location.href }).catch(() => {}); }}
                className="w-full flex items-center gap-3 p-4 rounded-[16px] press-feedback cursor-pointer text-left"
                style={{ background: "var(--sand)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--card)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Can&apos;t find what you want?</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Tell us and we&apos;ll add it</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Empty state ── */}
          {inCategoryMode && filteredStores.length === 0 && sortedPools.length === 0 && (
            <div className="py-16 text-center px-8">
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No {activeCategory.toLowerCase()} deals yet</h2>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>New deals drop daily. Check back soon.</p>
              <button type="button" onClick={() => router.push("/discover")} className="h-11 px-6 rounded-full text-[13px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>Back to categories</button>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </main>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
