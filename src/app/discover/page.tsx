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

// ── Simulated social proof (seeded, deterministic per product) ──
const NAMES = ["Tolu", "Ada", "Chidi", "Ngozi", "Emeka", "Bimpe", "Kola", "Yemi", "Funke", "Dayo"];
const COLORS = ["#E8604C", "#0D9F5F", "#2563EB", "#D4A24E", "#7C3AED", "#EC4899"];

function poolSocial(id: string, idx: number, minSize: number) {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1) + idx;
  // Pools should look 60-90% full — that's what creates FOMO
  const fillPct = 0.6 + ((seed % 4) * 0.1); // 60%, 70%, 80%, 90%
  const joined = Math.max(2, Math.min(minSize - 1, Math.round(minSize * fillPct)));
  const starter = NAMES[seed % NAMES.length];
  const hours = [1, 2, 3, 4, 6][seed % 5];
  const others = joined - 1;
  return { starter, starterColor: COLORS[seed % COLORS.length], joined, spotsLeft: minSize - joined, hours, others };
}

function storePooCount(id: string, orderCount: number): number {
  // Simulated: stores with more orders have more poolers
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return orderCount > 100 ? (seed % 8) + 5 : orderCount > 50 ? (seed % 5) + 2 : 0;
}

/* Avatar initial circle */
function Avatar({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}
    >
      {name.charAt(0)}
    </div>
  );
}

export default function DiscoverPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [poolProducts, setPoolProducts] = useState<PoolProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("Food");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    fetchData();
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData() {
    setLoading(true);
    const [storesRes, productsRes] = await Promise.all([
      fetch(`/api/stores?category=${activeCategory}`),
      fetch(`/api/products?category=${activeCategory}&limit=20`),
    ]);
    const [storesData, productsData] = await Promise.all([storesRes.json(), productsRes.json()]);
    if (storesData.success) setStores(storesData.data);
    if (productsData.success) {
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
        style={{ background: "rgba(249,250,251,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="px-5 h-12 flex items-center justify-between">
          <span className="text-[18px] font-extrabold tracking-[-0.03em]" style={{ color: "var(--text)" }}>
            Chop<span style={{ color: "var(--coral)" }}>Drop</span>
          </span>
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
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="px-5 pb-3">
            <input
              type="text" placeholder="Search stores..." value={searchQuery}
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

      {/* ── Content ── */}
      {loading ? (
        <div className="px-5 pt-4 flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] rounded-[8px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : (
        <div>

          {/* ═══ POOL HERO — the main event ═══ */}
          {poolProducts.length > 0 && (
            <section className="pt-4 pb-2">
              <div className="px-5 mb-3 flex items-center justify-between">
                <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>Pooling near you</h3>
                <Link href="/pools" className="text-[12px] font-bold" style={{ color: "var(--emerald)" }}>View all</Link>
              </div>

              <div className="flex gap-3 overflow-x-auto hide-scrollbar pl-5 pr-3">
                {poolProducts.slice(0, 5).map((p, idx) => {
                  const social = poolSocial(p.id, idx, p.minPoolSize);
                  const sav = Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100);
                  const saved = p.retailPrice - p.groupPrice;
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className={`w-[270px] shrink-0 rounded-[10px] overflow-hidden active:scale-[0.97] transition-transform card-enter card-enter-${idx + 1}`}
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {/* Hero food photo */}
                      <div className="relative h-[130px]" style={{ background: "var(--sand)" }}>
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        )}
                        {/* Savings — top left */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[6px] text-[12px] font-extrabold text-white" style={{ background: "var(--coral)" }}>
                          -{sav}%
                        </div>
                        {/* Joined — top right */}
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-[6px] text-[11px] font-bold text-white flex items-center gap-1.5" style={{ background: "rgba(0,0,0,0.55)" }}>
                          <span className="pool-dot" />
                          {social.joined}/{p.minPoolSize} joined
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <h4 className="text-[14px] font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>{p.name}</h4>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{p.vendor.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--coral)" }}>{fmt(p.groupPrice)}</span>
                            <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(p.retailPrice)}</span>
                          </div>
                          {/* Quick add button */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral)" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>Save {fmt(saved)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ STORES ═══ */}
          {filteredStores.length > 0 && (
            <section className="mt-4">
              <div className="px-5 mb-2 flex items-center justify-between">
                <h3 className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>Stores near you</h3>
              </div>
              <div className="px-5 flex flex-col gap-3">
                {filteredStores.map((store, idx) => {
                  const pooling = storePooCount(store.id, store.orderCount);
                  return (
                    <Link
                      key={store.id}
                      href={`/store/${store.id}`}
                      className={`block rounded-[8px] overflow-hidden active:scale-[0.985] transition-transform card-enter card-enter-${(idx % 8) + 1}`}
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="relative overflow-hidden">
                        <CoverImage src={store.heroImage} alt={store.name} height={idx === 0 ? 140 : 110} />
                        {/* Pool count — top right */}
                        {pooling > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[4px] text-[10px] font-bold text-white flex items-center gap-1" style={{ background: "var(--emerald)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            {pooling} pooling
                          </div>
                        )}
                      </div>
                      <div className="px-3.5 py-2.5">
                        <div className="flex items-center justify-between">
                          <h2 className="text-[15px] font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>
                            {store.name}
                          </h2>
                          <span className="text-[12px] font-medium shrink-0 ml-2" style={{ color: "var(--text-secondary)" }}>★ {store.rating}</span>
                        </div>
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{store.orderCount}+ orders · {store.deliveryEstimate}</span>
                        {store.bestDealName && store.bestSaving >= 10 && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex -space-x-1 shrink-0">
                              {NAMES.slice((store.id.charCodeAt(0) % 5), (store.id.charCodeAt(0) % 5) + 3).map((n, i) => (
                                <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: COLORS[i], border: "1px solid var(--card)" }}>
                                  {n.charAt(0)}
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] font-bold truncate" style={{ color: "var(--emerald)" }}>
                              {store.bestDealName} save {fmt(store.lowestPrice - store.lowestGroupPrice)}
                            </span>
                            {pooling >= 5 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--emerald)", color: "white" }}>
                                Free delivery
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
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
