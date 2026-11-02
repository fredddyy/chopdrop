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
  bannerUrl: string | null;
  productCount: number;
  categories: string[];
  bestSaving: number;
  lowestPrice: number;
  previews: Preview[];
}

function fmt(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

/* ── HERO CARD — first store, big & bold ── */
function HeroStore({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.id}`}
      className="block rounded-[20px] overflow-hidden active:scale-[0.98] transition-transform"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Big cover */}
      <div className="relative h-[200px]" style={{ background: "var(--sand)" }}>
        {store.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover" />
        ) : store.previews[0]?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.previews[0].imageUrl} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--coral)" }}>
            <span className="text-[64px] font-extrabold text-white/15">{store.name.charAt(0)}</span>
          </div>
        )}
        {/* Scrim for text legibility */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />

        {/* Store name on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-[22px] font-extrabold text-white leading-tight">{store.name}</h2>
          <p className="text-[12px] text-white/70 mt-0.5">{store.address}</p>
        </div>

        {/* Savings badge */}
        {store.bestSaving >= 15 && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-[8px] text-[11px] font-extrabold text-white"
            style={{ background: "var(--emerald)" }}
          >
            Save up to {store.bestSaving}%
          </div>
        )}
      </div>

      {/* Product previews + price */}
      <div className="p-4">
        {/* Product thumbnail strip */}
        {store.previews.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {store.previews.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="w-10 h-10 rounded-full overflow-hidden shrink-0"
                  style={{ border: "2px solid var(--card)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl!} alt={p.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-semibold ml-1" style={{ color: "var(--text-muted)" }}>
              {store.productCount} items
            </span>
          </div>
        )}

        {/* Price anchor + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>From </span>
            <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fmt(store.lowestPrice)}</span>
          </div>
          <div
            className="h-[38px] px-5 rounded-[10px] flex items-center text-[13px] font-bold text-white"
            style={{ background: "var(--coral)" }}
          >
            Browse
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── STANDARD CARD — image top, info below ── */
function StoreCard({ store }: { store: Store }) {
  const coverImg = store.bannerUrl || store.previews[0]?.imageUrl;
  return (
    <Link
      href={`/store/${store.id}`}
      className="block rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="relative h-[140px]" style={{ background: "var(--sand)" }}>
        {coverImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImg} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--coral)" }}>
            <span className="text-[40px] font-extrabold text-white/15">{store.name.charAt(0)}</span>
          </div>
        )}
        {store.bestSaving >= 15 && (
          <div
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold text-white"
            style={{ background: "var(--emerald)" }}
          >
            -{store.bestSaving}%
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-[16px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{store.name}</h3>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{store.address}</p>

        {/* Mini product strip */}
        {store.previews.length > 1 && (
          <div className="flex -space-x-1.5 mt-2.5">
            {store.previews.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full overflow-hidden shrink-0"
                style={{ border: "2px solid var(--card)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl!} alt={p.name} className="w-full h-full object-cover" />
              </div>
            ))}
            <span
              className="h-8 flex items-center text-[10px] font-bold pl-2.5"
              style={{ color: "var(--text-muted)" }}
            >
              +{store.productCount} items
            </span>
          </div>
        )}

        {/* Price anchor */}
        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>From</span>
          <span className="text-[16px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fmt(store.lowestPrice)}</span>
        </div>
      </div>
    </Link>
  );
}

/* ── COMPACT CARD — horizontal, image left, info right ── */
function CompactStore({ store }: { store: Store }) {
  const coverImg = store.bannerUrl || store.previews[0]?.imageUrl;
  return (
    <Link
      href={`/store/${store.id}`}
      className="flex rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform"
      style={{ background: "var(--card)", border: "1px solid var(--border)", height: 120 }}
    >
      {/* Image left */}
      <div className="w-[120px] shrink-0 relative" style={{ background: "var(--sand)" }}>
        {coverImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImg} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--coral)" }}>
            <span className="text-[32px] font-extrabold text-white/15">{store.name.charAt(0)}</span>
          </div>
        )}
      </div>
      {/* Info right */}
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-[15px] font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>{store.name}</h3>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
            {store.productCount} items · {store.categories.join(", ")}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>From</span>
            <span className="text-[16px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fmt(store.lowestPrice)}</span>
          </div>
          {store.bestSaving >= 15 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[5px]" style={{ background: "rgba(13,159,95,0.1)", color: "var(--emerald)" }}>
              -{store.bestSaving}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
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

  const hero = stores[0] || null;
  const rest = stores.slice(1);

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
          </div>
          <Link
            href="/cart"
            className="relative w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--sand)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round">
              <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            {cart.totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
                style={{ background: "var(--coral)" }}
              >
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
        <div className="px-5 pt-4 flex flex-col gap-4">
          {/* Hero skeleton */}
          <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="h-[200px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => <div key={i} className="w-10 h-10 rounded-full" style={{ background: "var(--sand)" }} />)}
              </div>
              <div className="h-6 rounded w-[45%]" style={{ background: "var(--sand)" }} />
            </div>
          </div>
          {/* Compact skeletons */}
          {[0, 1].map((i) => (
            <div key={i} className="flex rounded-[16px] overflow-hidden h-[120px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-[120px] shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 200}ms` }} />
              <div className="flex-1 p-3.5 space-y-2">
                <div className="h-4 rounded w-[70%]" style={{ background: "var(--sand)" }} />
                <div className="h-3 rounded w-[50%]" style={{ background: "var(--sand)" }} />
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
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>
            No stores in {activeCategory} yet
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>New vendors join every week.</p>
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-4">
          {/* Value prop */}
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
              Buy at full price, or <span style={{ color: "var(--emerald)" }}>pool with others to save up to 35%</span>
            </p>
          </div>

          {/* ═══ HERO — featured store ═══ */}
          {hero && <HeroStore store={hero} />}

          {/* ═══ REST — alternating compositions ═══ */}
          {rest.map((store, idx) => {
            // Alternate: even = compact horizontal, odd = standard vertical
            if (idx % 2 === 0) {
              return <CompactStore key={store.id} store={store} />;
            }
            return <StoreCard key={store.id} store={store} />;
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
