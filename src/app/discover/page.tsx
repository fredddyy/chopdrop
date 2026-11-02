"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Product {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number;
  minPoolSize: number; tags: string | null;
  vendor: { id: string; name: string; imageUrl: string | null };
}

function formatPrice(kobo: number): string { return "₦" + (kobo / 100).toLocaleString(); }
function savingsPct(r: number, g: number): number { return r > 0 && g < r ? Math.round(((r - g) / r) * 100) : 0; }

// Warm category colors for placeholder backgrounds when no image
const catColors: Record<string, string> = {
  Food: "#E8604C", Electronics: "#3B82F6", Fashion: "#9333EA", Groceries: "#1A7D4B",
};

export default function DiscoverPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => { fetchProducts(); }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProducts(search?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (search) params.set("search", search);
    params.set("limit", "40");
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    if (data.success) {
      setProducts(data.data);
      if (data.categories) setCategories(["All", ...data.categories]);
    }
    setLoading(false);
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.trim().length >= 2) fetchProducts(q.trim());
    else if (q.trim().length === 0) fetchProducts();
  }

  // Split products for layout variety
  const featured = products[0] || null;
  const trending = products.filter(p => p.tags?.includes("trending")).slice(0, 6);
  const grid = products.slice(1);

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(250,247,242,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[18px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Discover</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: searchOpen ? "var(--text)" : "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? "white" : "var(--text)"} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
            <Link href="/cart" className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>{cart.totalItems}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="px-5 pb-3">
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} autoFocus
                className="w-full h-11 pl-10 pr-10 rounded-[12px] text-[14px] font-medium outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(""); fetchProducts(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--border)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category pills */}
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
          {(categories.length > 0 ? categories : ["All", "Food", "Electronics", "Fashion", "Groceries"]).map(cat => (
            <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
              className="h-[34px] px-4 rounded-[8px] text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={{ background: activeCategory === cat ? "var(--dark)" : "var(--sand)", color: activeCategory === cat ? "white" : "var(--text-secondary)" }}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-5 pt-4">
          <div className="h-[240px] rounded-[20px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-[140px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded w-[75%]" style={{ background: "var(--sand)" }} />
                  <div className="h-5 rounded w-[50%]" style={{ background: "var(--sand)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center px-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
            {searchQuery ? `No results for "${searchQuery}"` : `Nothing in ${activeCategory} yet`}
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            {searchQuery ? "Try a different search or browse categories" : "New products added weekly. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="pb-4">

          {/* ═══ HERO CARD — first product, full bleed, dark overlay ═══ */}
          {featured && (
            <Link href={`/product/${featured.id}`} className="block mx-5 mt-4 rounded-[20px] overflow-hidden relative active:scale-[0.98] transition-transform" style={{ background: catColors[featured.category] || "var(--dark)" }}>
              <div className="relative h-[240px]">
                {featured.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.imageUrl} alt={featured.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[48px] font-extrabold text-white/20">{featured.category.charAt(0)}</span>
                  </div>
                )}
                {/* Dark scrim — flat, not gradient */}
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />
                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  {savingsPct(featured.retailPrice, featured.groupPrice) >= 15 && (
                    <span className="self-start px-2.5 py-1 rounded-[6px] text-[10px] font-bold text-white mb-3" style={{ background: "var(--emerald)" }}>
                      Save {savingsPct(featured.retailPrice, featured.groupPrice)}% with pool
                    </span>
                  )}
                  <h2 className="text-[22px] font-extrabold text-white leading-tight">{featured.name}</h2>
                  <p className="text-[13px] text-white/60 mt-1">{featured.vendor.name} · {featured.category}</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-[24px] font-extrabold text-white tabular-nums">{formatPrice(featured.groupPrice)}</span>
                    <span className="text-[14px] text-white/40 line-through tabular-nums">{formatPrice(featured.retailPrice)}</span>
                  </div>
                  <div className="mt-3 h-12 rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white" style={{ background: "var(--coral)" }}>
                    Start Pool · {formatPrice(featured.groupPrice)}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ═══ TRENDING — horizontal scroll, only if trending items exist ═══ */}
          {trending.length > 2 && activeCategory === "All" && (
            <section className="mt-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <div>
                  <h3 className="text-[17px] font-extrabold" style={{ color: "var(--text)" }}>Trending now</h3>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>Most pooled this week</p>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pl-5 pr-3 pb-1">
                {trending.map(p => {
                  const sav = savingsPct(p.retailPrice, p.groupPrice);
                  return (
                    <Link key={p.id} href={`/product/${p.id}`} className="shrink-0 w-[160px] rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="relative h-[120px]" style={{ background: catColors[p.category] ? `${catColors[p.category]}15` : "var(--sand)" }}>
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[28px] font-extrabold" style={{ color: catColors[p.category] || "var(--text-muted)", opacity: 0.2 }}>{p.category.charAt(0)}</span>
                          </div>
                        )}
                        {sav > 0 && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold text-white" style={{ background: "var(--emerald)" }}>-{sav}%</div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[13px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                        <div className="text-[15px] font-extrabold tabular-nums mt-1" style={{ color: "var(--text)" }}>{formatPrice(p.groupPrice)}</div>
                        <div className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--emerald)" }}>pool price</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ ALL PRODUCTS — 2 column grid with section header ═══ */}
          <section className="mt-8 px-5">
            <h3 className="text-[17px] font-extrabold mb-3" style={{ color: "var(--text)" }}>
              {activeCategory === "All" ? "All products" : activeCategory}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {grid.map((p, idx) => {
                const sav = savingsPct(p.retailPrice, p.groupPrice);
                return (
                  <Link key={p.id} href={`/product/${p.id}`}
                    className="rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="relative" style={{ height: idx % 3 === 0 ? 160 : 140, background: catColors[p.category] ? `${catColors[p.category]}10` : "var(--sand)" }}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[32px] font-extrabold" style={{ color: catColors[p.category] || "var(--text-muted)", opacity: 0.15 }}>{p.name.charAt(0)}</span>
                        </div>
                      )}
                      {sav > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[6px] text-[10px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                          -{sav}%
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-[14px] font-bold leading-snug" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</h3>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(p.groupPrice)}</span>
                        {sav > 0 && (
                          <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{formatPrice(p.retailPrice)}</span>
                        )}
                      </div>
                      <div className="mt-2 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "var(--coral)" }}>
                        Pool · {formatPrice(p.groupPrice)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
