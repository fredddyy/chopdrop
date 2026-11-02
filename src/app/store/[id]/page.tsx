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

interface StoreDetail {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  categories: string[];
  products: Product[];
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
  const [bannerFailed, setBannerFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStore(data.data);
        setLoading(false);
      });
  }, [id]);

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

  const filtered =
    activeCategory === "All"
      ? store.products
      : store.products.filter((p) => p.category === activeCategory);

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
            {store.products.length} {store.products.length === 1 ? "item" : "items"}
          </span>
          <span className="text-[11px]" style={{ color: "var(--border)" }}>·</span>
          <span className="text-[11px]" style={{ color: "var(--emerald)" }}>
            Pool to save on any item
          </span>
        </div>
      </div>

      {/* ── Category filter (if store has multiple) ── */}
      {store.categories.length > 1 && (
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 mt-4">
          {["All", ...store.categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="h-[32px] px-3.5 rounded-[8px] text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={{
                background:
                  activeCategory === cat ? "var(--dark)" : "var(--sand)",
                color:
                  activeCategory === cat ? "white" : "var(--text-secondary)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ── */}
      <section className="px-5 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p, idx) => {
            const sav = pct(p.retailPrice, p.groupPrice);
            return (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className={`card-enter card-enter-${(idx % 8) + 1} rounded-[8px] overflow-hidden active:scale-[0.98] transition-transform`}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="relative"
                  style={{
                    height: idx % 3 === 0 ? 155 : 135,
                    background: "var(--sand)",
                  }}
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span
                        className="text-[28px] font-extrabold"
                        style={{
                          color: "var(--text-muted)",
                          opacity: 0.1,
                        }}
                      >
                        {p.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {sav >= 10 && (
                    <div
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-[6px] text-[10px] font-bold text-white"
                      style={{ background: "var(--emerald)" }}
                    >
                      -{sav}%
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3
                    className="text-[13px] font-bold leading-snug"
                    style={{
                      color: "var(--text)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.name}
                  </h3>
                  {p.subcategory && (
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {p.subcategory}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className="text-[20px] font-extrabold tabular-nums"
                      style={{ color: "var(--text)" }}
                    >
                      {fmt(p.retailPrice)}
                    </span>
                  </div>
                  {sav > 0 && (
                    <p
                      className="text-[12px] font-semibold mt-1"
                      style={{ color: "var(--emerald)" }}
                    >
                      Pool at {fmt(p.groupPrice)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
