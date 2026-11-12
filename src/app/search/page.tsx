"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

interface SearchProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  retailPrice: number;
  groupPrice: number;
  minPoolSize: number;
  poolMemberCount: number;
  poolDeadline: string | null;
  vendor: { name: string; imageUrl?: string | null };
  isFlashDeal?: boolean;
  category: string;
}

const CATEGORIES = ["All", "Food", "Electronics", "Fashion", "Groceries", "Home"];

function fmt(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
    // Autofocus
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string, cat: string) => {
    if (!q.trim() && cat === "All") {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("search", q.trim());
      if (cat !== "All") params.set("category", cat);
      params.set("limit", "30");
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, activeCategory);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeCategory, doSearch]);

  function saveSearch(q: string) {
    if (!q.trim()) return;
    const updated = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 8);
    setRecentSearches(updated);
    try { localStorage.setItem("chopdrop-recent-searches", JSON.stringify(updated)); } catch {}
  }

  function clearRecent() {
    setRecentSearches([]);
    try { localStorage.removeItem("chopdrop-recent-searches"); } catch {}
  }

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Search header — integrated input + pills */}
      <div style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { saveSearch(query); doSearch(query, activeCategory); } }}
              placeholder="What are you looking for?"
              className="w-full h-[44px] pl-11 pr-4 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--sand)", color: "var(--text)" }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); setSearched(false); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--border)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="h-[30px] px-3.5 rounded-full text-[12px] font-bold whitespace-nowrap shrink-0 transition-colors"
              style={{
                background: activeCategory === cat ? "var(--dark)" : "transparent",
                color: activeCategory === cat ? "white" : "var(--text-muted)",
                border: activeCategory === cat ? "none" : "1px solid var(--border)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Recent searches */}
      {!query && !searched && recentSearches.length > 0 && (
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Recent</p>
            <button type="button" onClick={clearRecent} className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>Clear all</button>
          </div>
          <div className="flex flex-col gap-0">
            {recentSearches.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuery(s); saveSearch(s); }}
                className="flex items-center gap-3 h-[44px] text-left press-feedback"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending + popular categories (show when no query and no recent) */}
      {!query && !searched && recentSearches.length === 0 && (
        <div className="px-5 mt-5">
          {/* Trending searches */}
          <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text)" }}>Trending on ChopDrop</p>
          <div className="flex flex-col gap-0 mb-6">
            {["Jollof rice", "Shawarma", "Airpods", "Rice 50kg", "Sneakers", "Blender", "Chicken"].map((term, i) => (
              <button
                key={term}
                type="button"
                onClick={() => { setQuery(term); saveSearch(term); }}
                className="flex items-center gap-3 h-[44px] text-left press-feedback"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: i < 3 ? "var(--coral)" : "var(--sand)", color: i < 3 ? "white" : "var(--text-muted)" }}>{i + 1}</span>
                <span className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{term}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="ml-auto shrink-0"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            ))}
          </div>

          {/* Quick category cards */}
          <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text)" }}>Browse by category</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { name: "Food", color: "#C4572A", bg: "#FEF2F0" },
              { name: "Groceries", color: "#1A7D4B", bg: "#ECFDF5" },
              { name: "Electronics", color: "#6366F1", bg: "#EEF2FF" },
              { name: "Fashion", color: "#EC4899", bg: "#FDF2F8" },
            ].map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => { setActiveCategory(cat.name); setQuery(""); }}
                className="h-[48px] rounded-[12px] flex items-center gap-2.5 px-3.5 press-feedback"
                style={{ background: cat.bg }}
              >
                <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: cat.color }}>
                  <span className="text-[11px] font-bold text-white">{cat.name.charAt(0)}</span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: cat.color }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-5 mt-6">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-[120px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 80}ms` }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div className="h-4 w-1/2 rounded" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div className="px-5 mt-5">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              </div>
              <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>No results found</h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Try a different search or browse categories above.</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-muted)" }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {results.map((product) => {
                  const savePct = Math.round(((product.retailPrice - product.groupPrice) / product.retailPrice) * 100);
                  const hasFilling = product.poolMemberCount > 0 && product.poolDeadline;
                  const fillPct = hasFilling ? Math.round((product.poolMemberCount / product.minPoolSize) * 100) : 0;
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="rounded-[16px] overflow-hidden press-feedback"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {/* Image */}
                      <div className="h-[120px] relative" style={{ background: "var(--sand)" }}>
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[28px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{product.name.charAt(0)}</span>
                          </div>
                        )}
                        {product.isFlashDeal && (
                          <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded text-white" style={{ background: "var(--coral)" }}>Flash</span>
                        )}
                        {savePct >= 10 && (
                          <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ background: "var(--emerald)" }}>{savePct}% off</span>
                        )}
                      </div>
                      {/* Details */}
                      <div className="p-3">
                        <p className="text-[13px] font-bold leading-tight line-clamp-2" style={{ color: "var(--text)" }}>{product.name}</p>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{product.vendor.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-[17px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{fmt(product.groupPrice)}</span>
                          {product.retailPrice > product.groupPrice && (
                            <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fmt(product.retailPrice)}</span>
                          )}
                        </div>
                        {/* Fill bar */}
                        {hasFilling && (
                          <div className="mt-2">
                            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(fillPct, 100)}%`, background: "var(--emerald)" }} />
                            </div>
                            <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--emerald)" }}>{product.poolMemberCount}/{product.minPoolSize} joined</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
}
