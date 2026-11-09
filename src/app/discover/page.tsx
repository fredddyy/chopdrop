"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Store {
  id: string;
  name: string;
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
  vendor: { name: string };
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


const AVATAR_COLORS = ["#1C1C1E", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];
const AREA_SUGGESTIONS = ["Victoria Island", "Lekki", "Ikeja", "Yaba", "Marina", "Surulere", "Ikoyi", "Ajah", "Gbagada", "Maryland", "Magodo", "Festac", "Apapa"];

// Real pool state from API data
function poolState(minSize: number, memberCount: number) {
  const joined = memberCount;
  return { joined, spotsLeft: minSize - joined, hours: 6, fillPct: minSize > 0 ? Math.round((joined / minSize) * 100) : 0 };
}

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [poolProducts, setPoolProducts] = useState<PoolProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userArea, setUserArea] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [locating, setLocating] = useState(false);
  const cart = useCart();

  // Read profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.areaName) setUserArea(p.areaName);
        if (p.deliveryAddress) setUserAddress(p.deliveryAddress);
        if (p.name) setUserName(p.name);
      }
    } catch {}
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
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData(signal?: AbortSignal) {
    setLoading(true);
    setError(false);
    try {
      const [storesResult, productsResult] = await Promise.allSettled([
        fetch(`/api/stores?category=${activeCategory}`, { signal }).then((r) => r.json()),
        fetch(`/api/products?category=${activeCategory}&limit=20`, { signal }).then((r) => r.json()),
      ]);
      if (storesResult.status === "fulfilled" && storesResult.value.success) {
        setStores(storesResult.value.data);
      }
      if (productsResult.status === "fulfilled" && productsResult.value.success) {
        const withSavings = (productsResult.value.data as PoolProduct[]).filter(
          (p) => p.groupPrice < p.retailPrice && p.imageUrl,
        );
        setPoolProducts(withSavings);
      }
      if (storesResult.status === "rejected" && productsResult.status === "rejected") {
        setError(true);
      }
    } catch (e) {
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
    // Sort by savings percentage (best deals first)
    const savA = ((a.retailPrice - a.groupPrice) / a.retailPrice);
    const savB = ((b.retailPrice - b.groupPrice) / b.retailPrice);
    return savB - savA;
  });

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header — ChopChop style ── */}
      <header className="sticky top-0 z-40" style={{ background: "var(--bg)" }}>
        {/* Row 1: Label + Wordmark + Actions */}
        <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Discover</p>
              <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#1C1C1E", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Chop<span style={{ color: "var(--coral)" }}>Drop</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/cart" className="relative w-10 h-10 rounded-full flex items-center justify-center">
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
            style={{ background: "#1C1C1E", color: "white" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
            {userArea || "UNILAG"} · {userAddress?.split(",")[0] || "Set location"}
          </button>
          <Link href="/rewards" className="flex items-center gap-1 h-[30px] px-3 rounded-full text-[11px] font-bold" style={{ background: "#1C1C1E", color: "white" }}>
            280 pts
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" /><path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /></svg>
          </Link>
        </div>

        {/* Category tabs removed — single feed for now */}
      </header>

      {/* ── Location panel ── */}
      {areaOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Set delivery location" onClick={() => { setAreaOpen(false); setAreaInput(""); }} onKeyDown={(e) => { if (e.key === "Escape") { setAreaOpen(false); setAreaInput(""); } }}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.3)" }} />
          <div className="absolute top-[52px] left-5 right-5 max-w-[480px] mx-auto rounded-[12px] p-4 sheet-enter" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text)" }}>Where should we deliver?</p>
            <button type="button" onClick={useMyLocation} disabled={locating} className="w-full h-11 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer mb-3 disabled:opacity-50" style={{ background: "var(--emerald)", color: "white" }}>
              {locating ? "Finding you..." : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>Use my location</>}
            </button>
            <input type="text" placeholder="Or type your area, e.g. Lekki Phase 1" value={areaInput} onChange={(e) => setAreaInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && areaInput.trim()) saveLocation(areaInput.trim()); }} className="w-full h-11 px-4 rounded-[8px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] mb-2" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
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
          {/* ── Hero Greeting — Bricolage Grotesque, Figma specs ── */}
          <div className="px-5 pt-5 pb-2">
            <h1 className="font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "34px", lineHeight: "108%", letterSpacing: "-0.8px", color: "#1C1C1E" }}>
              {activeCategory === "Food" ? "Oya, what\u2019s for lunch?" : activeCategory === "Electronics" ? "Oya, what\u2019s the gadget?" : activeCategory === "Fashion" ? "Oya, what\u2019s the drip?" : "Oya, what do you need?"}
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              {activeCategory === "Food" ? "Good food costs less with your people." : activeCategory === "Fashion" ? "Better drip, better price — together." : "Pool together, pay less."}
            </p>
          </div>

          {/* ── Category tabs — SVG icons, no emoji ── */}
          <div className="px-5 mt-2 flex gap-2 overflow-x-auto hide-scrollbar">
            {[
              { key: "Food", label: "Food", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><path d="M6 1v3M10 1v3M14 1v3" /></svg> },
              { key: "Fashion", label: "Fashion", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.3 2h11.4L22 8l-10 14L2 8z" /></svg> },
              { key: "Electronics", label: "Gadgets", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg> },
              { key: "Groceries", label: "Groceries", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></svg> },
            ].map((cat) => (
              <button
                key={cat.key} type="button" onClick={() => setActiveCategory(cat.key)}
                className="h-[34px] px-4 rounded-full text-[13px] font-bold whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
                style={{ background: activeCategory === cat.key ? "#1C1C1E" : "var(--sand)", color: activeCategory === cat.key ? "white" : "var(--text-secondary)", transition: "background 200ms, color 200ms" }}
              >{cat.icon}{cat.label}</button>
            ))}
          </div>

          {/* ── Search — always visible ── */}
          <div className="px-5 mt-3 mb-2">
            <div className="relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text" placeholder={`Search ${activeCategory.toLowerCase()}, vendors, or pools...`} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[44px] pl-10 pr-11 rounded-full text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute right-3.5 top-1/2 -translate-y-1/2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
            </div>
            {searchQuery.length === 1 && (
              <p className="text-[10px] mt-1 ml-4" style={{ color: "var(--coral)" }}>Type one more letter to search</p>
            )}
          </div>

          {/* ── Section header ── */}
          {sortedPools.length > 0 && (
            <div className="px-5 mt-5 mb-2 flex items-center justify-between">
              <h3 className="text-[21px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Almost full. Don&apos;t dull.</h3>
              <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{sortedPools.length} live</span>
            </div>
          )}

          {/* ═══ FEATURED POOL CARD — dark hero, ChopChop style ═══ */}
          {sortedPools.length > 0 && (() => {
            const featured = sortedPools[0];
            const sav = Math.round(((featured.retailPrice - featured.groupPrice) / featured.retailPrice) * 100);
            const isHot = featured.fill.spotsLeft <= 3;
            return (
              <Link
                href={`/product/${featured.id}`}
                className="mx-5 block rounded-[22px] overflow-hidden press-feedback card-enter card-enter-1"
                style={{ background: "#1C1C1E" }}
              >
                {/* Badges + Food image */}
                <div className="relative">
                  {featured.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.imageUrl} alt={featured.name} className="w-full h-[220px] object-cover" />
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isHot && (
                      <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "var(--lime)", color: "#1C1C1E", padding: "6px 10px" }}>
                        Only {featured.fill.spotsLeft} spot{featured.fill.spotsLeft !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "#FFE9DD", color: "#1C1C1E", padding: "6px 10px" }}>
                      Save {sav}%
                    </span>
                  </div>
                </div>
                {/* Info on dark */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[23px] font-extrabold leading-[145%] text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{featured.name}</h4>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--subdued)" }}>{featured.vendor.name} · <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.9</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[32px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--gold)" }}>{fmt(featured.groupPrice)}</span>
                      <p className="text-[13px] line-through tabular-nums mt-0.5" style={{ color: "var(--subdued)" }}>{fmt(featured.retailPrice)}</p>
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold" style={{ color: "white" }}>
                    <span>{featured.fill.joined > 0 ? `${featured.fill.joined}/${featured.minPoolSize} ${activeCategory === "Food" ? "plates claimed" : "spots filled"}` : `${featured.minPoolSize} spots · Be first to join`}</span>
                    <span style={{ color: "var(--lime)" }}>Save {sav}%</span>
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
                    {userArea ? `${userArea} pickup` : "Pickup location TBD"}
                  </div>
                  {/* Social proof — avatar circles */}
                  {featured.fill.joined >= 2 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-1.5">
                        {Array.from({ length: Math.min(featured.fill.joined, 3) }).map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], border: "2px solid #1C1C1E" }}>
                            {String.fromCharCode(65 + ((featured.id.charCodeAt(i) + i) % 26))}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--subdued)" }}>{featured.fill.joined} people are in</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })()}

          {/* ═══ FILLING FAST — horizontal swipe carousel ═══ */}
          {sortedPools.length > 1 && (
            <div className="mt-5">
              <div className="px-5 flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Filling fast</h3>
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
                        <h4 className="text-[14px] font-bold truncate" style={{ color: "#1C1C1E" }}>{p.name}</h4>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{fmt(p.groupPrice)}</span>
                          <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-extrabold mt-2" style={{ color: "#1C1C1E" }}>
                          <span>{p.fill.joined > 0 ? `${p.fill.joined}/${p.minPoolSize} in` : `${p.minPoolSize} spots`}</span>
                          <span style={{ color: "var(--gold)" }}>Save {Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {userArea ? `${userArea} · ${5 + (idx * 3) % 15} min` : "Pickup TBD"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Demand signal — section breaker ── */}
          <div className="px-5 mt-6">
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
                <p className="text-[14px] font-extrabold" style={{ color: "#1C1C1E" }}>Craving something else?</p>
                <p className="text-[12px] font-semibold" style={{ color: "#1C1C1E", opacity: 0.7 }}>Tell us what {activeCategory.toLowerCase()} you want near you</p>
              </div>
            </button>
          </div>

          {/* ═══ TOP KITCHENS — horizontal image cards ═══ */}
          {filteredStores.length > 0 && (
            <section className="mt-6">
              <div className="px-5 flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
                  {activeCategory === "Food" ? "Top kitchens" : "Top stores"}{userArea ? ` near ${userArea}` : ""}
                </h3>
                <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{filteredStores.length} stores</span>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <div className="flex gap-3 px-5 pb-1 w-max" style={{ scrollSnapType: "x mandatory" }}>
                  {filteredStores.map((store, idx) => (
                    <Link key={store.id} href={`/store/${store.id}`} className={`shrink-0 w-[160px] press-feedback card-enter card-enter-${(idx % 8) + 1}`} style={{ scrollSnapAlign: "start" }}>
                      <div className="w-[160px] h-[160px] rounded-[18px] overflow-hidden" style={{ background: "var(--sand)" }}>
                        {store.heroImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={store.heroImage} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[28px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{store.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <h4 className="text-[13px] font-bold mt-2 truncate" style={{ color: "#1C1C1E" }}>{store.name}</h4>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{store.deliveryEstimate} · {store.orderCount}+ orders</p>
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
          {sortedPools.length > 8 && (
            <div className="px-5 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>More deals</h3>
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
                      <h4 className="text-[12px] font-bold truncate" style={{ color: "#1C1C1E" }}>{p.name}</h4>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[16px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{fmt(p.groupPrice)}</span>
                        <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                      </div>
                      <p className="text-[10px] font-bold mt-1" style={{ color: "var(--text-muted)" }}>{p.fill.spotsLeft} spot{p.fill.spotsLeft !== 1 ? "s" : ""} left · {p.minPoolSize} needed</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state — actionable ── */}
          {filteredStores.length === 0 && sortedPools.length === 0 && (
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
