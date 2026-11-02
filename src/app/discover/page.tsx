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
        <span className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>{alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-full object-cover" style={{ height }} onError={handleError} />
  );
}

const CATEGORIES = ["Food", "Electronics", "Fashion", "Groceries"];

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [poolProducts, setPoolProducts] = useState<PoolProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tipDismissed, setTipDismissed] = useState(false);
  const cart = useCart();

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("pool-tip-seen")) {
      setTipDismissed(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams({ category: activeCategory, limit: "20" });

    // Fetch stores and pool-able products in parallel
    const [storesRes, productsRes] = await Promise.all([
      fetch(`/api/stores?category=${activeCategory}`),
      fetch(`/api/products?${params}`),
    ]);
    const [storesData, productsData] = await Promise.all([storesRes.json(), productsRes.json()]);

    if (storesData.success) setStores(storesData.data);
    if (productsData.success) {
      // Only show products with real pool savings
      const withSavings = (productsData.data as PoolProduct[]).filter(
        (p) => p.groupPrice < p.retailPrice && p.imageUrl,
      );
      setPoolProducts(withSavings.slice(0, 6));
    }
    setLoading(false);
  }

  const filteredStores = searchQuery.trim().length >= 2
    ? stores.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <Link href="/cart" className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
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
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--border)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category tabs — no "All" */}
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
          {CATEGORIES.map((cat) => (
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
        <div className="pt-3">
          {/* Pool section skeleton */}
          <div className="px-5 mb-2">
            <div className="h-4 rounded w-[40%]" style={{ background: "var(--sand)" }} />
          </div>
          <div className="flex gap-3 overflow-hidden px-5 mb-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-[140px] shrink-0 rounded-[12px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-[100px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 rounded w-[80%]" style={{ background: "var(--sand)" }} />
                  <div className="h-4 rounded w-[60%]" style={{ background: "var(--sand)" }} />
                </div>
              </div>
            ))}
          </div>
          {/* Store skeleton */}
          <div className="px-5 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[14px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-[125px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 120}ms` }} />
                <div className="px-3.5 py-3 space-y-2">
                  <div className="h-4 rounded w-[50%]" style={{ background: "var(--sand)" }} />
                  <div className="h-3 rounded w-[65%]" style={{ background: "var(--sand)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-3">

          {/* Pool tip — first visit */}
          {!tipDismissed && (
            <div className="mx-5 mb-3 flex items-start gap-3 p-3 rounded-[12px] card-enter card-enter-1" style={{ background: "var(--dark)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-snug">Order together, pay less</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Tap any item below and hit &quot;Pool &amp; Save&quot; — more people join, everyone&apos;s price drops.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setTipDismissed(true); sessionStorage.setItem("pool-tip-seen", "1"); }}
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* ═══ POOL & SAVE — per-category products ═══ */}
          {poolProducts.length > 0 && (
            <section className="mb-4">
              <div className="px-5 mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="pool-dot" />
                  <h3 className="text-[14px] font-extrabold" style={{ color: "var(--text)" }}>Pool &amp; save</h3>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Order together, pay less</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pl-5 pr-3">
                {poolProducts.map((p, idx) => {
                  const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className={`w-[140px] shrink-0 rounded-[12px] overflow-hidden active:scale-[0.97] transition-transform card-enter card-enter-${idx + 1}`}
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="relative h-[100px]" style={{ background: "var(--sand)" }}>
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        )}
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                          -{sav}%
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[12px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{fmt(p.groupPrice)}</span>
                          <span className="text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                        </div>
                        <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>with {p.minPoolSize}+ people</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ STORES ═══ */}
          {filteredStores.length > 0 && (
            <section>
              <div className="px-5 mb-2.5">
                <h3 className="text-[14px] font-extrabold" style={{ color: "var(--text)" }}>Stores</h3>
              </div>
              <div className="px-5 flex flex-col gap-3">
                {filteredStores.map((store, idx) => (
                  <Link
                    key={store.id}
                    href={`/store/${store.id}`}
                    className={`block rounded-[14px] overflow-hidden active:scale-[0.985] transition-transform card-enter card-enter-${(idx % 8) + 1}`}
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="relative overflow-hidden">
                      <CoverImage src={store.heroImage} alt={store.name} height={idx === 0 ? 140 : 115} />
                    </div>
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
                ))}
              </div>
            </section>
          )}

          {filteredStores.length === 0 && poolProducts.length === 0 && (
            <div className="py-16 text-center px-8">
              <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
                {searchQuery ? `No results for "${searchQuery}"` : `Nothing in ${activeCategory} yet`}
              </h2>
              <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                {searchQuery ? "Try a different search" : "New vendors join every week."}
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
