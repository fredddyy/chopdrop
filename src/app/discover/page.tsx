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

function CoverImage({ src, alt, height }: { src: string | null; alt: string; height: number }) {
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

// Simulated social proof — session-randomised so same user doesn't see identical names across products
const NAMES = ["Tolu", "Ada", "Chidi", "Ngozi", "Emeka", "Bimpe", "Kola", "Yemi", "Funke", "Dayo"];
const COLORS = ["#E8604C", "#0D9F5F", "#2563EB", "#D4A24E", "#0891B2", "#D946EF"];

// Session seed — changes per browser session, not per product
const SESSION_SEED = typeof window !== "undefined"
  ? (parseInt(sessionStorage.getItem("chopdrop-ss") || "0", 10) || (() => { const s = Math.floor(Math.random() * 10000); sessionStorage.setItem("chopdrop-ss", String(s)); return s; })())
  : 0;

function poolSocial(id: string, idx: number, minSize: number) {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1) + (id.charCodeAt(Math.floor(id.length / 2)) || 0) + idx * 7 + SESSION_SEED;
  const fillPct = 0.6 + ((seed % 4) * 0.1);
  const joined = Math.max(2, Math.min(minSize - 1, Math.round(minSize * fillPct)));
  const starter = NAMES[seed % NAMES.length];
  const hours = [1, 2, 3, 4, 6][seed % 5];
  const others = joined - 1;
  return { starter, starterColor: COLORS[seed % COLORS.length], joined, spotsLeft: minSize - joined, hours, others };
}

function storePoolCount(id: string, orderCount: number): number {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return orderCount > 100 ? (seed % 8) + 5 : orderCount > 50 ? (seed % 5) + 2 : 0;
}

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [poolProducts, setPoolProducts] = useState<PoolProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joinConfirm, setJoinConfirm] = useState<PoolProduct | null>(null);
  const [joinToast, setJoinToast] = useState<string | null>(null);
  const [userArea, setUserArea] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [locating, setLocating] = useState(false);
  const cart = useCart();

  // Read area + address from profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.areaName) setUserArea(p.areaName);
        if (p.deliveryAddress) setUserAddress(p.deliveryAddress);
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

  // Close join sheet on Escape key or Android back button
  useEffect(() => {
    if (!joinConfirm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setJoinConfirm(null); };
    const onPop = () => setJoinConfirm(null);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("popstate", onPop); };
  }, [joinConfirm]);

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
        setPoolProducts(withSavings.slice(0, 6));
      }
      // Only show error if BOTH failed
      if (storesResult.status === "rejected" && productsResult.status === "rejected") {
        setError(true);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
    }
    if (signal?.aborted) return;
    setLoading(false);
  }

  // Search filters BOTH pools and stores
  const q = searchQuery.trim().toLowerCase();
  const filteredStores = q.length >= 2
    ? stores.filter((s) => s.name.toLowerCase().includes(q))
    : stores;
  const filteredPools = q.length >= 2
    ? poolProducts.filter((p) => p.name.toLowerCase().includes(q) || p.vendor.name.toLowerCase().includes(q))
    : poolProducts;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header — solid background, no glassmorphism ── */}
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
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: searchOpen ? "var(--dark)" : "transparent" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? "white" : "var(--text)"} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <Link href="/cart" className="relative w-11 h-11 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round">
                <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
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
            <div className="relative">
              <input
                type="text" placeholder="Search deals and stores..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                className="w-full h-11 px-4 pr-10 rounded-[8px] text-[14px] font-medium outline-none"
                style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--border)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {/* Search filters at 2+ chars — no patronising hint needed */}
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

            {/* Use my location */}
            <button
              type="button" onClick={useMyLocation} disabled={locating}
              className="w-full h-11 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer mb-3 disabled:opacity-50"
              style={{ background: "var(--emerald)", color: "white" }}
            >
              {locating ? (
                "Finding you..."
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
                  Use my location
                </>
              )}
            </button>

            {/* Manual input */}
            <input
              type="text" placeholder="Or type your area, e.g. Lekki Phase 1" value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && areaInput.trim()) { saveLocation(areaInput.trim()); } }}
              className="w-full h-11 px-4 rounded-[8px] text-[13px] font-medium outline-none mb-2"
              style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
              autoFocus
            />

            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {areaSuggestions.slice(0, 8).map((a) => (
                <button
                  key={a} type="button" onClick={() => saveLocation(a)}
                  className="h-8 px-3 rounded-[6px] text-[12px] font-bold cursor-pointer"
                  style={{
                    background: userArea === a ? "var(--dark)" : "var(--sand)",
                    color: userArea === a ? "white" : "var(--text-secondary)",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>

            {userAddress && (
              <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                Current: {userAddress}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="pt-4" aria-busy="true">
          {/* Pool skeleton — matches horizontal scroll shape */}
          <div className="px-5 mb-2"><div className="h-5 rounded w-[45%]" style={{ background: "var(--sand)" }} /></div>
          <div className="flex gap-3 overflow-hidden pl-5 pr-3 mb-6">
            {[0, 1].map((i) => (
              <div key={i} className="w-[270px] shrink-0 rounded-[8px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-[130px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 150}ms` }} />
                <div className="p-3 space-y-2">
                  <div className="h-4 rounded w-[60%]" style={{ background: "var(--sand)" }} />
                  <div className="h-5 rounded w-[40%]" style={{ background: "var(--sand)" }} />
                </div>
              </div>
            ))}
          </div>
          {/* Store skeleton */}
          <div className="px-5 flex flex-col gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="rounded-[16px] overflow-hidden h-[150px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120}ms` }} />
                <div className="mt-2.5 space-y-2">
                  <div className="h-4 rounded w-[50%]" style={{ background: "var(--sand)" }} />
                  <div className="h-3 rounded w-[65%]" style={{ background: "var(--sand)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* ── Error state — retry CTA for Lagos 3G ── */
        <div className="py-20 text-center px-8">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
            Couldn&apos;t load deals
          </h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => fetchData()}
            className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white cursor-pointer"
            style={{ background: "var(--coral)" }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div>

          {/* ── How it works — persistent, collapsible, teaches the mechanic ── */}
          {filteredPools.length > 0 && typeof window !== "undefined" && !sessionStorage.getItem("chopdrop-onboard") && (
            <div className="mx-5 mt-3 rounded-[12px] overflow-hidden tooltip-enter" style={{ background: "var(--dark)" }}>
              <button
                type="button"
                onClick={() => sessionStorage.setItem("chopdrop-onboard", "1")}
                className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                  </div>
                  <span className="text-[13px] font-bold text-white">How group deals work</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              <div className="px-4 pb-3.5 flex gap-3">
                {[
                  { n: "1", label: "Join a deal", sub: "Tap any deal below" },
                  { n: "2", label: "Group fills up", sub: "Share to fill faster" },
                  { n: "3", label: "Everyone saves", sub: "Didn\u2019t fill? Full refund" },
                ].map((s) => (
                  <div key={s.n} className="flex-1 text-center">
                    <div className="w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[11px] font-bold text-white mb-1" style={{ background: "rgba(255,255,255,0.12)" }}>
                      {s.n}
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight">{s.label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ GROUP DEALS — dark block, the visual peak ═══ */}
          {filteredPools.length > 0 && (
            <section className="mx-5 mt-3 rounded-[12px] overflow-hidden" style={{ background: "var(--dark)" }}>
              <div className="px-4 pt-5 pb-3">
                <h3 className="text-[20px] font-extrabold tracking-[-0.02em] text-white">Group deals{userArea ? ` in ${userArea}` : " near you"}</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {filteredPools.length} deal{filteredPools.length !== 1 ? "s" : ""} ending soon
                  </p>
                  <Link href="/pools" className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>View all</Link>
                </div>
              </div>

              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory" style={{ overscrollBehaviorX: "contain" }}>
                <div className="w-2.5 shrink-0" />
                {filteredPools.slice(0, 5).map((p, idx) => {
                  const social = poolSocial(p.id, idx, p.minPoolSize);
                  const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                  return (
                    <div
                      key={p.id}
                      className={`w-[250px] shrink-0 rounded-[8px] overflow-hidden snap-start card-enter card-enter-${idx + 1}`}
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      {/* Photo */}
                      <Link href={`/product/${p.id}`} className="block relative h-[120px]" style={{ background: "rgba(255,255,255,0.05)" }}>
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading={idx < 2 ? "eager" : "lazy"} />
                        )}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[4px] text-[11px] font-extrabold text-white" style={{ background: "var(--coral)" }}>
                          -{sav}%
                        </div>
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold text-white flex items-center gap-1" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <span className="pool-dot" />
                          {social.joined}/{p.minPoolSize}
                        </div>
                      </Link>
                      {/* Info */}
                      <div className="p-3">
                        <Link href={`/product/${p.id}`} className="block">
                          <h4 className="text-[13px] font-extrabold leading-tight truncate text-white">{p.name}</h4>
                          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{p.vendor.name}</p>
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[16px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{fmt(p.groupPrice)}</span>
                            <span className="text-[10px] line-through tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>{fmt(p.retailPrice)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`${p.name} for ${fmt(p.groupPrice)} on ChopDrop — ${sav}% off! Join the group:\n${typeof window !== "undefined" ? window.location.origin : ""}/product/${p.id}`)}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-[36px] h-[36px] rounded-[6px] flex items-center justify-center cursor-pointer press-feedback"
                              style={{ background: "rgba(255,255,255,0.12)" }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setJoinConfirm(p); }}
                              className="text-[11px] font-bold px-3 h-[36px] rounded-[6px] text-white cursor-pointer press-feedback"
                              style={{ background: "var(--emerald)" }}
                            >
                              Join
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold mt-1.5 tabular-nums" style={{ color: social.spotsLeft <= 2 ? "var(--coral)" : "rgba(255,255,255,0.35)" }}>
                          {social.spotsLeft <= 2 ? `${social.spotsLeft} spot${social.spotsLeft === 1 ? "" : "s"} left · ` : ""}{social.hours}h left
                        </p>
                        {/* Progress fill — pool momentum at a glance */}
                        <div className="mt-2 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${Math.round((social.joined / p.minPoolSize) * 100)}%`,
                            background: social.spotsLeft <= 2 ? "var(--coral)" : "var(--emerald)",
                            ...(social.spotsLeft <= 2 ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="w-4 shrink-0" />
              </div>
            </section>
          )}

          {/* ═══ STORES — borderless, Chowdeck-clean ═══ */}
          {filteredStores.length > 0 && (
            <section className="mt-8">
              <div className="px-5 mb-3">
                <h3 className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>Stores{userArea ? ` in ${userArea}` : " near you"}</h3>
              </div>
              <div className="px-5 flex flex-col gap-6">
                {filteredStores.map((store, idx) => {
                  const pooling = storePoolCount(store.id, store.orderCount);
                  return (
                    <Link
                      key={store.id}
                      href={`/store/${store.id}`}
                      className={`block press-feedback card-enter card-enter-${(idx % 8) + 1}`}
                    >
                      {/* Image — full width, generous radius, no card wrapper */}
                      <div className="relative rounded-[16px] overflow-hidden">
                        <CoverImage src={store.heroImage} alt={store.name} height={idx === 0 ? 180 : 150} />
                        {pooling > 0 && (
                          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--emerald)" }} />
                            {pooling} {pooling === 1 ? "group" : "groups"} active
                          </div>
                        )}
                      </div>

                      {/* Info — sits directly below, no card container */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between">
                          <h2 className="text-[16px] font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>
                            {store.name}
                          </h2>
                          <span className="text-[13px] font-semibold shrink-0 ml-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            {store.rating}
                          </span>
                        </div>
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {store.orderCount}+ orders · {store.deliveryEstimate}
                        </p>
                        {store.bestDealName && store.bestSaving >= 10 && (
                          <p className="text-[12px] font-bold mt-1" style={{ color: "var(--emerald)" }}>
                            {store.bestDealName} — save {fmt(store.lowestPrice - store.lowestGroupPrice)}
                            <span className="font-bold ml-1.5" style={{ color: "var(--coral)" }}>
                              {[2, 3, 4, 1, 5][(store.id.charCodeAt(0)) % 5]}h left
                            </span>
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {filteredStores.length === 0 && filteredPools.length === 0 && (
            <div className="py-16 text-center px-8">
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
                {searchQuery ? `No results for "${searchQuery}"` : `Nothing in ${activeCategory} yet`}
              </h2>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
                {searchQuery ? "Try a different search or browse a category." : "New vendors join every week."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[13px] font-bold cursor-pointer"
                  style={{ color: "var(--coral)" }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Join confirmation sheet — the focal delight moment ── */}
      {joinConfirm && (() => {
        const saved = joinConfirm.retailPrice - joinConfirm.groupPrice;
        return (
          <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Join group deal" onClick={() => setJoinConfirm(null)}>
            <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
            <div
              className="relative w-full max-w-[480px] rounded-t-[16px] p-5 sheet-enter"
              style={{ background: "var(--card)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
              <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>Join this group deal?</h3>

              {/* The delight: your savings, revealed with a counter animation */}
              <div className="mt-3 p-3 rounded-[8px] flex items-center justify-between" style={{ background: "var(--emerald-soft)" }}>
                <span className="text-[13px] font-bold" style={{ color: "var(--emerald)" }}>You save</span>
                <span className="text-[22px] font-extrabold tabular-nums savings-reveal" style={{ color: "var(--emerald)" }}>
                  {fmt(saved)}
                </span>
              </div>

              <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {fmt(joinConfirm.groupPrice)} for {joinConfirm.name}.
                When {joinConfirm.minPoolSize} people join, everyone gets this price.
                Didn&apos;t fill? Every kobo back.
              </p>

              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setJoinConfirm(null)}
                  className="flex-1 h-[50px] rounded-[8px] text-[14px] font-bold cursor-pointer press-feedback"
                  style={{ background: "var(--sand)", color: "var(--text)" }}
                >
                  Not now
                </button>
                <Link
                  href={`/product/${joinConfirm.id}`}
                  className="flex-1 h-[50px] rounded-[8px] text-[14px] font-bold text-white flex items-center justify-center press-feedback"
                  style={{ background: "var(--emerald)" }}
                  onClick={() => setJoinConfirm(null)}
                >
                  Join · {fmt(joinConfirm.groupPrice)}
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      <BottomNav />
    </main>
  );
}
