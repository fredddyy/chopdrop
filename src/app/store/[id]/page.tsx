"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  subcategory: string | null;
  retailPrice: number;
  groupPrice: number;
  minPoolSize: number;
  tags: string | null;
}

interface Combo {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  tag: string;
  poolTiers: unknown;
  type: "combo";
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface StoreDetail {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  categories: string[];
  products: Product[];
  combos: Combo[];
  menuCategories: MenuCategory[];
}

function fmt(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}
function pct(r: number, g: number): number {
  return r > 0 && g < r ? Math.round(((r - g) / r) * 100) : 0;
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/stores/${id}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.success) setStore(data.data);
        setLoading(false);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, [id, retryKey]);

  if (loading) {
    return (
      <main
        className="flex-1 max-w-[480px] mx-auto w-full pb-24"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="h-[220px]"
          style={{
            background: "var(--sand)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div className="px-5 pt-4 space-y-3">
          <div
            className="h-6 rounded w-[50%]"
            style={{ background: "var(--sand)" }}
          />
          <div
            className="h-4 rounded w-[70%]"
            style={{ background: "var(--sand)" }}
          />
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[8px] overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="h-[130px]"
                  style={{
                    background: "var(--sand)",
                    animation: "pulse 1.5s ease-in-out infinite",
                    animationDelay: `${i * 100}ms`,
                  }}
                />
                <div className="p-3 space-y-2">
                  <div
                    className="h-3 rounded w-[75%]"
                    style={{ background: "var(--sand)" }}
                  />
                  <div
                    className="h-5 rounded w-[50%]"
                    style={{ background: "var(--sand)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="py-20 text-center px-8">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load store</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => setRetryKey((k) => k + 1)} className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>
            Try again
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!store) {
    return (
      <main
        className="flex-1 max-w-[480px] mx-auto w-full pb-24"
        style={{ background: "var(--bg)" }}
      >
        <div className="py-20 text-center px-8">
          <h2
            className="text-[18px] font-extrabold mb-2"
            style={{ color: "var(--text)" }}
          >
            Store not found
          </h2>
          <button
            type="button"
            onClick={() => router.push("/discover")}
            className="text-[14px] font-bold cursor-pointer"
            style={{ color: "var(--coral)" }}
          >
            Back to Discover
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  function addToCart(itemId: string, name: string, description: string, imageUrl: string | null, price: number) {
    cart.addItem({ dailyMenuId: itemId, name, description: description || "", imageUrl, restaurantName: store?.name || "", price });
    setAddedId(itemId);
    setTimeout(() => setAddedId(null), 800);
  }

  // Filter products by active category (for pool deals grid)
  const filtered =
    activeCategory === "All"
      ? store.products
      : store.products.filter((p) => p.category === activeCategory);

  // Filter combos: show when "All" or "Combos"
  const showCombos = activeCategory === "All" || activeCategory === "Combos";

  // Filter menu items by active category name
  const filteredMenuCats = activeCategory === "All"
    ? store.menuCategories
    : store.menuCategories.filter((c) => c.name === activeCategory);

  const bannerSrc =
    (!bannerFailed && store.bannerUrl) ||
    store.products.find((p) => p.imageUrl)?.imageUrl ||
    null;

  return (
    <main
      className="flex-1 max-w-[480px] mx-auto w-full pb-24"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Store Banner ── */}
      <div className="relative h-[220px]" style={{ background: "var(--sand)" }}>
        {bannerSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerSrc}
            alt={store.name}
            className="w-full h-full object-cover"
            onError={() => setBannerFailed(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-end px-5 pb-4"
            style={{ background: "var(--sand)" }}
          >
            <span className="text-[14px] font-bold" style={{ color: "var(--text-muted)" }}>
              {store.name}
            </span>
          </div>
        )}

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Cart */}
        <Link
          href="/cart"
          className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 7h12l1 14H5L6 7Z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
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

      {/* ── Store Info — editorial flow, no overlapping card ── */}
      <div className="px-5 pt-4">
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>
          {store.name}
        </h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
          {store.address}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {store.products.length + store.combos.length + store.menuCategories.reduce((a, c) => a + c.items.length, 0)} items
          </span>
          <span className="text-[11px]" style={{ color: "var(--border)" }}>·</span>
          <span className="text-[11px]" style={{ color: "var(--emerald)" }}>
            Pool to save on any item
          </span>
        </div>
      </div>

      {/* ── Menu category pills — like old restaurant page ── */}
      {(() => {
        // Build unified category list from combos + menu categories
        const mealCatNames = store.menuCategories.map((c) => c.name);
        if (store.combos.length > 0) mealCatNames.unshift("Combos");
        const productCatNames = store.products.length > 0 ? store.categories : [];
        const allCats = [...new Set([...mealCatNames, ...productCatNames])];

        if (allCats.length <= 1 && store.products.length === 0) return null;

        return (
          <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 mt-4">
            {(allCats.length > 1 ? ["All", ...allCats] : allCats).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="h-[34px] px-3.5 rounded-[8px] text-[12px] font-bold whitespace-nowrap cursor-pointer shrink-0"
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
        );
      })()}

      {/* ── Unified meal list — combos + menu items filtered by category ── */}
      <section className="px-5 mt-4 pb-2">
        <div className="flex flex-col gap-2">
          {/* Combos — filtered by pill */}
          {store.combos.length > 0 && showCombos && store.combos.map((c) => {
            const hasDiscount = c.originalPrice && c.originalPrice > c.price;
            return (
              <div
                key={`combo-${c.id}`}
                className="flex items-center gap-3 p-2.5 rounded-[8px]"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} className="w-14 h-14 rounded-[8px] object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-[8px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                    <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{c.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{c.name}</h4>
                    {c.tag === "DEAL" && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] text-white shrink-0" style={{ background: "var(--emerald)" }}>Deal</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[15px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fmt(c.price)}</span>
                    {hasDiscount && (
                      <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(c.originalPrice!)}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(`combo-${c.id}`, c.name, c.description || "", c.imageUrl, c.price)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 ${addedId === `combo-${c.id}` ? "pop" : ""}`}
                  style={{ background: addedId === `combo-${c.id}` ? "var(--emerald)" : "var(--coral)", color: "white", transition: "background 200ms" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
            );
          })}

          {/* Menu items — filtered by active category pill */}
          {filteredMenuCats.map((cat) => cat.items.map((item) => (
              <div
                key={`menu-${item.id}`}
                className="flex items-center gap-3 p-2.5 rounded-[8px]"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-[8px] object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-[8px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                    <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{item.name}</h4>
                  <span className="text-[15px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fmt(item.price)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(`menu-${item.id}`, item.name, item.description || "", item.imageUrl, item.price)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 ${addedId === `menu-${item.id}` ? "pop" : ""}`}
                  style={{ background: addedId === `menu-${item.id}` ? "var(--emerald)" : "var(--coral)", color: "white", transition: "background 200ms" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
            )))}
        </div>
      </section>

      {/* ── Products (group-buy items) — separate section if store has both ── */}
      {filtered.length > 0 && (
        <section className="px-5 mt-4 pb-4">
          {(store.combos.length > 0 || store.menuCategories.length > 0) && (
            <h3 className="text-[15px] font-extrabold mb-3" style={{ color: "var(--text)" }}>Pool deals</h3>
          )}
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p, idx) => {
              const sav = pct(p.retailPrice, p.groupPrice);
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className={`card-enter card-enter-${(idx % 8) + 1} rounded-[8px] overflow-hidden press-feedback`}
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="relative" style={{ height: idx % 3 === 0 ? 155 : 135, background: "var(--sand)" }}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[28px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.1 }}>{p.name.charAt(0)}</span>
                      </div>
                    )}
                    {sav >= 10 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[6px] text-[10px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                        -{sav}%
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-bold leading-snug" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fmt(p.retailPrice)}</span>
                    </div>
                    {sav > 0 && <p className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--emerald)" }}>Pool at {fmt(p.groupPrice)} · {p.minPoolSize}+ people</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}
