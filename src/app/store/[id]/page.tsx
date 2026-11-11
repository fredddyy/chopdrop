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
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "#1C1C1E" }}>Couldn&apos;t load store</h2>
          <button type="button" onClick={() => router.push("/discover")} className="text-[14px] font-bold mt-3 cursor-pointer" style={{ color: "var(--coral)" }}>Back to Discover</button>
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
  const filteredItems = menuTabs.length <= 1 ? allItems : allItems.filter((p) => (p.subcategory || p.category) === currentTab);

  // Group by subcategory
  const grouped = new Map<string, Product[]>();
  for (const p of filteredItems) {
    const key = p.subcategory || p.category || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Local Kitchens</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#1C1C1E", fontFamily: "'Bricolage Grotesque', sans-serif" }}>A kitchen your people trust</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Vendor profile ── */}
      <div className="px-5 mt-5 flex items-center gap-4">
        {store.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.imageUrl} alt={store.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-extrabold shrink-0" style={{ background: "var(--sand)", color: "var(--text-muted)" }}>
            {store.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
          </div>
        )}
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{store.name}</h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{store.address}</p>
        </div>
      </div>

      {/* ── Rating + pools badges ── */}
      <div className="px-5 mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "var(--sand)", color: "#1C1C1E" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--coral)" stroke="none" className="inline-block -mt-px mr-1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          4.9 · 128 reviews
        </span>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "var(--sand)", color: "#1C1C1E" }}>
          {store.products.length} pools completed
        </span>
        <Link href={`/group/create?restaurant=${id}`} className="text-[11px] font-bold px-3 py-1 rounded-full press-feedback" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline-block -mt-px mr-1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          Order with friends
        </Link>
      </div>


      {/* ═══ GROUP DISCOUNT TIERS — if restaurant has them ═══ */}
      {(() => {
        const tiers = parseStoreTiers(store.groupTiers);
        if (tiers.length === 0) return null;
        return (
          <div className="px-5 mt-5">
            <div className="rounded-[16px] p-4" style={{ background: "var(--dark)" }}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--emerald)" }}>Gang group discount</p>
              <p className="text-[15px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Order together, save more</p>
              <div className="flex gap-2 mt-3">
                {tiers.map((t) => (
                  <div key={t.min} className="flex-1 rounded-[10px] py-2 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <p className="text-[16px] font-extrabold text-white tabular-nums">{t.min}+</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--subdued)" }}>people</p>
                    <p className="text-[12px] font-extrabold mt-1" style={{ color: "var(--emerald)" }}>{t.discount}% off</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-3" style={{ color: "var(--subdued)" }}>Start a gang group order. Everyone pays full price upfront. After the deadline, your discount is credited back to your wallet.</p>
            </div>
          </div>
        );
      })()}

      {/* ═══ CHOP TOGETHER — real pool data, hidden when expired ═══ */}
      {featured && (hasLivePool || featuredSav > 0) && (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Chop together first</h3>
            {hasLivePool && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
                {livePools.length} live pool{livePools.length !== 1 ? "s" : ""}
              </span>
            )}
            {!hasLivePool && featuredSav > 0 && (
              <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>Save up to {featuredSav}%</span>
            )}
          </div>

          <Link href={`/product/${featured.id}`} className="block rounded-[16px] overflow-hidden press-feedback card-enter card-enter-1" style={{ background: "var(--dark)" }}>
            {featured.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.imageUrl} alt={featured.name} className="w-full h-[200px] object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-[17px] font-extrabold text-white truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{featured.name}</h4>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--subdued)" }}>{store.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[24px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--gold)" }}>{fp(featured.groupPrice)}</span>
                  <p className="text-[12px] line-through" style={{ color: "var(--subdued)" }}>{fp(featured.retailPrice)}</p>
                </div>
              </div>

              {/* Live pool progress — real data */}
              {hasLivePool && featuredPool && (
                <>
                  <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold text-white">
                    <span>{featuredPool.memberCount}/{featuredPool.minSize} joined</span>
                    <span style={{ color: "var(--emerald)" }}>{featuredMinutesLeft > 60 ? `${Math.floor(featuredMinutesLeft / 60)}h ${featuredMinutesLeft % 60}m left` : `${featuredMinutesLeft}m left`}</span>
                  </div>
                  <div className="mt-1.5 h-[6px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
                    <div className="h-full" style={{ width: `${Math.round((featuredPool.memberCount / featuredPool.minSize) * 100)}%`, background: "var(--emerald)", borderRadius: "9px", transition: "width 300ms ease-out" }} />
                  </div>
                </>
              )}

              {/* No active pool — show savings hook instead */}
              {!hasLivePool && (
                <div className="mt-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <span className="text-[12px] font-bold" style={{ color: "var(--emerald)" }}>Save {featuredSav}% when {featured.minPoolSize} people join. Start a pool.</span>
                </div>
              )}

              {/* CTA */}
              <div className="mt-4 w-full h-[50px] rounded-full flex items-center justify-between px-5 text-[15px] font-bold text-white" style={{ background: "var(--coral)" }}>
                <span>{hasLivePool ? `Join Pool \u2014 ${fp(featured.groupPrice)}` : `Start Pool \u2014 ${fp(featured.groupPrice)}`}</span>
                <span className="text-[12px] font-bold opacity-80">Save {featuredSav}%</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ═══ THE FULL MENU ═══ */}
      <section className="px-5 mt-8">
        <h2 className="text-[24px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>The full menu</h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Tap any item to see pool pricing. Solo orders use the full price.</p>

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

              {/* Pool-eligible items */}
              {poolItems.length > 0 && (
                <div className="rounded-[16px] overflow-hidden mb-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {poolItems.map((item, i) => {
                    const hasPool = item.groupPrice < item.retailPrice;
                    const sav = hasPool ? Math.round(((item.retailPrice - item.groupPrice) / item.retailPrice) * 100) : 0;
                    const inCart = cart.items.find((c) => c.dailyMenuId === item.id)?.quantity || 0;
                    return (
                      <div key={item.id}>
                        {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Link href={`/product/${item.id}`} className="shrink-0">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.name} className="w-[56px] h-[56px] rounded-[12px] object-cover" loading="lazy" />
                            ) : (
                              <div className="w-[56px] h-[56px] rounded-[12px] flex items-center justify-center" style={{ background: "var(--sand)" }}>
                                <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                              </div>
                            )}
                          </Link>
                          <Link href={`/product/${item.id}`} className="flex-1 min-w-0 press-feedback">
                            {/* 2-line wrap instead of truncate */}
                            <h4 className="text-[14px] font-bold leading-[135%]" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</h4>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              {hasPool ? (
                                <>
                                  <span className="text-[14px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{fp(item.groupPrice)}</span>
                                  <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(item.retailPrice)}</span>
                                  <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>-{sav}%</span>
                                </>
                              ) : (
                                <span className="text-[14px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(item.retailPrice)}</span>
                              )}
                            </div>
                          </Link>
                          {/* Add to cart / stepper */}
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

      <BottomNav />
    </main>
  );
}
