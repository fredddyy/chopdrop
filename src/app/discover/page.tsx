"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Preview {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Store {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  heroImage: string | null;
  productCount: number;
  categories: string[];
  bestSaving: number;
  lowestPrice: number;
  previews: Preview[];
  bestDealName: string | null;
}

function fmt(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

/* Bulletproof image — tries src, falls back to fallback, then warm placeholder */
function CoverImage({ src, fallback, alt, height }: { src: string | null; fallback?: string | null; alt: string; height: number }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setFailed(true);
    }
  }, [fallback, imgSrc]);

  if (failed || !imgSrc) {
    // Warm placeholder — intentional, not broken
    const initial = alt.charAt(0).toUpperCase();
    const colors = ["#C4572A", "#D4A24E", "#1A7D4B", "#2D2A26", "#E8604C"];
    const bg = colors[initial.charCodeAt(0) % colors.length];
    return (
      <div className="w-full flex items-center justify-center" style={{ height, background: bg }}>
        <span className="text-[64px] font-extrabold" style={{ color: "rgba(255,255,255,0.12)" }}>{initial}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className="w-full object-cover"
      style={{ height }}
      onError={handleError}
    />
  );
}

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    fetchStores();
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStores() {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    const res = await fetch(`/api/stores?${params}`);
    const data = await res.json();
    if (data.success) {
      setStores(data.data);
      if (data.categories) setCategories(["All", ...data.categories]);
    }
    setLoading(false);
  }

  // Client-side search filter
  const filtered = searchQuery.trim().length >= 2
    ? stores.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())))
    : stores;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "rgba(250,250,248,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="px-5 h-14 flex items-center justify-between">
          <span className="text-[20px] font-extrabold tracking-[-0.03em]" style={{ color: "var(--text)" }}>
            Chop<span style={{ color: "var(--coral)" }}>Drop</span>
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: searchOpen ? "var(--dark)" : "var(--sand)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? "white" : "var(--text)"} strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <Link
              href="/cart"
              className="relative w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--sand)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round">
                <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="px-5 pb-3">
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-11 pl-10 pr-10 rounded-[12px] text-[14px] font-medium outline-none"
                style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "var(--border)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
          {(categories.length > 0 ? categories : ["All", "Food", "Electronics", "Fashion", "Groceries"]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="h-[34px] px-4 rounded-[8px] text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={{
                background: activeCategory === cat ? "var(--dark)" : "var(--sand)",
                color: activeCategory === cat ? "white" : "var(--text-secondary)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-5 pt-4 flex flex-col gap-3.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div
                className="w-full"
                style={{ height: i === 0 ? 200 : 170, background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 150}ms` }}
              />
              <div className="p-4 space-y-2.5">
                <div className="h-5 rounded w-[55%]" style={{ background: "var(--sand)" }} />
                <div className="h-3 rounded w-[40%]" style={{ background: "var(--sand)" }} />
                <div className="flex gap-2 mt-1">
                  {[0, 1, 2].map((j) => <div key={j} className="w-8 h-8 rounded-full" style={{ background: "var(--sand)" }} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center px-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
            {searchQuery ? `No stores for "${searchQuery}"` : `No stores in ${activeCategory} yet`}
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            {searchQuery ? "Try a different search" : "New vendors join every week."}
          </p>
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-3.5">

          {/* Value prop */}
          <div className="flex items-center gap-2 px-1 head-enter">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
              Pool with others to <span style={{ color: "var(--emerald)" }}>save up to 35%</span> on every order
            </p>
          </div>

          {/* ═══ STORE CARDS ═══ */}
          {filtered.map((store, idx) => {
            const imgHeight = idx === 0 ? 200 : 170;
            const hasPromo = store.bestSaving >= 15 && store.bestDealName;
            // Best fallback image from product previews
            const fallbackImg = store.previews.find((p) => p.imageUrl)?.imageUrl ?? null;

            return (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className={`block rounded-[16px] overflow-hidden active:scale-[0.985] transition-transform card-enter card-enter-${(idx % 8) + 1}`}
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {/* ── Photo ── */}
                <div className="relative overflow-hidden">
                  <CoverImage
                    src={store.heroImage}
                    fallback={fallbackImg !== store.heroImage ? fallbackImg : null}
                    alt={store.name}
                    height={imgHeight}
                  />

                  {/* Promo overlay — warm tint, not dark */}
                  {hasPromo && (
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3.5 py-2.5 flex items-center gap-2"
                      style={{ background: "rgba(26,125,75,0.88)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                        <path d="M20 12H4M4 12l6-6M4 12l6 6" />
                      </svg>
                      <span className="text-[12px] font-bold text-white truncate">
                        Save {store.bestSaving}% on {store.bestDealName}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Info ── */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>
                        {store.name}
                      </h2>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {store.productCount} {store.productCount === 1 ? "item" : "items"} · {store.categories.join(", ")}
                      </p>
                    </div>
                    {/* Arrow indicator — card is tappable */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>

                  {/* Pool pulse — the ChopDrop signature */}
                  {store.bestSaving >= 10 && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="pool-dot" />
                      <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>
                        Pools open · Save up to {store.bestSaving}%
                      </span>
                    </div>
                  )}

                  {/* Preview row + price */}
                  <div className="flex items-center justify-between mt-3">
                    {store.previews.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {store.previews.slice(0, 3).map((p) => (
                            <div
                              key={p.id}
                              className="w-9 h-9 rounded-full overflow-hidden shrink-0"
                              style={{ border: "2px solid var(--card)" }}
                            >
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" style={{ background: "var(--sand)" }} />
                              )}
                            </div>
                          ))}
                        </div>
                        {store.productCount > 3 && (
                          <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                            +{store.productCount - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>From </span>
                      <span className="text-[22px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>
                        {fmt(store.lowestPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
