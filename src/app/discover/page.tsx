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

function StoreImage({ src, alt, height }: { src: string | null; alt: string; height: number }) {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  if (failed || !src) {
    return (
      <div className="w-full flex items-end px-4 pb-3" style={{ height, background: "var(--sand)" }}>
        <span className="text-[14px] font-bold" style={{ color: "var(--text-muted)" }}>{alt}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-full object-cover block" style={{ height }} onError={handleError} />
  );
}

const CATEGORIES = ["Food", "Electronics", "Fashion", "Groceries"];
const AVATAR_COLORS = ["#17271F", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];
const AREA_SUGGESTIONS = ["Victoria Island", "Lekki", "Ikeja", "Yaba", "Marina", "Surulere", "Ikoyi", "Ajah", "Gbagada", "Maryland", "Magodo", "Festac", "Apapa"];

// Simulated pool fill data — anonymous counts only, no fake names
function poolFill(id: string, idx: number, minSize: number) {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1) + (id.charCodeAt(Math.floor(id.length / 2)) || 0) + idx * 7;
  const fillPct = 0.6 + ((seed % 4) * 0.1);
  const joined = Math.max(2, Math.min(minSize - 1, Math.round(minSize * fillPct)));
  const hours = [1, 2, 3, 4, 6][seed % 5];
  return { joined, spotsLeft: minSize - joined, hours, fillPct: Math.round((joined / minSize) * 100) };
}

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [poolProducts, setPoolProducts] = useState<PoolProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen] = useState(true); // Always visible per design
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
    fill: poolFill(p.id, idx, p.minPoolSize),
  })).sort((a, b) => b.fill.fillPct - a.fill.fillPct);

  const fillingNow = sortedPools.filter((p) => p.fill.fillPct >= 60);
  const allPools = sortedPools.filter((p) => p.fill.fillPct < 60);

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
              <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
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

        {/* Row 2: Location pill */}
        <div className="px-5 pb-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAreaOpen(!areaOpen)}
            className="flex items-center gap-1.5 h-[30px] px-3 rounded-full text-[12px] font-bold cursor-pointer"
            style={{ background: "#17271F", color: "white" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {userArea || "Set location"}
          </button>
        </div>

        {/* Category tabs removed — single feed for now */}
      </header>

      {/* ── Location panel ── */}
      {areaOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => { setAreaOpen(false); setAreaInput(""); }}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.3)" }} />
          <div className="absolute top-[52px] left-5 right-5 max-w-[480px] mx-auto rounded-[12px] p-4 sheet-enter" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text)" }}>Where should we deliver?</p>
            <button type="button" onClick={useMyLocation} disabled={locating} className="w-full h-11 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer mb-3 disabled:opacity-50" style={{ background: "var(--emerald)", color: "white" }}>
              {locating ? "Finding you..." : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>Use my location</>}
            </button>
            <input type="text" placeholder="Or type your area, e.g. Lekki Phase 1" value={areaInput} onChange={(e) => setAreaInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && areaInput.trim()) saveLocation(areaInput.trim()); }} className="w-full h-11 px-4 rounded-[8px] text-[13px] font-medium outline-none mb-2" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} autoFocus />
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
            <h1 className="font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "34px", lineHeight: "108%", letterSpacing: "-0.8px", color: "#17271F" }}>
              {activeCategory === "Food" ? "Oya, what\u2019s for lunch?" : activeCategory === "Electronics" ? "Oya, what\u2019s the gadget?" : activeCategory === "Fashion" ? "Oya, what\u2019s the drip?" : "Oya, what do you need?"}
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              Good food costs less with your people.
            </p>
          </div>

          {/* ── Search — always visible ── */}
          <div className="px-5 mt-3 mb-4">
            <div className="relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text" placeholder="Find food, vendors, or a pool" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[44px] pl-10 pr-11 rounded-full text-[14px] font-medium outline-none"
                style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute right-3.5 top-1/2 -translate-y-1/2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
            </div>
          </div>

          {/* ── Section header with personality ── */}
          {sortedPools.length > 0 && (
            <div className="px-5 mt-4 mb-1 flex items-center justify-between">
              <h3 className="text-[21px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Almost full. Don&apos;t dull.</h3>
              <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{sortedPools.length} live pool{sortedPools.length !== 1 ? "s" : ""}</span>
            </div>
          )}
          {sortedPools.length > 0 && (
            <p className="px-5 text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>Highest fill rate first</p>
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
                style={{ background: "#17271F" }}
              >
                {/* Badges + Food image */}
                <div className="relative">
                  {featured.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.imageUrl} alt={featured.name} className="w-full h-[220px] object-cover" />
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isHot && (
                      <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide text-white" style={{ background: "rgba(0,0,0,0.65)", padding: "6px 10px" }}>
                        Only {featured.fill.spotsLeft} spot{featured.fill.spotsLeft !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide text-white" style={{ background: "var(--coral)", padding: "6px 10px" }}>
                      Save {sav}%
                    </span>
                  </div>
                </div>
                {/* Info on dark */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[23px] font-extrabold leading-[145%] text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{featured.name}</h4>
                      <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{featured.vendor.name} · <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.9</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[32px] font-extrabold tabular-nums leading-none text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px" }}>{fmt(featured.groupPrice)}</span>
                      <p className="text-[13px] line-through tabular-nums mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(featured.retailPrice)}</p>
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <span>{featured.fill.joined}/{featured.minPoolSize} plates claimed</span>
                    <span style={{ color: "var(--emerald)" }}>{featured.fill.hours > 0 ? `${featured.fill.hours * 60}m left` : "Ending soon"}</span>
                  </div>
                  <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${featured.fill.fillPct}%`,
                      background: isHot ? "var(--coral)" : "var(--lime)",
                    }} />
                  </div>
                  {/* Pickup location */}
                  <div className="flex items-center gap-1.5 mt-2.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {userArea ? `${userArea} pickup` : "Pickup location TBD"}
                  </div>
                  {/* Social proof — avatar circles */}
                  {featured.fill.joined >= 2 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-1.5">
                        {Array.from({ length: Math.min(featured.fill.joined, 3) }).map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], border: "2px solid #17271F" }}>
                            {String.fromCharCode(65 + ((featured.id.charCodeAt(i) + i) % 26))}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{featured.fill.joined} people are in</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })()}

          {/* ═══ REMAINING POOLS — compact cards with full info ═══ */}
          {sortedPools.length > 1 && (
            <div className="px-5 mt-4 flex flex-col divide-y" style={{ "--tw-divide-opacity": 1, borderColor: "var(--border)" } as React.CSSProperties}>
              {sortedPools.slice(1).map((p, idx) => {
                const isHot = p.fill.spotsLeft <= 2;
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className={`flex gap-3 py-4 press-feedback card-enter card-enter-${(idx % 7) + 2}`}
                  >
                    <div className="w-[82px] h-[86px] rounded-[16px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[17px] font-extrabold leading-[145%] truncate" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{p.name}</h4>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)", lineHeight: "145%" }}>{p.vendor.name} · <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--coral)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.8</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[20px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "var(--coral)" }}>{fmt(p.groupPrice)}</span>
                        <span className="text-[12px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                      </div>
                      {/* Progress */}
                      <div className="flex items-center justify-between mt-2 text-[11px] font-bold" style={{ color: "var(--text-secondary)" }}>
                        <span>{p.fill.joined}/{p.minPoolSize} plates claimed</span>
                        <span style={{ color: "var(--coral)" }}>{p.fill.hours}h {(p.fill.hours * 20) % 60}m</span>
                      </div>
                      <div className="mt-1 h-[7px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
                        <div className="h-full rounded-full" style={{ width: `${p.fill.fillPct}%`, background: "var(--coral)" }} />
                      </div>
                      {/* Pickup */}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {userArea ? `${userArea} pickup` : "Pickup TBD"}
                      </div>
                      {/* Social proof */}
                      <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--text)", lineHeight: "145%" }}>{p.fill.joined} people are in</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ═══ STORES — secondary, compact ═══ */}
          {filteredStores.length > 0 && (
            <section className="mt-8">
              <div className="px-5 mb-2">
                <h3 className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>Stores{userArea ? ` in ${userArea}` : ""}</h3>
              </div>
              <div className="px-5 flex flex-col gap-3">
                {filteredStores.map((store, idx) => (
                  <Link key={store.id} href={`/store/${store.id}`} className={`flex gap-3 items-center press-feedback card-enter card-enter-${(idx % 8) + 1}`}>
                    <div className="w-14 h-14 rounded-[10px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                      {store.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.heroImage} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold truncate" style={{ color: "var(--text)" }}>{store.name}</h4>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{store.deliveryEstimate} · {store.orderCount}+ orders</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                  </Link>
                ))}
              </div>
            </section>
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
                <Link href="/pools" className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse stores</Link>
              )}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
