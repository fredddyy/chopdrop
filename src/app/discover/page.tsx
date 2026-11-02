"use client";

import { useState, useEffect } from "react";
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

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
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
      ) : stores.length === 0 ? (
        <div className="py-20 text-center px-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No stores in {activeCategory} yet</h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>New vendors join every week.</p>
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-3.5">

          {/* Value prop — subtle, one line */}
          <div className="flex items-center gap-2 px-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
              Pool with others to <span style={{ color: "var(--emerald)" }}>save up to 35%</span> on every order
            </p>
          </div>

          {/* ═══ STORE CARDS — Chowdeck-style, photo-forward ═══ */}
          {stores.map((store, idx) => {
            // First card slightly taller for hero treatment
            const imgHeight = idx === 0 ? 200 : 170;
            const hasPromo = store.bestSaving >= 15 && store.bestDealName;

            return (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className="block rounded-[16px] overflow-hidden active:scale-[0.985] transition-transform"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {/* ── Full-width photo ── */}
                <div className="relative" style={{ height: imgHeight, background: "var(--sand)" }}>
                  {store.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.heroImage}
                      alt={store.name}
                      className="w-full h-full object-cover"
                      loading={idx < 2 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--coral)" }}>
                      <span className="text-[56px] font-extrabold text-white/10">{store.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* Promo overlay — like Chowdeck's "Huge Price Slash" */}
                  {hasPromo && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <path d="M19 14l-7 7-7-7" /><path d="M12 3v18" />
                          </svg>
                        </div>
                        <span className="text-[12px] font-bold text-white truncate">
                          Save {store.bestSaving}% on {store.bestDealName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Store info ── */}
                <div className="p-4">
                  {/* Name + meta row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>
                        {store.name}
                      </h2>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {store.productCount} items{store.categories.length > 0 && <> · {store.categories.join(", ")}</>}
                      </p>
                    </div>
                    {store.bestSaving >= 10 && !hasPromo && (
                      <span
                        className="text-[11px] font-extrabold px-2.5 py-1 rounded-[6px] shrink-0"
                        style={{ background: "rgba(13,159,95,0.1)", color: "var(--emerald)" }}
                      >
                        -{store.bestSaving}%
                      </span>
                    )}
                  </div>

                  {/* Product preview row + price */}
                  <div className="flex items-center justify-between mt-3">
                    {/* Thumbnail stack */}
                    {store.previews.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {store.previews.slice(0, 3).map((p) => (
                            <div
                              key={p.id}
                              className="w-9 h-9 rounded-full overflow-hidden shrink-0"
                              style={{ border: "2px solid var(--card)" }}
                            >
                              {p.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
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

                    {/* Price anchor */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>From </span>
                      <span className="text-[18px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>
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
