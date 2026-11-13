"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface Product {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number; minPoolSize: number;
  poolable: boolean;
}

interface StoreDetail {
  id: string; name: string; address: string; phone: string;
  imageUrl: string | null; bannerUrl: string | null;
  groupTiers?: unknown;
  categories: string[]; products: Product[];
  combos: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: number; originalPrice: number | null }>;
  menuCategories: Array<{ id: string; name: string; items: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: number }> }>;
}

interface GroupTier { min: number; discount: number; }
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
  const [sheetQty, setSheetQty] = useState(1);
  const [livePools, setLivePools] = useState<RealPool[]>([]);
  const cart = useCart();

  function addToPlate(item: Product, storeName: string) {
    cart.addItem({ dailyMenuId: item.id, name: item.name, description: item.description || "", imageUrl: item.imageUrl, restaurantName: storeName, price: item.retailPrice });
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
        <div className="h-[200px] rounded-b-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />

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
        <div className="px-5 mt-5 rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
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

      {/* ── Header — clean nav ── */}
      <div className="px-5 pt-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback shrink-0" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold flex-1 truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{store.name}</h1>
        <Link href="/cart" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
        </Link>
      </div>

      {/* ── Banner + vendor info ── */}
      {store.bannerUrl && (
        <div className="px-5 mt-3">
          <div className="h-[140px] rounded-[16px] overflow-hidden relative" style={{ background: "var(--sand)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover" />
            {store.imageUrl && (
              <div className="absolute bottom-3 left-3 w-[40px] h-[40px] rounded-full overflow-hidden" style={{ border: "3px solid white" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="px-5 mt-3">
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{store.address}</p>
      </div>

      {/* Group order hub removed — action happens via product cards + sticky bar */}

      {/* ═══ THE FULL MENU ═══ */}
      <section className="px-5 mt-6">
        <h2 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Menu</h2>

        {/* Menu search */}
        <div className="relative mt-3 mb-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full h-[38px] pl-9 pr-3 rounded-[10px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
            style={{ background: "var(--sand)", color: "var(--text)" }}
          />
        </div>

        {/* Category pills — 44px touch target */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mt-4">
          {menuTabs.filter((v, i, a) => a.indexOf(v) === i).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="h-[36px] px-4 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer shrink-0 press-feedback"
              style={{ background: currentTab === tab ? "var(--dark)" : "var(--sand)", color: currentTab === tab ? "white" : "var(--text-secondary)", transition: "background 150ms, color 150ms" }}
            >{tab}</button>
          ))}
        </div>

        {/* Menu items by category */}
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
            <div key={cat} className="mt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--coral)" }}>{cat} · {validItems.length} meal{validItems.length !== 1 ? "s" : ""}</p>

              {/* Group-eligible items — product card grid */}
              {poolItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {poolItems.map((item) => {
                    const hasDiscount = item.groupPrice < item.retailPrice;
                    const sav = hasDiscount ? Math.round(((item.retailPrice - item.groupPrice) / item.retailPrice) * 100) : 0;
                    const inCart = cart.items.find((c) => c.dailyMenuId === item.id)?.quantity || 0;
                    const itemPool = livePools.find(lp => lp.productId === item.id);
                    const activeGroups = itemPool ? 1 : 0;
                    return (
                      <div key={item.id} className="relative">
                        <button type="button" onClick={() => { setSelectedItem(item); setSheetQty(1); }} className="block press-feedback text-left w-full">
                          {/* Image */}
                          <div className="relative rounded-[12px] overflow-hidden" style={{ aspectRatio: "1", background: "var(--sand)" }}>
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[18px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.2 }}>{item.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          {/* Add button — overlaps bottom-right of image */}
                          {inCart === 0 && (
                            <button type="button" aria-label={`Add ${item.name}`} onClick={(e) => { e.preventDefault(); addToPlate(item, store.name); }}
                              className="absolute top-[calc(100%-68px)] right-1 w-[28px] h-[28px] rounded-full flex items-center justify-center z-10"
                              style={{ background: "var(--coral)" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                          {inCart > 0 && (
                            <span className="absolute top-[calc(100%-68px)] right-1 w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10" style={{ background: "var(--coral)" }}>
                              {inCart}
                            </span>
                          )}
                          {/* Info */}
                          <div className="mt-1.5">
                            <p className="text-[11px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-[13px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(item.groupPrice)}</span>
                              {hasDiscount && <span className="text-[9px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(item.retailPrice)}</span>}
                            </div>
                          </div>
                        </button>
                        {/* Groups Active badge */}
                        <p className="text-[9px] font-bold mt-0.5" style={{ color: activeGroups > 0 ? "var(--coral)" : "var(--text-muted)" }}>
                          {activeGroups} {activeGroups === 1 ? "Group" : "Groups"} Active
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Regular menu items */}
              {menuItems.length > 0 && (
                <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {menuItems.map((item, i) => {
                    const inCart = cart.items.find((c) => c.dailyMenuId === item.id)?.quantity || 0;
                    return (
                      <div key={item.id}>
                        {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="w-[56px] h-[56px] rounded-[12px] object-cover shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                              <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold leading-[135%]" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</h4>
                            {item.description && <p className="text-[11px]" style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>}
                            <p className="text-[14px] font-extrabold tabular-nums mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(item.retailPrice)}</p>
                          </div>
                          {inCart > 0 ? (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button type="button" aria-label="Decrease quantity" onClick={() => cart.changeQuantity(item.id, -1)}
                                className="w-[36px] h-[36px] rounded-full flex items-center justify-center press-feedback"
                                style={{ background: "var(--sand)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                              </button>
                              <span className="w-[24px] text-center text-[14px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{inCart}</span>
                              <button type="button" aria-label="Add another" onClick={() => addToPlate(item, store.name)}
                                className="w-[36px] h-[36px] rounded-full flex items-center justify-center press-feedback"
                                style={{ background: "var(--coral)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button type="button" aria-label={`Add ${item.name} to plate`} onClick={() => addToPlate(item, store.name)}
                              className="w-[36px] h-[36px] rounded-full flex items-center justify-center press-feedback shrink-0"
                              style={{ background: "var(--coral)" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Trust copy ── */}
      <div className="px-5 mt-8 mb-4">
        <p className="text-[11px] leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Pickup only · Pickup instructions are on every order. Wait for the vendor&apos;s ready alert before you set off.
        </p>
      </div>

      {/* ── Sticky cart bar ── */}
      {cart.totalItems > 0 && (() => {
        const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return (
          <div className="fixed bottom-[60px] left-0 right-0 z-40 px-5 pt-3 pb-3" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
            <div className="max-w-[480px] mx-auto">
              <Link href="/cart" className="w-full h-[50px] rounded-full flex items-center justify-between px-5 text-[14px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.25)" }}>{cart.totalItems}</span>
                  <span>View plate</span>
                </div>
                <span className="tabular-nums">{fp(total)}</span>
              </Link>
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
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-[8px] px-4 py-3" style={{ background: isError ? "var(--coral)" : "var(--emerald)" }}>
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
            <div className="fixed inset-0 z-[80]" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedItem(null)} />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[81] rounded-t-[24px] max-w-[480px] mx-auto" style={{ background: "var(--card)", animation: "slideUp 200ms ease-out" }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mt-3" style={{ background: "var(--border)" }} />

              <div className="px-5 pt-3 pb-8 max-h-[80vh] overflow-y-auto">
                {/* Product image */}
                {item.imageUrl && (
                  <div className="rounded-[16px] overflow-hidden mb-3" style={{ height: "180px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {hasDiscount && (
                      <span className="relative -top-[170px] left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-[8px] text-white" style={{ background: "var(--emerald)" }}>
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
                      {hasDiscount && <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--emerald)" }}>Group · join others</p>}
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

                {/* Tier info (if no active pool) */}
                {!itemPool && tiers.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {tiers.map((t) => (
                      <div key={t.min} className="flex-1 rounded-[10px] py-2 text-center" style={{ background: "var(--sand)" }}>
                        <p className="text-[12px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{t.min}+</p>
                        <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>people</p>
                        <p className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>{t.discount}% off</p>
                      </div>
                    ))}
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
                      router.push(`/product/${item.id}`);
                    }}
                    className="w-full h-[50px] rounded-[12px] flex items-center justify-between px-5 text-[15px] font-bold text-white press-feedback"
                    style={{ background: "var(--coral)" }}
                  >
                    <span>{itemPool ? "Join Group" : "Start Group"} · {fp(item.groupPrice * sheetQty)}</span>
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
                {/* Share — subtle text link below CTAs */}
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/product/${item.id}`;
                    const text = `${item.name} for ${fp(item.groupPrice)} on ChopDrop (${sav}% off with group). ${url}`;
                    if (navigator.share) navigator.share({ title: item.name, text, url }).catch(() => {});
                    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { setAddedToast("Link copied!"); setTimeout(() => setAddedToast(""), 2000); }).catch(() => {});
                  }}
                  className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer w-full"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                  Share this deal
                </button>
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

      <BottomNav />
    </main>
  );
}
