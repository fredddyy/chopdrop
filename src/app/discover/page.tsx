"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Store {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  productCount: number;
  categories: string[];
  bestSaving: number;
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
    <main
      className="flex-1 max-w-[480px] mx-auto w-full pb-24"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(250,250,248,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="px-5 h-14 flex items-center justify-between">
          <span
            className="text-[18px] font-extrabold tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            Discover
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--sand)" }}
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
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
          {(categories.length > 0
            ? categories
            : ["All", "Food", "Electronics", "Fashion", "Groceries"]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="h-[34px] px-4 rounded-[8px] text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
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
      </header>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-5 pt-4 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[16px] overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="h-[180px]"
                style={{
                  background: "var(--sand)",
                  animation: "pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 150}ms`,
                }}
              />
              <div className="p-4 space-y-2">
                <div
                  className="h-5 rounded w-[55%]"
                  style={{ background: "var(--sand)" }}
                />
                <div
                  className="h-3 rounded w-[80%]"
                  style={{ background: "var(--sand)" }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="py-20 text-center px-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--sand)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2
            className="text-[18px] font-extrabold mb-1"
            style={{ color: "var(--text)" }}
          >
            No stores in {activeCategory} yet
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            New vendors join every week.
          </p>
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-4">
          {/* Value prop — first visit context */}
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--emerald)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="shrink-0"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p
              className="text-[12px] font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Buy at full price, or{" "}
              <span style={{ color: "var(--emerald)" }}>
                pool with others to save up to 35%
              </span>
            </p>
          </div>

          {/* ═══ STORE CARDS — 1-column, full-width cover ═══ */}
          {stores.map((store, idx) => (
            <Link
              key={store.id}
              href={`/store/${store.id}`}
              className="block rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Cover photo */}
              <div
                className="relative"
                style={{
                  height: idx === 0 ? 200 : 160,
                  background: "var(--sand)",
                }}
              >
                {store.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.bannerUrl}
                    alt={store.name}
                    className="w-full h-full object-cover"
                    loading={idx < 2 ? "eager" : "lazy"}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "var(--coral)" }}
                  >
                    <span className="text-[56px] font-extrabold text-white/20">
                      {store.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Savings badge */}
                {store.bestSaving >= 15 && (
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-white"
                    style={{ background: "var(--emerald)" }}
                  >
                    Up to {store.bestSaving}% off
                  </div>
                )}
              </div>

              {/* Store info */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Store logo */}
                  <div
                    className="w-10 h-10 rounded-[10px] shrink-0 overflow-hidden -mt-7 relative z-10"
                    style={{
                      background: "var(--card)",
                      border: "2px solid var(--card)",
                    }}
                  >
                    {store.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={store.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[14px] font-extrabold text-white"
                        style={{ background: "var(--coral)" }}
                      >
                        {store.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-[17px] font-extrabold leading-tight truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {store.name}
                    </h2>
                    <p
                      className="text-[12px] mt-0.5 truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {store.address}
                    </p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-3">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {store.productCount}{" "}
                    {store.productCount === 1 ? "item" : "items"}
                  </span>
                  <span
                    className="w-[3px] h-[3px] rounded-full"
                    style={{ background: "var(--border)" }}
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {store.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px]"
                        style={{
                          background: "var(--sand)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
