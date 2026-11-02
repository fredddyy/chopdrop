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

function savingsPercent(retail: number, group: number): number {
  if (retail <= 0 || group >= retail) return 0;
  return Math.round(((retail - group) / retail) * 100);
}

export default function DiscoverPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

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

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 px-5 h-14 flex items-center justify-between" style={{ background: "rgba(250,247,242,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>Lagos</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="cursor-pointer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
          <Link href="/cart" className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            {cart.totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>{cart.totalItems}</span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Search bar (collapsible) ── */}
      {searchOpen && (
        <div className="px-5 py-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="text" placeholder="Search products, vendors..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} autoFocus
              className="w-full h-11 pl-10 pr-10 rounded-[12px] text-[14px] font-medium outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(""); fetchProducts(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--border)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Category pills ── */}
      <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 py-3 sticky top-14 z-30" style={{ background: "var(--bg)" }}>
        {(categories.length > 0 ? categories : ["All", "Food", "Electronics", "Fashion", "Groceries"]).map(cat => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
            className="h-[34px] px-3.5 rounded-[8px] text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
            style={{ background: activeCategory === cat ? "var(--text)" : "var(--sand)", color: activeCategory === cat ? "white" : "var(--text-secondary)" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── Product grid ── */}
      <div className="px-5 pb-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-[140px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 150}ms` }} />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 rounded-[4px] w-[80%]" style={{ background: "var(--sand)" }} />
                  <div className="h-5 rounded-[4px] w-[60%]" style={{ background: "var(--sand)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <p className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
              {searchQuery ? `No results for "${searchQuery}"` : `Nothing in ${activeCategory} yet`}
            </p>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              {searchQuery ? "Try a different search" : "We're adding new products every week"}
            </p>
          </div>
        ) : (
          <>
            {/* Featured card — first product, full width */}
            {products.length > 0 && (() => {
              const p = products[0];
              const savings = savingsPercent(p.retailPrice, p.groupPrice);
              return (
                <Link href={`/product/${p.id}`} className="block rounded-[16px] overflow-hidden mt-2 active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="relative h-[200px]" style={{ background: "var(--sand)" }}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                      </div>
                    )}
                    {savings >= 20 && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-[6px] text-[10px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                        {savings}% off with pool
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-[17px] font-bold leading-snug" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                        {p.vendor.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.vendor.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[7px] font-bold" style={{ color: "var(--text-muted)" }}>{p.vendor.name.charAt(0)}</div>
                        )}
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>by {p.vendor.name}</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-3">
                      <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(p.retailPrice)}</span>
                      <div className="w-px h-4" style={{ background: "var(--border)" }} />
                      <span className="text-[16px] font-bold tabular-nums" style={{ color: "var(--emerald)" }}>{formatPrice(p.groupPrice)} pool</span>
                    </div>
                    <div className="flex gap-2.5 mt-3">
                      <div className="flex-[45] h-11 rounded-[12px] flex items-center justify-between px-4 text-[13px] font-bold" style={{ background: "var(--sand)", color: "var(--text)" }}>
                        <span>Buy Now</span>
                        <span className="tabular-nums">{formatPrice(p.retailPrice)}</span>
                      </div>
                      <div className="flex-[55] h-11 rounded-[12px] flex items-center justify-between px-4 text-[13px] font-bold text-white" style={{ background: "var(--coral)" }}>
                        <span>Start Pool</span>
                        <span className="tabular-nums">{formatPrice(p.groupPrice)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })()}

            {/* 2-column grid — remaining products */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {products.slice(1).map((p) => {
                const savings = savingsPercent(p.retailPrice, p.groupPrice);
                return (
                  <Link key={p.id} href={`/product/${p.id}`} className="rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="relative h-[140px]" style={{ background: "var(--sand)" }}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                        </div>
                      )}
                      {savings > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[6px] text-[10px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                          -{savings}%
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-[14px] font-bold leading-snug" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                          {p.vendor.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.vendor.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[6px] font-bold" style={{ color: "var(--text-muted)" }}>{p.vendor.name.charAt(0)}</div>
                          )}
                        </div>
                        <span className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-[18px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(p.retailPrice)}</div>
                        <div className="text-[13px] font-bold tabular-nums mt-0.5" style={{ color: "var(--emerald)" }}>{formatPrice(p.groupPrice)} pool</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
