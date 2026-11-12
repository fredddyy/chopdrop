"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
        fetch(`/api/products?category=${activeCategory}${activeSubcategory ? `&subcategory=${activeSubcategory}` : ""}&limit=20`, { signal }).then((r) => r.json()),
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

      {/* ── Header — ChopChop style ── */}
      <header className="sticky top-0 z-40" style={{ background: "var(--bg)" }}>
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
      </header>

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
                  <Link href="/discover?category=Electronics" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#6366F1", height: "180px" }}>
                    <span className="absolute top-3.5 left-4 text-[24px] font-extrabold text-white leading-none tracking-[-0.5px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Gadgets</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop" alt="Gadgets" className="absolute bottom-0 right-0 w-[70%] h-[65%] object-cover rounded-tl-[16px]" loading="lazy" />
                  </Link>
                </div>
                {/* Right column */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* Groceries — short */}
                  <Link href="/discover?category=Groceries" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#1A7D4B", height: "180px" }}>
                    <span className="absolute top-3 left-3.5 text-[22px] font-extrabold text-white leading-none tracking-[-0.5px] z-10" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>Groceries</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/categories/groceries.png" alt="Groceries" className="absolute object-contain pointer-events-none" style={{ width: "130%", height: "110%", bottom: "-12%", right: "-20%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.2))" }} loading="lazy" />
                  </Link>
                  {/* Fashion — tall */}
                  <Link href="/discover?category=Fashion" className="relative overflow-hidden rounded-[20px] press-feedback" style={{ background: "#EC4899", height: "230px" }}>
                    <span className="absolute top-3.5 left-4 text-[24px] font-extrabold text-white leading-none tracking-[-0.5px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Fashion</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80&fit=crop" alt="Fashion" className="absolute bottom-0 right-0 w-[75%] h-[70%] object-cover rounded-tl-[16px]" loading="lazy" />
                  </Link>
                </div>
              </div>
              {/* Home & Living — full width */}
              <Link href="/discover?category=Home" className="relative overflow-hidden rounded-[20px] press-feedback mt-3 block" style={{ background: "#D4A24E", height: "140px" }}>
                <span className="absolute top-3.5 left-4 text-[24px] font-extrabold text-white leading-none tracking-[-0.5px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Home & Living</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop" alt="Home & Living" className="absolute bottom-0 right-0 w-[55%] h-[85%] object-cover rounded-tl-[16px]" loading="lazy" />
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

              {/* ── Trending pools — 2-col product grid with social proof + join CTAs ── */}
              {sortedPools.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Trending now</h3>
                    <Link href="/search" className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>See all</Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {sortedPools.filter(p => !p.isFlashDeal).slice(0, 6).map((p) => {
                      const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                      const spotsLeft = p.minPoolSize - p.fill.joined;
                      const memberNames = p.poolMemberNames || [];
                      const lastJoined = p.poolLastJoinedName;
                      const lastJoinedAt = p.poolLastJoinedAt;
                      const agoMin = lastJoinedAt ? Math.floor((Date.now() - new Date(lastJoinedAt).getTime()) / 60000) : 0;
                      return (
                        <Link key={`grid-${p.id}`} href={`/product/${p.id}`} className="rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                          <div className="h-[120px] relative" style={{ background: "var(--sand)" }}>
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[24px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{p.name.charAt(0)}</div>
                            )}
                            {sav >= 10 && (
                              <span className="absolute top-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ background: "var(--emerald)" }}>{sav}% off</span>
                            )}
                            {/* Member avatars on image */}
                            {memberNames.length > 0 && (
                              <div className="absolute bottom-2 left-2 flex -space-x-1.5">
                                {memberNames.slice(0, 3).map((name, i) => (
                                  <div key={i} className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white" style={{ background: ["var(--coral)", "var(--emerald)", "var(--gold)"][i % 3] }}>
                                    {name.charAt(0)}
                                  </div>
                                ))}
                                {p.fill.joined > 3 && (
                                  <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[7px] font-bold ring-2 ring-white" style={{ background: "var(--dark)", color: "white" }}>
                                    +{p.fill.joined - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-[13px] font-bold truncate leading-tight" style={{ color: "var(--text)" }}>{p.name}</p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                            {/* FOMO: last joined */}
                            {lastJoined && agoMin <= 30 && (
                              <p className="text-[10px] font-bold mt-1" style={{ color: "var(--emerald)" }}>
                                {lastJoined} joined {agoMin <= 1 ? "just now" : `${agoMin}m ago`}
                              </p>
                            )}
                            {/* Price row */}
                            <div className="flex items-baseline gap-1 mt-1.5">
                              <span className="text-[17px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fmt(p.groupPrice)}</span>
                              <span className="text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                            </div>
                            {/* Fill bar */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                                <div className="h-full rounded-full" style={{ width: `${p.fill.fillPct}%`, background: "var(--emerald)" }} />
                              </div>
                              <span className="text-[9px] font-bold shrink-0" style={{ color: "var(--emerald)" }}>{p.fill.joined}/{p.minPoolSize}</span>
                            </div>
                            {/* Join CTA */}
                            <div className="mt-2.5 h-[34px] rounded-[10px] flex items-center justify-center text-[12px] font-bold text-white" style={{ background: "var(--coral)" }}>
                              {p.fill.joined > 0 ? `Join · ${spotsLeft} left` : "Be first · Get this price"}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

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

          {/* ═══ CATEGORY MODE — back button + category header + filtered feed ═══ */}
          {inCategoryMode && (
            <div className="px-5 pt-3">
              <div className="flex items-center gap-3 mb-3">
                <button type="button" onClick={() => router.push("/discover")} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 press-feedback" style={{ background: "var(--sand)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-[22px] font-extrabold flex-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{activeCategory}</h1>
                <Link href="/cart" aria-label="Cart" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                </Link>
              </div>
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

          {/* ═══ CATEGORY FEED — only shows inside a category ═══ */}
          {inCategoryMode && sortedPools.length > 0 && (
            <div className="px-5 mt-5 mb-2 flex items-center justify-between">
              <h3 className="text-[21px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Almost full. Don&apos;t dull.</h3>
              <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{sortedPools.length} live</span>
            </div>
          )}

          {/* ═══ FEATURED POOL CARD — dark hero, ChopChop style ═══ */}
          {inCategoryMode && sortedPools.length > 0 && (() => {
            const topDeals = sortedPools.slice(0, Math.min(3, sortedPools.length));
            // Flash deals always get featured. Otherwise rotate daily.
            const flashDeal = topDeals.find(d => d.isFlashDeal);
            const featured = flashDeal || topDeals[Math.floor(Date.now() / 86400000) % topDeals.length];
            const sav = Math.round(((featured.retailPrice - featured.groupPrice) / featured.retailPrice) * 100);
            const isHot = featured.fill.spotsLeft <= 3;
            return (
              <Link
                href={`/product/${featured.id}`}
                className="mx-5 block rounded-[22px] overflow-hidden press-feedback card-enter card-enter-1"
                style={{ background: "var(--dark)" }}
              >
                {/* Badges + Food image */}
                <div className="relative">
                  {featured.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.imageUrl} alt={featured.name} className="w-full h-[220px] object-cover" />
                  ) : (
                    <div className="w-full h-[220px] flex items-center justify-center" style={{ background: "var(--sand)" }}>
                      <span className="text-[48px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{featured.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {featured.isFlashDeal && (
                      <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "var(--coral)", color: "white", padding: "6px 10px" }}>
                        Flash deal
                      </span>
                    )}
                    {isHot && !featured.isFlashDeal && (
                      <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "var(--lime)", color: "var(--text)", padding: "6px 10px" }}>
                        Only {featured.fill.spotsLeft} spot{featured.fill.spotsLeft !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "#FFE9DD", color: "var(--text)", padding: "6px 10px" }}>
                      Save {sav}%
                    </span>
                  </div>
                </div>
                {/* Info on dark */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[23px] font-extrabold leading-[145%] text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{featured.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {featured.vendor.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={featured.vendor.imageUrl} alt="" className="w-[16px] h-[16px] rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-[16px] h-[16px] rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "var(--coral)" }}>{featured.vendor.name.charAt(0)}</div>
                        )}
                        <p className="text-[12px]" style={{ color: "var(--subdued)" }}>{featured.vendor.name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[32px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--gold)" }}>{fmt(featured.groupPrice)}</span>
                      <p className="text-[13px] line-through tabular-nums mt-0.5" style={{ color: "var(--subdued)" }}>{fmt(featured.retailPrice)}</p>
                    </div>
                  </div>
                  {/* Progress + countdown */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold" style={{ color: "white" }}>
                    <span>{featured.fill.joined > 0 ? `${featured.fill.joined}/${featured.minPoolSize} spots filled` : `${featured.minPoolSize} spots · Be first to join`}</span>
                    {featured.poolDeadline ? (() => {
                      const mins = Math.max(0, Math.round((new Date(featured.poolDeadline).getTime() - Date.now()) / 60000));
                      return <span style={{ color: featured.isFlashDeal ? "var(--coral)" : "var(--lime)" }}>{mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins}m left`}</span>;
                    })() : (
                      <span style={{ color: "var(--lime)" }}>Save {sav}%</span>
                    )}
                  </div>
                  <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
                    <div className="h-full" style={{
                      width: `${featured.fill.fillPct}%`,
                      background: "var(--lime)",
                      borderRadius: "9px",
                    }} />
                  </div>
                  {/* Pickup location */}
                  <div className="flex items-center gap-1.5 mt-2.5 text-[11px]" style={{ color: "var(--subdued)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {userArea ? `${userArea} pickup` : "Pickup nearby"}
                  </div>
                  {/* Social proof — real member initials */}
                  {featured.fill.joined >= 1 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-1.5">
                        {(featured.poolMemberNames || []).slice(0, 3).map((name, i) => (
                          <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], border: "2px solid var(--dark)" }}>
                            {name.charAt(0)}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--subdued)" }}>{featured.fill.joined} {featured.fill.joined === 1 ? "person is" : "people are"} in</span>
                    </div>
                  )}
                  {/* FOMO: recent join */}
                  {featured.poolLastJoinedName && featured.poolLastJoinedAt && (() => {
                    const agoMs = Date.now() - new Date(featured.poolLastJoinedAt).getTime();
                    const agoMin = Math.round(agoMs / 60000);
                    if (agoMin > 30) return null;
                    return (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--emerald)", animation: "pulse 2s ease-in-out infinite" }} />
                        <span className="text-[11px]" style={{ color: "var(--emerald)" }}>{featured.poolLastJoinedName} joined {agoMin <= 1 ? "just now" : `${agoMin}m ago`}</span>
                      </div>
                    );
                  })()}
                </div>
              </Link>
            );
          })()}

          {/* ═══ FILLING FAST — horizontal swipe carousel ═══ */}
          {inCategoryMode && sortedPools.length > 1 && (
            <div className="mt-5">
              <div className="px-5 flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Filling fast</h3>
                <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{sortedPools.length - 1} more</span>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <div className="flex gap-3 px-5 pb-1 w-max" style={{ scrollSnapType: "x mandatory" }}>
                  {sortedPools.slice(1, 8).map((p, idx) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className={`shrink-0 w-[220px] rounded-[18px] overflow-hidden press-feedback card-enter card-enter-${(idx % 7) + 2}`}
                      style={{ background: "var(--card)", scrollSnapAlign: "start" }}
                    >
                      <div className="relative h-[150px]" style={{ background: "var(--sand)" }}>
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        )}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: p.fill.spotsLeft <= 2 ? "var(--coral)" : "var(--lime)", color: p.fill.spotsLeft <= 2 ? "white" : "#1C1C1E" }}>
                            {p.fill.spotsLeft <= 2 ? `${p.fill.spotsLeft} left!` : `${p.fill.fillPct}% full`}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="text-[14px] font-bold truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.vendor.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.vendor.imageUrl} alt="" className="w-[14px] h-[14px] rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-[14px] h-[14px] rounded-full shrink-0 flex items-center justify-center text-[7px] font-bold text-white" style={{ background: "var(--text-muted)" }}>{p.vendor.name.charAt(0)}</div>
                          )}
                          <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{fmt(p.groupPrice)}</span>
                          <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-extrabold mt-2" style={{ color: "var(--text)" }}>
                          <span>{p.fill.joined > 0 ? `${p.fill.joined}/${p.minPoolSize} in` : `${p.minPoolSize} spots`}</span>
                          <span style={{ color: "var(--gold)" }}>Save {Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100)}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <span className="flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            {userArea ? `${userArea}` : "Nearby"}
                          </span>
                          {p.poolDeadline && (() => {
                            const mins = Math.max(0, Math.round((new Date(p.poolDeadline).getTime() - Date.now()) / 60000));
                            return mins > 0 ? <span style={{ color: "var(--coral)" }}>{mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m left`}</span> : null;
                          })()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Demand signal — section breaker ── */}
          {inCategoryMode && <div className="px-5 mt-6">
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "ChopDrop", text: "What food do you want near you?", url: window.location.href }).catch(() => {});
                }
              }}
              className="w-full flex items-center gap-3 p-4 rounded-[16px] min-h-[56px] press-feedback cursor-pointer text-left"
              style={{ background: "var(--lime)" }}
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="#1C1C1E" strokeWidth="1.4" strokeLinecap="round" className="shrink-0"><path d="M5 11.667c0 2.163.702 4.269 2 6 .265.353.66.587 1.098.65.437.062.882-.052 1.235-.317.354-.265.588-.66.65-1.098.063-.437-.051-.882-.316-1.235A6.644 6.644 0 018.333 11.667M5 11.667h1.667m1.666 0h.834c2.534-.066 5.012.76 7 2.333.124.093.271.15.425.163.154.014.31-.015.448-.084.138-.07.255-.176.336-.308.081-.131.125-.283.125-.438V3.333c0-.155-.044-.306-.125-.438a.832.832 0 00-.336-.308.834.834 0 00-.448-.084.834.834 0 00-.425.164c-1.989 1.573-4.466 2.398-7 2.333H6.667 4.167c-.442 0-.866.176-1.179.488A1.667 1.667 0 002.5 6.667V10c0 .442.176.866.488 1.179.313.312.737.488 1.179.488H5m3.333 0H6.667m0-6.667v6.667" /></svg>
              <div>
                <p className="text-[14px] font-extrabold" style={{ color: "var(--text)" }}>Craving something else?</p>
                <p className="text-[12px] font-semibold" style={{ color: "var(--text)", opacity: 0.7 }}>Tell us what {activeCategory.toLowerCase()} you want near you</p>
              </div>
            </button>
          </div>}

          {/* ═══ TOP SELLERS — horizontal image cards ═══ */}
          {inCategoryMode && filteredStores.length > 0 && (
            <section className="mt-6">
              <div className="px-5 flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                  Top sellers{userArea ? ` near ${userArea}` : ""}
                </h3>
                <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{filteredStores.length} stores</span>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <div className="flex gap-3 px-5 pb-1 w-max" style={{ scrollSnapType: "x mandatory" }}>
                  {filteredStores.map((store, idx) => (
                    <Link key={store.id} href={`/store/${store.id}`} className={`shrink-0 w-[160px] press-feedback card-enter card-enter-${(idx % 8) + 1}`} style={{ scrollSnapAlign: "start" }}>
                      <div className="w-[160px] h-[160px] rounded-[18px] overflow-hidden" style={{ background: "var(--sand)" }}>
                        {(store.imageUrl || store.heroImage) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={store.imageUrl || store.heroImage || ""} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[28px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{store.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <h4 className="text-[13px] font-bold mt-2 truncate" style={{ color: "var(--text)" }}>{store.name}</h4>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{store.deliveryEstimate}{store.orderCount > 0 ? ` · ${store.orderCount}+ orders` : ""}</p>
                      {store.bestSaving > 0 && (
                        <span className="text-[10px] font-bold inline-block mt-0.5" style={{ color: "var(--gold)" }}>Up to {store.bestSaving}% off</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══ MORE DEALS — 2-column grid for remaining pools ═══ */}
          {inCategoryMode && sortedPools.length > 8 && (
            <div className="px-5 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>More deals</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sortedPools.slice(8).map((p) => (
                  <Link key={`grid-${p.id}`} href={`/product/${p.id}`} className="rounded-[16px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
                    <div className="h-[130px]" style={{ background: "var(--sand)" }}>
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-[12px] font-bold truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {p.vendor.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.vendor.imageUrl} alt="" className="w-[12px] h-[12px] rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-[12px] h-[12px] rounded-full shrink-0 flex items-center justify-center text-[6px] font-bold text-white" style={{ background: "var(--text-muted)" }}>{p.vendor.name.charAt(0)}</div>
                        )}
                        <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[16px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{fmt(p.groupPrice)}</span>
                        <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{p.fill.joined > 0 ? `${p.fill.joined} joined` : `${p.minPoolSize} needed`}</span>
                        {p.poolDeadline && (() => {
                          const mins = Math.max(0, Math.round((new Date(p.poolDeadline).getTime() - Date.now()) / 60000));
                          return mins > 0 ? <span className="text-[10px] font-bold" style={{ color: "var(--coral)" }}>{mins > 60 ? `${Math.floor(mins / 60)}h` : `${mins}m`}</span> : null;
                        })()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state — actionable ── */}
          {inCategoryMode && filteredStores.length === 0 && sortedPools.length === 0 && (
            <div className="py-16 text-center px-8">
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
                {searchQuery ? `Nothing for "${searchQuery}"` : "No deals yet"}
              </h2>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
                {searchQuery ? "Try something else." : "Be the first to start a pool. New deals drop daily."}
              </p>
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery("")} className="text-[13px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>Clear search</button>
              ) : (
                <button type="button" onClick={() => { setActiveCategory("Food"); setSearchQuery(""); }} className="h-11 px-6 rounded-full text-[13px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>Browse all deals</button>
              )}
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
