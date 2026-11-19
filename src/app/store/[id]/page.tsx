"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";
import { TierSelectorSheet } from "@/components/tier-selector-sheet";

interface Product {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number; minPoolSize: number;
  poolable: boolean;
}

interface StoreDetail {
  id: string; name: string; address: string; phone: string;
  imageUrl: string | null; bannerUrl: string | null;
  groupTiers?: unknown;
  groupTarget: number; groupDiscount: number; groupWindowMins: number;
  deliveryFee: number; freeDeliveryMin: number; groupDeliveryPct: number;
  categories: string[]; products: Product[];
  combos: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: number; originalPrice: number | null }>;
  menuCategories: Array<{ id: string; name: string; items: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: number }> }>;
}

interface GroupTier { min: number; discount: number; duration?: number; } // duration in minutes
function parseStoreTiers(raw: unknown): GroupTier[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((t): t is GroupTier => typeof t === "object" && t !== null && typeof t.min === "number" && typeof t.discount === "number" && t.min > 0 && t.discount > 0).sort((a, b) => a.min - b.min);
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface RealPool {
  id: string;
  memberCount: number;
  spotsLeft: number;
  deadline: string;
  minSize: number;
  productId: string;
}

const AVATAR_COLORS = ["#1C1C1E", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];

function LiveTimer({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const iv = setInterval(() => setLeft(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(iv);
  }, [deadline]);
  if (left <= 0) return <span style={{ color: "var(--coral)" }}>expired</span>;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const urgent = left < 600;
  return (
    <span className="tabular-nums" style={{ color: urgent ? "var(--coral)" : "var(--emerald)" }}>
      {h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`}
    </span>
  );
}

function StoreTabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const uniqueTabs = tabs.filter((v, i, a) => a.indexOf(v) === i);
    const idx = uniqueTabs.indexOf(active);
    const el = textRefs.current[idx];
    const container = scrollRef.current;
    if (el && container) {
      setIndicator({ left: el.offsetLeft - container.scrollLeft, width: el.offsetWidth });
      // Auto-scroll to keep active tab visible
      const btnLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, btnLeft), behavior: "smooth" });
    }
  }, [active, tabs]);

  useEffect(() => { updateIndicator(); }, [updateIndicator]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateIndicator, { passive: true });
    return () => el.removeEventListener("scroll", updateIndicator);
  }, [updateIndicator]);

  return (
    <div className="relative mt-4">
      <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}>
        {tabs.filter((v, i, a) => a.indexOf(v) === i).map((tab, i) => {
          const isActive = active === tab;
          return (
            <button key={tab} type="button"
              onClick={() => onChange(tab)}
              className={`${i === 0 ? "pr-3" : "px-3"} pb-2 text-[13px] font-semibold whitespace-nowrap cursor-pointer shrink-0`}
              style={{ color: isActive ? "var(--coral)" : "var(--text-muted)", transition: "color 200ms ease-out" }}>
              <span ref={el => { textRefs.current[i] = el; }}>{tab}</span>
            </button>
          );
        })}
      </div>
      {/* Track line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--border)" }} />
      {/* Sliding indicator */}
      <div className="absolute bottom-0 h-[2px] rounded-full z-10" style={{
        left: `${indicator.left}px`,
        width: `${indicator.width}px`,
        background: "var(--coral)",
        transition: "left 250ms cubic-bezier(0.4,0,0.2,1), width 250ms cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [addedToast, setAddedToast] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const touchStartX = useRef(0);
  const swipeTab = useCallback((direction: "left" | "right", tabs: string[], current: string) => {
    const idx = tabs.indexOf(current);
    const next = direction === "left" ? Math.min(idx + 1, tabs.length - 1) : Math.max(idx - 1, 0);
    setActiveTab(tabs[next]);
  }, []);
  const [sheetQty, setSheetQty] = useState(1);
  const [livePools, setLivePools] = useState<RealPool[]>([]);
  const cart = useCart();
  const [storeTierSheet, setStoreTierSheet] = useState(false);
  const [storeTierLoading, setStoreTierLoading] = useState(false);
  const [storeTierPools, setStoreTierPools] = useState<Record<number, { memberCount: number; poolId: string; spotsLeft: number } | null>>({});
  const [storeTierProductId, setStoreTierProductId] = useState("");

  function addToPlate(item: Product, storeName: string) {
    cart.addItem({ dailyMenuId: item.id, name: item.name, description: item.description || "", imageUrl: item.imageUrl, restaurantId: id, restaurantName: storeName, price: item.retailPrice });
    setAddedToast(item.name);
    setTimeout(() => setAddedToast(""), 2000);
  }

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/stores/${id}`, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.success) setStore(d.data); setLoading(false); })
      .catch((e) => { if ((e as Error).name !== "AbortError") { setError(true); setLoading(false); } });
    return () => ctrl.abort();
  }, [id]);

  // Fetch real pools for this store's products
  useEffect(() => {
    if (!store) return;
    const productIds = store.products.map((p: { id: string }) => p.id);
    if (productIds.length === 0) return;
    Promise.all(
      productIds.slice(0, 10).map((pid: string) =>
        fetch(`/api/pools?productId=${pid}`).then(r => r.json()).catch(() => ({ success: false }))
      )
    ).then((results) => {
      const now = Date.now();
      const active: RealPool[] = [];
      for (const r of results) {
        if (r.success && r.data) {
          for (const p of r.data) {
            if (new Date(p.deadline).getTime() > now && p.status === "OPEN") {
              active.push({ id: p.id, memberCount: p.memberCount, spotsLeft: p.minSize - p.memberCount, deadline: p.deadline, minSize: p.minSize, productId: p.productId || "" });
            }
          }
        }
      }
      setLivePools(active);
    });
  }, [store]);

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        {/* Hero image placeholder */}
        <div className="h-[200px] rounded-b-[16px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />

        {/* Vendor name + address */}
        <div className="px-5 mt-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          <div className="flex-1 space-y-2">
            <div className="h-6 rounded-[12px] w-[55%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "150ms" }} />
            <div className="h-4 rounded-[12px] w-[75%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "200ms" }} />
          </div>
        </div>

        {/* Category pills placeholder */}
        <div className="px-5 mt-5 flex gap-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="h-[25px] rounded-full shrink-0" style={{ width: `${w}px`, background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${250 + i * 50}ms` }} />
          ))}
        </div>

        {/* Menu item rows */}
        <div className="px-5 mt-5 rounded-[16px] overflow-hidden" style={{ background: "var(--card)" }}>
          {[0, 1, 2].map((i) => (
            <div key={i}>
              {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-[56px] h-[56px] rounded-[12px] shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${400 + i * 100}ms` }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded-[12px] w-[60%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${450 + i * 100}ms` }} />
                  <div className="h-3 rounded-[12px] w-[35%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${500 + i * 100}ms` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <BottomNav />
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "#1C1C1E" }}>Couldn&apos;t load restaurant</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white cursor-pointer press-feedback" style={{ background: "var(--coral)" }}>Try again</button>
          <button type="button" onClick={() => router.push("/home")} className="text-[13px] font-bold mt-3 block cursor-pointer" style={{ color: "var(--text-muted)" }}>Back to home</button>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Merge all menu sources into a unified Product list
  // 1. New-style products (have groupPrice)
  // 2. Old-style combos (meals with type FIXED)
  // 3. Old-style menuCategory items
  const productsFromCombos: Product[] = store.combos.map((c) => ({
    id: c.id, name: c.name, description: c.description, imageUrl: c.imageUrl,
    category: "Combos", subcategory: null,
    retailPrice: c.originalPrice || c.price, groupPrice: c.price, minPoolSize: 10,
    poolable: true,
  }));
  const productsFromMenu: Product[] = store.menuCategories.flatMap((cat) =>
    cat.items.map((item) => ({
      id: item.id, name: item.name, description: item.description, imageUrl: item.imageUrl,
      category: cat.name, subcategory: null,
      retailPrice: item.price, groupPrice: item.price, minPoolSize: 10,
      poolable: false,
    })),
  );
  // Deduplicate by id — products take priority, then combos, then menu items
  const seenIds = new Set<string>();
  const allItems: Product[] = [];
  const taggedProducts = store.products.map((p) => ({ ...p, poolable: true }));
  for (const list of [taggedProducts, productsFromCombos, productsFromMenu]) {
    for (const p of list) {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); allItems.push(p); }
    }
  }

  // Featured pool product — only show if there's a real active pool or a product with savings
  const featured = allItems.find((p) => p.groupPrice < p.retailPrice && p.imageUrl);
  const featuredPool = featured ? livePools.find((lp) => lp.productId === featured.id) : null;
  const featuredSav = featured ? Math.round(((featured.retailPrice - featured.groupPrice) / featured.retailPrice) * 100) : 0;
  const featuredMinutesLeft = featuredPool ? Math.max(0, Math.round((new Date(featuredPool.deadline).getTime() - Date.now()) / 60000)) : 0;
  const hasLivePool = featuredPool && featuredMinutesLeft > 0;

  const menuTabs = [...new Set(allItems.map((p) => p.subcategory || p.category))];
  // Default to first tab
  const currentTab = menuTabs.includes(activeTab) ? activeTab : menuTabs[0] || "";
  const tabFiltered = menuTabs.length <= 1 ? allItems : allItems.filter((p) => (p.subcategory || p.category) === currentTab);
  const sq = menuSearch.trim().toLowerCase();
  const filteredItems = sq.length >= 2 ? tabFiltered.filter(p => p.name.toLowerCase().includes(sq)) : tabFiltered;

  // Group by subcategory
  const grouped = new Map<string, Product[]>();
  for (const p of filteredItems) {
    const key = p.subcategory || p.category || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* ── Banner with overlaid nav + store info ── */}
      <div className="relative" style={{ background: "var(--sand)" }}>
        {/* Banner image — full bleed */}
        <div className="h-[180px] overflow-hidden">
          {store.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
              <span className="text-[40px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{store.name.charAt(0)}</span>
            </div>
          )}
          {/* Dark gradient at top for nav buttons */}
          <div className="absolute inset-x-0 top-0 h-[70px]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)" }} />
        </div>
        {/* Nav buttons — overlaid on banner */}
        <div className="absolute top-0 left-0 right-0 px-5 pt-4 flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback shrink-0" style={{ background: "rgba(255,255,255,0.9)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { const el = document.getElementById("menu-search"); if (el) { el.classList.toggle("hidden"); el.focus(); } }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.9)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
            <Link href="/cart" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.9)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            </Link>
          </div>
        </div>
        {/* Store name + logo — overlapping bottom of banner */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 flex items-end gap-3">
          <div className="absolute inset-x-0 bottom-0 h-[60px]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
          {store.imageUrl && (
            <div className="relative w-[46px] h-[46px] rounded-[12px] overflow-hidden shrink-0" style={{ border: "3px solid white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative flex-1 min-w-0">
            <h1 className="text-[18px] font-extrabold truncate text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{store.name}</h1>
            <p className="text-[11px] truncate text-white/70">{store.address}</p>
          </div>
        </div>
      </div>

      {/* ═══ GROUP ORDER CARD ═══ */}
      {store.groupTarget > 0 && store.groupDiscount > 0 && (() => {
        const totalPoolMembers = livePools.reduce((s, p) => s + p.memberCount, 0);
        const hasLivePool = livePools.length > 0 && totalPoolMembers > 0;
        const earliestDeadline = livePools.length > 0 ? livePools.reduce((earliest, p) => p.deadline < earliest ? p.deadline : earliest, livePools[0].deadline) : null;
        const spotsLeft = store.groupTarget - totalPoolMembers;
        return (
        <div className="px-5 mt-4">
          <div className="rounded-[16px] overflow-hidden p-4 card-enter" style={{ background: "var(--sand)" }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Order with others & save</span>
            </div>
            {/* Tier rows */}
            <div className="space-y-2">
              {[3, 5, store.groupTarget].map((size, ti) => {
                const tierDiscount = ti === 0 ? 10 : ti === 1 ? 20 : store.groupDiscount;
                const tierPool = livePools.find(lp => lp.minSize === size);
                const hasTierPool = tierPool && tierPool.memberCount > 0;
                const isBest = ti === 2;
                const showMax = Math.min(size, 6);
                const overflow = size - showMax;
                return (
                <div key={size} className="flex items-center gap-2">
                  {/* Label */}
                  <div className="shrink-0" style={{ minWidth: "58px" }}>
                    <span className="text-[11px] font-bold" style={{ color: "var(--text)" }}>{size} people</span>
                    <span className="text-[9px] font-extrabold ml-1" style={{ color: isBest ? "var(--emerald)" : "var(--coral)" }}>{tierDiscount}%</span>
                    {isBest && <span className="text-[7px] font-bold ml-0.5 px-1 py-0.5 rounded-full" style={{ background: "var(--emerald)", color: "white" }}>Best</span>}
                  </div>
                  {/* Avatars */}
                  <div className="flex items-center flex-1">
                    <div className="flex -space-x-1.5">
                      {Array.from({ length: showMax }).map((_, j) => {
                        const filled = hasTierPool && j < tierPool.memberCount;
                        return (
                        <div key={j} className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[7px] font-bold"
                          style={{
                            background: filled ? "var(--coral)" : "var(--card)",
                            border: filled ? "1.5px solid var(--sand)" : "1.5px dashed var(--border)",
                            color: filled ? "white" : "var(--text-muted)",
                          }}>
                          {filled ? String.fromCharCode(65 + j) : "?"}
                        </div>
                        );
                      })}
                    </div>
                    {overflow > 0 && <span className="text-[9px] font-bold ml-1" style={{ color: "var(--text-muted)" }}>+{overflow}</span>}
                  </div>
                  {/* Timer */}
                  {hasTierPool ? (
                    <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <span className="text-[10px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>
                        <LiveTimer deadline={tierPool.deadline} />
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full" style={{ background: "var(--card)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <span className="text-[10px] font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {Math.floor((store.groupWindowMins || 120) / 60)}h window
                      </span>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ THE FULL MENU ═══ */}
      <section className="px-5 mt-4">
        {/* Hidden search — toggled by header icon */}
        <input
          id="menu-search"
          type="text"
          value={menuSearch}
          onChange={(e) => setMenuSearch(e.target.value)}
          placeholder="Search menu..."
          className="hidden w-full h-[38px] pl-3 pr-3 rounded-[12px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] mb-3"
          style={{ background: "var(--sand)", color: "var(--text)" }}
          onBlur={(e) => { if (!e.target.value) e.target.classList.add("hidden"); }}
        />

        {/* Category tabs — underlined text style */}
        <StoreTabBar tabs={menuTabs} active={currentTab} onChange={setActiveTab} />

        {/* Menu items by category — swipeable */}
        <div
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 60) swipeTab(dx < 0 ? "left" : "right", menuTabs, currentTab);
          }}>
        {Array.from(grouped.entries()).map(([cat, items]) => {
          // Filter out ₦0 placeholder items and deduplicate by name
          const seen = new Set<string>();
          const validItems = items.filter((i) => {
            if (i.retailPrice <= 0 && i.groupPrice <= 0) return false;
            if (seen.has(i.name)) return false;
            seen.add(i.name);
            return true;
          });
          const poolItems = validItems.filter((i) => i.groupPrice < i.retailPrice || i.poolable);
          const menuItems = validItems.filter((i) => !(i.groupPrice < i.retailPrice) && !i.poolable);
          if (validItems.length === 0) return null;

          return (
            <div key={cat} className="mt-4">

              {/* Group-eligible items — product card grid */}
              {poolItems.length > 0 && (
                <div className="space-y-0 mb-2">
                  {poolItems.map((item) => {
                    const hasDiscount = item.groupPrice < item.retailPrice;
                    const sav = hasDiscount ? Math.round(((item.retailPrice - item.groupPrice) / item.retailPrice) * 100) : 0;
                    const inCart = cart.items.find((c) => c.dailyMenuId === item.id)?.quantity || 0;
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <Link href={`/product/${item.id}`} className="relative shrink-0 press-feedback">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="w-[70px] h-[70px] rounded-[12px] object-cover" loading="lazy" />
                          ) : (
                            <div className="w-[70px] h-[70px] rounded-[12px] flex items-center justify-center" style={{ background: "var(--sand)" }}>
                              <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--coral)" }}>{fp(item.retailPrice)}</p>
                          <Link href={`/product/${item.id}`}><h4 className="text-[14px] font-bold leading-tight mt-0.5" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</h4></Link>
                          {item.description && <p className="text-[11px] mt-0.5 leading-[145%]" style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>}
                        </div>
                        <div className="shrink-0 self-end mb-1 w-[86px] flex justify-end items-center">
                          <div className="flex items-center overflow-hidden" style={{
                            maxWidth: inCart > 0 ? "54px" : "0px",
                            opacity: inCart > 0 ? 1 : 0,
                            transition: "max-width 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease-out",
                          }}>
                            <button type="button" onClick={() => cart.changeQuantity(item.id, -1)}
                              className="w-[28px] h-[28px] rounded-lg flex items-center justify-center press-feedback shrink-0"
                              style={{ background: "var(--sand)" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                            </button>
                            <span className="w-[22px] text-center text-[14px] font-extrabold tabular-nums shrink-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{inCart}</span>
                          </div>
                          <button type="button" onClick={() => addToPlate(item, store.name)}
                            className="w-[28px] h-[28px] rounded-lg flex items-center justify-center press-feedback shrink-0"
                            style={{ background: "var(--coral)" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Regular menu items — list rows */}
              {menuItems.length > 0 && (
                <div className="space-y-0">
                  {menuItems.map((item) => {
                    const inCart = cart.items.find((c) => c.dailyMenuId === item.id)?.quantity || 0;
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="w-[70px] h-[70px] rounded-[12px] object-cover shrink-0" loading="lazy" />
                        ) : (
                          <div className="w-[70px] h-[70px] rounded-[12px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                            <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--coral)" }}>{fp(item.retailPrice)}</p>
                          <h4 className="text-[14px] font-bold leading-tight mt-0.5" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</h4>
                          {item.description && <p className="text-[11px] mt-0.5 leading-[145%]" style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>}
                        </div>
                        {/* Add button — right side, fixed width to prevent text shift */}
                        <div className="shrink-0 self-end mb-1 w-[86px] flex justify-end items-center">
                          {/* Minus + count — expand from right */}
                          <div className="flex items-center gap-1 overflow-hidden" style={{
                            maxWidth: inCart > 0 ? "54px" : "0px",
                            opacity: inCart > 0 ? 1 : 0,
                            transition: "max-width 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease-out",
                          }}>
                            <button type="button" aria-label="Decrease" onClick={() => cart.changeQuantity(item.id, -1)}
                              className="w-[28px] h-[28px] rounded-lg flex items-center justify-center press-feedback shrink-0"
                              style={{ background: "var(--sand)" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                            </button>
                            <span className="w-[22px] text-center text-[14px] font-extrabold tabular-nums shrink-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{inCart}</span>
                          </div>
                          {/* Plus button — always visible */}
                          <button type="button" aria-label={`Add ${item.name}`} onClick={() => addToPlate(item, store.name)}
                            className="w-[28px] h-[28px] rounded-lg flex items-center justify-center press-feedback shrink-0"
                            style={{ background: "var(--coral)", transition: "transform 150ms ease-out", transform: inCart > 0 ? "scale(1)" : "scale(1)" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </section>

      {/* ── Trust copy ── */}
      <div className="px-5 mt-8 mb-4">
        <p className="text-[11px] leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Pickup only · Pickup instructions are on every order. Wait for the vendor&apos;s ready alert before you set off.
        </p>
      </div>

      {/* ── Sticky cart bar — solo vs group ── */}
      {cart.totalItems > 0 && (() => {
        const storeItems = cart.items.filter(i => i.restaurantId === id || i.restaurantName === store.name);
        if (storeItems.length === 0) return null;
        const storeItemCount = storeItems.reduce((s, i) => s + i.quantity, 0);
        const subtotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const soloTotal = subtotal;
        const groupTotal = Math.round(subtotal * (1 - (store.groupDiscount || 0) / 100));
        const hasGroupDiscount = store.groupTarget > 0 && store.groupDiscount > 0;
        return (
          <div className="fixed bottom-[60px] left-0 right-0 z-40 px-5 pt-3 pb-3" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
            <div className="max-w-[480px] mx-auto">
              {hasGroupDiscount ? (
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => { cart.setCheckoutMode(store.name, "solo"); router.push("/cart"); }}
                    className="flex-1 h-[56px] rounded-[12px] flex items-center justify-between px-4 press-feedback"
                    style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}>
                    <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Alone</span>
                    <span className="text-[16px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(soloTotal)}</span>
                  </button>
                  <button type="button" onClick={() => {
                    // Pick the first cart item's product ID for the tier selector
                    const storeItems = cart.items.filter(i => i.restaurantName === store.name);
                    const firstItem = storeItems[0];
                    if (firstItem) {
                      const pid = firstItem.dailyMenuId.replace("instant-", "");
                      setStoreTierProductId(pid);
                      // Fetch existing pools for this product
                      fetch(`/api/pools?productId=${pid}`).then(r => r.json()).then(d => {
                        if (d.success && d.data) {
                          const bySize: Record<number, { memberCount: number; poolId: string; spotsLeft: number } | null> = {};
                          for (const p of d.data) {
                            const existing = bySize[p.minSize];
                            if (!existing || p.memberCount > existing.memberCount) {
                              bySize[p.minSize] = { memberCount: p.memberCount, poolId: p.id, spotsLeft: p.spotsLeft };
                            }
                          }
                          setStoreTierPools(bySize);
                        }
                      }).catch(() => {});
                      setStoreTierSheet(true);
                    }
                  }}
                    className="flex-[1.4] h-[56px] rounded-[12px] flex items-center justify-center text-white press-feedback"
                    style={{ background: "var(--coral)" }}>
                    <span className="text-[13px] font-bold">Join & save</span>
                    <span className="text-[16px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fp(groupTotal)}</span>
                  </button>
                </div>
              ) : (
                <Link href="/cart" className="w-full h-[54px] rounded-[12px] flex items-center justify-between px-5 text-white press-feedback" style={{ background: "var(--coral)" }}>
                  <div>
                    <span className="text-[15px] font-bold block leading-none">Checkout</span>
                    <span className="text-[10px] font-medium opacity-70 mt-0.5 block">{cart.totalItems} {cart.totalItems === 1 ? "item" : "items"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[16px] font-extrabold tabular-nums block leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fp(soloTotal)}</span>
                    <span className="text-[10px] font-medium opacity-70 mt-0.5 block">+ delivery</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Toast ── */}
      {addedToast && (() => {
        const isError = addedToast.includes("error") || addedToast.includes("Log in") || addedToast.includes("Couldn") || addedToast.includes("not available");
        const isPlateAdd = !isError && !addedToast.includes("Network");
        return (
          <div className="fixed z-[100] left-0 right-0 bottom-[120px] px-5 celebrate">
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-lg px-4 py-3" style={{ background: isError ? "var(--coral)" : "var(--emerald)" }}>
              {!isError && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>}
              <span className="text-[13px] font-bold text-white">{isPlateAdd ? `${addedToast} added to plate` : addedToast}</span>
            </div>
          </div>
        );
      })()}

      {/* ═══ PRODUCT BOTTOM SHEET ═══ */}
      {selectedItem && store && (() => {
        const item = selectedItem;
        const hasDiscount = item.groupPrice < item.retailPrice;
        const sav = hasDiscount ? Math.round(((item.retailPrice - item.groupPrice) / item.retailPrice) * 100) : 0;
        const savAmount = item.retailPrice - item.groupPrice;
        const itemPool = livePools.find(lp => lp.productId === item.id);
        const poolMins = itemPool ? Math.max(0, Math.round((new Date(itemPool.deadline).getTime() - Date.now()) / 60000)) : 0;
        const tiers = parseStoreTiers(store.groupTiers);
        return (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[80] backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedItem(null)} />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[81] rounded-t-[16px] max-w-[480px] mx-auto" style={{ background: "var(--card)", animation: "slideUp 200ms ease-out" }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mt-3" style={{ background: "var(--border)" }} />

              <div className="px-5 pt-3 pb-8 max-h-[80vh] overflow-y-auto">
                {/* Product image */}
                {item.imageUrl && (
                  <div className="rounded-[16px] overflow-hidden mb-3" style={{ height: "180px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {hasDiscount && (
                      <span className="relative -top-[170px] left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-lg text-white" style={{ background: "var(--emerald)" }}>
                        {sav}% less together
                      </span>
                    )}
                  </div>
                )}

                {/* Name + restaurant */}
                <h3 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{item.name}</h3>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{store.name}</p>

                {/* Prices — group vs solo */}
                <div className="mt-3">
                  <div className="flex items-baseline gap-3">
                    <div>
                      <span className="text-[28px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(item.groupPrice)}</span>
                      {hasDiscount && <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--emerald)" }}>Save {fp(item.retailPrice - item.groupPrice)}</p>}
                    </div>
                    {hasDiscount && (
                      <div>
                        <span className="text-[20px] font-extrabold tabular-nums leading-none line-through" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-muted)" }}>{fp(item.retailPrice)}</span>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>solo</p>
                      </div>
                    )}
                  </div>
                  {/* Refundable line removed */}
                </div>

                {/* Pool spots — empty avatar circles */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(item.minPoolSize, 5) }).map((_, i) => {
                      const filled = itemPool ? i < itemPool.memberCount : false;
                      return (
                        <div key={i} className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[11px] font-bold"
                          style={{ background: filled ? "var(--coral)" : "transparent", border: filled ? "2px solid var(--card)" : "2px dashed var(--border)", color: filled ? "white" : "var(--text-muted)" }}>
                          {filled ? String.fromCharCode(65 + i) : "?"}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>
                    {itemPool && itemPool.memberCount > 0
                      ? `${itemPool.memberCount} of ${item.minPoolSize} joined`
                      : `${item.minPoolSize} orders to unlock`}
                  </span>
                </div>

                {/* Live group status (if active) */}
                {itemPool && poolMins > 0 && (
                  <div className="mt-4 rounded-[12px] p-3" style={{ background: "var(--sand)" }}>
                    <div className="flex items-center justify-between text-[12px] font-bold">
                      <span style={{ color: "var(--text)" }}>{itemPool.memberCount}/{itemPool.minSize} people joined</span>
                      <span style={{ color: "var(--coral)" }}>{poolMins > 60 ? `${Math.floor(poolMins / 60)}h ${poolMins % 60}m` : `${poolMins}m`} left</span>
                    </div>
                    <div className="mt-1.5 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round((itemPool.memberCount / itemPool.minSize) * 100)}%`, background: "var(--emerald)" }} />
                    </div>
                  </div>
                )}

                {/* Price tiers — list format */}
                {tiers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[13px] font-bold mb-2" style={{ color: "var(--text)" }}>Price tiers</p>
                    <div className="flex flex-col gap-1.5">
                      {/* Solo price row */}
                      <div className="flex items-center justify-between h-[38px] px-3.5 rounded-[12px]" style={{ background: "var(--sand)" }}>
                        <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Solo</span>
                        <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(item.retailPrice)}</span>
                      </div>
                      {/* Tier rows */}
                      {tiers.map((t, i) => {
                        const tierPrice = Math.round(item.retailPrice * (1 - t.discount / 100));
                        const isLast = i === tiers.length - 1;
                        return (
                          <div key={t.min} className="flex items-center justify-between h-[38px] px-3.5 rounded-[12px]" style={{ background: isLast ? "var(--emerald-soft)" : "var(--sand)" }}>
                            <div className="flex items-center gap-1.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isLast ? "var(--emerald)" : "var(--text-muted)"} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                              <span className="text-[12px] font-medium" style={{ color: isLast ? "var(--emerald)" : "var(--text)" }}>{t.min}+ people</span>
                            </div>
                            <span className="text-[13px] font-bold tabular-nums" style={{ color: isLast ? "var(--emerald)" : "var(--text)" }}>{fp(tierPrice)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity picker */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Quantity</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setSheetQty(Math.max(1, sheetQty - 1))} className="w-[36px] h-[36px] rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="text-[16px] font-extrabold tabular-nums w-8 text-center" style={{ color: "var(--text)" }}>{sheetQty}</span>
                    <button type="button" onClick={() => setSheetQty(sheetQty + 1)} className="w-[36px] h-[36px] rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--coral)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                </div>

                {/* CTAs — two buttons stacked */}
                <div className="mt-4 space-y-2">
                  {/* Start/Join group — primary */}
                  <button
                    type="button"
                    onClick={() => {
                      for (let i = 0; i < sheetQty; i++) addToPlate(item, store.name);
                      setSelectedItem(null);
                      router.push(`/group/create?restaurant=${id}`);
                    }}
                    className="w-full h-[50px] rounded-[12px] flex items-center justify-between px-5 text-[15px] font-bold text-white press-feedback"
                    style={{ background: "var(--coral)" }}
                  >
                    <span>{itemPool ? "Join & save" : "Order & save"} · {fp(item.groupPrice * sheetQty)}</span>
                    {hasDiscount && <span className="text-[12px] opacity-80">Save {fp(savAmount * sheetQty)}</span>}
                  </button>
                  {/* Solo — secondary */}
                  <button
                    type="button"
                    onClick={() => {
                      for (let i = 0; i < sheetQty; i++) addToPlate(item, store.name);
                      setSelectedItem(null);
                    }}
                    className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[13px] font-bold press-feedback"
                    style={{ background: "var(--sand)", color: "var(--text)" }}
                  >
                    Solo · {fp(item.retailPrice * sheetQty)}
                  </button>
                </div>
                {/* Share only shown after group exists */}
              </div>

              <style jsx>{`
                @keyframes slideUp {
                  from { transform: translateY(100%); }
                  to { transform: translateY(0); }
                }
              `}</style>
            </div>
          </>
        );
      })()}

      {/* ═══ TIER SELECTOR SHEET ═══ */}
      {store && storeTierSheet && (() => {
        let sheetTiers = Array.isArray(store.groupTiers)
          ? (store.groupTiers as Array<{ min: number; discount: number }>).filter(t => t.min > 0 && t.discount > 0).sort((a, b) => a.min - b.min)
          : [];
        if (sheetTiers.length === 0 && store.groupTarget > 0 && store.groupDiscount > 0) {
          sheetTiers = [
            { min: 3, discount: Math.round(store.groupDiscount * 0.33) },
            { min: 5, discount: Math.round(store.groupDiscount * 0.66) },
            { min: store.groupTarget, discount: store.groupDiscount },
          ].filter(t => t.discount > 0);
        }
        if (sheetTiers.length === 0) {
          sheetTiers = [{ min: 3, discount: 10 }, { min: 5, discount: 20 }, { min: 10, discount: 30 }];
        }
        const storeItems = cart.items.filter(i => i.restaurantName === store.name);
        const firstItemPrice = storeItems[0]?.price || 0;
        return (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" onClick={() => setStoreTierSheet(false)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="absolute bottom-0 left-0 right-0 sheet-enter" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[428px] mx-auto rounded-t-[16px] px-5 pt-5 pb-8" style={{ background: "var(--card)" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
              <h3 className="text-[20px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Order with others</h3>
              <p className="text-[12px] mt-0.5 mb-5" style={{ color: "var(--text-muted)" }}>Pick a group size. Doesn&apos;t fill? You still pay regular price.</p>

              <div className="space-y-3">
                {sheetTiers.map((t, i) => {
                  const tierPrice = firstItemPrice > 0 ? Math.round(firstItemPrice * (1 - t.discount / 100)) : 0;
                  const isBest = i === sheetTiers.length - 1;
                  const pool = storeTierPools[t.min];
                  const hasPool = pool && pool.memberCount > 0;
                  return (
                    <div key={t.min} className="flex items-center gap-3 py-3" style={{ borderBottom: i < sheetTiers.length - 1 ? "1px solid var(--border)" : "none" }}>
                      {/* Avatars */}
                      <div className="flex -space-x-1.5 shrink-0">
                        {Array.from({ length: Math.min(t.min, 5) }).map((_, j) => {
                          const filled = hasPool && j < pool.memberCount;
                          return (
                            <div key={j} className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold"
                              style={{ background: filled ? "var(--coral)" : "var(--sand)", border: filled ? "1.5px solid white" : "1.5px solid var(--border)", color: filled ? "white" : "var(--text-muted)" }}>
                              {filled ? "!" : ""}
                            </div>
                          );
                        })}
                      </div>
                      {/* Middle — name + discount + timer */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                          <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{t.min} people</span>
                          {isBest && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--emerald)", color: "white" }}>Best deal</span>}
                        </div>
                        <span className="text-[11px] font-bold mt-0.5 block" style={{ color: "var(--emerald)" }}>
                          {t.discount}% off {tierPrice > 0 ? `· Save ${fp(firstItemPrice - tierPrice)}` : ""}
                        </span>
                        <p className="text-[9px] font-bold mt-1" style={{ color: "var(--coral)" }}>
                          ⏱ {(() => { const m = t.duration || 25; return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}` : `${m}min`; })()} window
                        </p>
                      </div>
                      {/* Join button with amount */}
                      <button type="button" disabled={storeTierLoading} onClick={async () => {
                          setStoreTierLoading(true);
                          try {
                            const res = await fetch("/api/pools/find-or-create", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ productId: storeTierProductId, minSize: t.min, quantity: 1 }),
                            });
                            const json = await res.json();
                            if (json.success) {
                              setStoreTierSheet(false);
                              cart.setCheckoutMode(store.name, "group");
                              router.push("/cart");
                            }
                          } catch {}
                          setStoreTierLoading(false);
                        }}
                          className="h-[38px] px-3 rounded-[12px] flex flex-col items-center justify-center text-white press-feedback shrink-0 disabled:opacity-50"
                          style={{ background: "var(--emerald)" }}>
                          <span className="text-[10px] font-medium leading-none" style={{ opacity: 0.8 }}>{storeTierLoading ? "..." : "Join"}</span>
                          {tierPrice > 0 && <span className="text-[13px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fp(tierPrice)}</span>}
                        </button>
                    </div>
                  );
                })}
              </div>

              <button type="button" onClick={() => setStoreTierSheet(false)} className="w-full h-[40px] flex items-center justify-center text-[13px] font-bold press-feedback mt-3" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      <BottomNav />
    </main>
  );
}
