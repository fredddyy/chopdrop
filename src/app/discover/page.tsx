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
  const [searchOpen, setSearchOpen] = useState(false);
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

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[18px] font-extrabold tracking-[-0.03em] shrink-0" style={{ color: "var(--text)" }}>
              Chop<span style={{ color: "var(--coral)" }}>Drop</span>
            </span>
            <button
              type="button"
              onClick={() => setAreaOpen(!areaOpen)}
              className="flex items-center gap-1 h-7 px-2.5 rounded-[6px] text-[12px] font-bold truncate max-w-[140px] cursor-pointer"
              style={{ background: "var(--sand)", color: userArea ? "var(--text)" : "var(--text-muted)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span className="truncate">{userArea || "Set location"}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="shrink-0"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer" style={{ background: searchOpen ? "var(--dark)" : "transparent" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? "white" : "var(--text)"} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
            <Link href="/cart" className="relative w-11 h-11 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              {cart.totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold text-white px-1" style={{ background: "var(--coral-dark)" }}>
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="px-5 pb-3">
            <input
              type="text" placeholder="Search deals and stores..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} autoFocus
              className="w-full h-11 px-4 rounded-[8px] text-[14px] font-medium outline-none"
              style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>
        )}

        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat} type="button" onClick={() => setActiveCategory(cat)}
              className="h-[36px] px-4 rounded-[8px] text-[13px] font-bold whitespace-nowrap cursor-pointer shrink-0"
              style={{
                background: activeCategory === cat ? "var(--dark)" : "var(--sand)",
                color: activeCategory === cat ? "white" : "var(--text-secondary)",
                transition: "background 200ms, color 200ms",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
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
          <div className="h-6 rounded w-[55%] mb-1" style={{ background: "var(--sand)" }} />
          <div className="h-4 rounded w-[40%] mb-5" style={{ background: "var(--sand)" }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 mb-4 p-3 rounded-[12px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-[80px] h-[80px] rounded-[12px] shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120}ms` }} />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 rounded w-[70%]" style={{ background: "var(--sand)" }} />
                <div className="h-3 rounded w-[50%]" style={{ background: "var(--sand)" }} />
                <div className="h-5 rounded w-[35%]" style={{ background: "var(--sand)" }} />
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
          {/* ── Greeting ── */}
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text)" }}>
              {userName ? <>Hey {userName}</> : "Hey"} <span className="font-normal">👋</span>
            </h2>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {sortedPools.length > 0 ? `${sortedPools.length} deal${sortedPools.length !== 1 ? "s" : ""} active${userArea ? ` in ${userArea}` : ""}` : `Browse ${activeCategory.toLowerCase()} near you`}
            </p>
          </div>

          {/* ═══ FILLING NOW — pools sorted by fill rate, most full first ═══ */}
          {fillingNow.length > 0 && (
            <section className="mt-4">
              <div className="px-5 mb-2 flex items-center justify-between">
                <h3 className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>Filling now</h3>
                <Link href="/pools" className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>View all</Link>
              </div>
              <div className="px-5 flex flex-col gap-2.5">
                {fillingNow.map((p, idx) => {
                  const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                  const isHot = p.fill.spotsLeft <= 2;
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className={`flex gap-3 p-3 rounded-[12px] press-feedback card-enter card-enter-${idx + 1}`}
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <PoolImage src={p.imageUrl} alt={p.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] shrink-0" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>-{sav}%</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ color: "var(--text)" }}>{fmt(p.groupPrice)}</span>
                          <span className="text-[12px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                            <div className="h-full rounded-full" style={{
                              width: `${p.fill.fillPct}%`,
                              background: isHot ? "var(--coral)" : "var(--emerald)",
                              ...(isHot ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
                            }} />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: isHot ? "var(--coral)" : "var(--text-muted)" }}>
                            {isHot ? `${p.fill.spotsLeft} left` : `${p.fill.joined}/${p.minPoolSize}`}
                          </span>
                          <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{p.fill.hours}h</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ ALL POOLS — remaining deals ═══ */}
          {allPools.length > 0 && (
            <section className="mt-6">
              <div className="px-5 mb-2">
                <h3 className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>All deals</h3>
              </div>
              <div className="px-5 flex flex-col gap-2.5">
                {allPools.map((p, idx) => {
                  const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className={`flex gap-3 p-3 rounded-[12px] press-feedback card-enter card-enter-${(idx % 8) + 1}`}
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <PoolImage src={p.imageUrl} alt={p.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] shrink-0" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>-{sav}%</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ color: "var(--text)" }}>{fmt(p.groupPrice)}</span>
                          <span className="text-[12px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                            <div className="h-full rounded-full" style={{ width: `${p.fill.fillPct}%`, background: "var(--emerald)" }} />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
                            {p.fill.joined}/{p.minPoolSize}
                          </span>
                          <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{p.fill.hours}h</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ STORES — secondary, compact ═══ */}
          {filteredStores.length > 0 && (
            <section className="mt-8">
              <div className="px-5 mb-2">
                <h3 className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>Stores{userArea ? ` in ${userArea}` : ""}</h3>
              </div>
              <div className="px-5 flex flex-col gap-3">
                {filteredStores.map((store, idx) => (
                  <Link
                    key={store.id}
                    href={`/store/${store.id}`}
                    className={`flex gap-3 items-center press-feedback card-enter card-enter-${(idx % 8) + 1}`}
                  >
                    <div className="w-14 h-14 rounded-[10px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                      {store.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.heroImage} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[14px] font-bold truncate" style={{ color: "var(--text)" }}>{store.name}</h4>
                        <span className="text-[12px] font-medium shrink-0 ml-2 flex items-center gap-0.5" style={{ color: "var(--text-secondary)" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--gold)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          {store.rating}
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{store.deliveryEstimate} · {store.orderCount}+ orders</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Empty state ── */}
          {filteredStores.length === 0 && sortedPools.length === 0 && (
            <div className="py-16 text-center px-8">
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
                {searchQuery ? `No results for "${searchQuery}"` : `No deals in ${activeCategory} yet`}
              </h2>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
                {searchQuery ? "Try a different search or browse a category." : "New deals drop every day. Check back soon."}
              </p>
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-[13px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>Clear search</button>
              )}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
