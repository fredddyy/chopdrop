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
  lowestGroupPrice: number;
  previews: Preview[];
  bestDealName: string | null;
  topItems: string[];
  deliveryEstimate: string;
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
    return (
      <div className="w-full flex items-end px-4 pb-3" style={{ height, background: "var(--sand)" }}>
        <span className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>
          {alt}
        </span>
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
  const [activeCategory, setActiveCategory] = useState("Food");
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
          <div>
            <span className="text-[20px] font-extrabold tracking-[-0.03em]" style={{ color: "var(--text)" }}>
              Chop<span style={{ color: "var(--coral)" }}>Drop</span>
            </span>
            <p className="text-[10px] font-medium -mt-1" style={{ color: "var(--text-muted)" }}>Order lunch, save together</p>
          </div>
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
        <div className="px-5 pt-3 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[14px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div
                className="w-full"
                style={{ height: i === 0 ? 150 : 125, background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120}ms` }}
              />
              <div className="px-3.5 py-3 space-y-2">
                <div className="h-4 rounded w-[50%]" style={{ background: "var(--sand)" }} />
                <div className="h-3 rounded w-[65%]" style={{ background: "var(--sand)" }} />
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
        <div className="px-5 pt-3 flex flex-col gap-3">

          {/* ═══ STORE CARDS ═══ */}
          {filtered.map((store, idx) => {
            const imgHeight = idx === 0 ? 150 : 125;
            // Promo overlay only on the top card — not every card
            const showPromo = idx === 0 && store.bestSaving >= 15 && store.bestDealName;
            const fallbackImg = store.previews?.find((p: Preview) => p.imageUrl)?.imageUrl ?? null;

            return (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className={`block rounded-[14px] overflow-hidden active:scale-[0.985] transition-transform card-enter card-enter-${(idx % 8) + 1}`}
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

                  {/* Promo overlay — only on featured card */}
                  {showPromo && (
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 py-1.5 flex items-center gap-1.5"
                      style={{ background: "rgba(26,125,75,0.88)" }}
                    >
                      <span className="text-[11px] font-bold text-white truncate">
                        Save {store.bestSaving}% on {store.bestDealName}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Info — clean, no prices ── */}
                <div className="px-3.5 py-2.5">
                  <h2 className="text-[15px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>
                    {store.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {store.topItems.length > 0 ? store.topItems.join(", ") : `${store.productCount} items`}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--border)" }}>·</span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{store.deliveryEstimate}</span>
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
