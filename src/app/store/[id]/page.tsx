"use client";

import { useState, useEffect, useCallback } from "react";
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
  categories: string[]; products: Product[];
  combos: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: number; originalPrice: number | null }>;
  menuCategories: Array<{ id: string; name: string; items: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: number }> }>;
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

function poolFill(id: string, idx: number, minSize: number) {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1) + idx * 7;
  const fillPct = 0.6 + ((seed % 4) * 0.1);
  const joined = Math.max(2, Math.min(minSize - 1, Math.round(minSize * fillPct)));
  const hours = [1, 2, 3, 4, 6][seed % 5];
  return { joined, spotsLeft: minSize - joined, hours, fillPct: Math.round((joined / minSize) * 100) };
}

const AVATAR_COLORS = ["#17271F", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [addedToast, setAddedToast] = useState("");
  const [begLoading, setBegLoading] = useState(false);
  const cart = useCart();

  const startBegPrice = useCallback(async () => {
    if (!cart.items.length) return;
    setBegLoading(true);
    const showErr = (msg: string) => { setAddedToast(msg); setTimeout(() => setAddedToast(""), 3000); };
    try {
      const firstItem = cart.items[0];
      const productId = firstItem.dailyMenuId;

      // Try to find an existing pool or create one
      const poolsRes = await fetch(`/api/pools?productId=${productId}`);
      const poolsData = await poolsRes.json();
      let begCode: string | null = null;
      let lastError = "";

      if (poolsData.success && poolsData.data.length > 0) {
        const res = await fetch(`/api/pools/${poolsData.data[0].id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: 1 }),
        });
        const data = await res.json();
        if (data.success) begCode = data.data.begCode;
        else lastError = data.error || "Couldn't join pool";
      } else {
        const res = await fetch("/api/pools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        const data = await res.json();
        if (data.success) begCode = data.data.begCode;
        else lastError = data.error || "Couldn't create pool";
      }

      if (begCode) {
        router.push(`/beg/${begCode}`);
      } else {
        showErr(lastError.includes("Not authenticated") ? "Log in to start beg price" : lastError || "Beg price not available for this item");
      }
    } catch {
      showErr("Network error — try again");
    }
    setBegLoading(false);
  }, [cart.items, router]);

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

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="h-[200px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="px-5 pt-4 space-y-3">
          <div className="h-6 rounded w-[50%]" style={{ background: "var(--sand)" }} />
          <div className="h-4 rounded w-[70%]" style={{ background: "var(--sand)" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "#17271F" }}>Couldn&apos;t load store</h2>
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

  // Featured pool product (first product with savings)
  const featured = allItems.find((p) => p.groupPrice < p.retailPrice && p.imageUrl);
  const featuredFill = featured ? poolFill(featured.id, 0, featured.minPoolSize) : null;
  const featuredSav = featured ? Math.round(((featured.retailPrice - featured.groupPrice) / featured.retailPrice) * 100) : 0;

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
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Campus Kitchens</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>A kitchen your people trust</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Vendor profile ── */}
      <div className="px-5 mt-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-extrabold shrink-0" style={{ background: "var(--sand)", color: "var(--text-muted)" }}>
          {store.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{store.name}</h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{store.address}</p>
        </div>
      </div>

      {/* ── Rating + pools badges ── */}
      <div className="px-5 mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "var(--sand)", color: "#17271F" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--coral)" stroke="none" className="inline-block -mt-px mr-1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          4.9 · 128 reviews
        </span>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "var(--sand)", color: "#17271F" }}>
          {store.products.length} pools completed
        </span>
      </div>

      {/* ── Quote ── */}
      <div className="px-5 mt-4">
        <p className="text-[13px] leading-[155%]" style={{ color: "var(--text-muted)" }}>
          &ldquo;Fresh ewedu, proper portions, no long story.&rdquo; A campus favourite for the kind of lunch that feels like home.
        </p>
      </div>

      {/* ═══ CHOP TOGETHER FIRST — active pool ═══ */}
      {featured && featuredFill && (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Chop together first</h3>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--lime)", color: "#17271F" }}>1 live pool</span>
          </div>

          <Link href={`/product/${featured.id}`} className="block rounded-[22px] overflow-hidden press-feedback" style={{ background: "#17271F" }}>
            {/* Image — no badges on it */}
            {featured.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.imageUrl} alt={featured.name} className="w-full h-[200px] object-cover" />
            )}
            {/* Info on dark */}
            <div className="p-4">
              {/* Badges above title */}
              <p className="text-[10px] font-extrabold uppercase tracking-wide mb-2" style={{ color: "var(--lime)" }}>
                Only {featuredFill.spotsLeft} spots · Save {featuredSav}%
              </p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-[17px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{featured.name}</h4>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--subdued)" }}>{store.name} · <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--subdued)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.9</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[24px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--lime)" }}>{fp(featured.groupPrice)}</span>
                  <p className="text-[12px]" style={{ color: "var(--subdued)" }}>{fp(featured.retailPrice)}</p>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold text-white">
                <span>{featuredFill.joined}/{featured.minPoolSize} plates claimed</span>
                <span style={{ color: "var(--lime)" }}>{featuredFill.hours * 60}m left</span>
              </div>
              <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
                <div className="h-full" style={{ width: `${featuredFill.fillPct}%`, background: "var(--lime)", borderRadius: "9px" }} />
              </div>
              {/* Pickup */}
              <div className="flex items-center gap-1.5 mt-2.5 text-[11px]" style={{ color: "var(--subdued)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Jaja Hostel Reception · Free pickup
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(featuredFill.joined, 3) }).map((_, j) => (
                    <div key={j} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2px solid #17271F" }}>
                      {String.fromCharCode(65 + j)}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-semibold" style={{ color: "var(--subdued)" }}>{featuredFill.joined} people are in</span>
              </div>
              {/* Jump In CTA */}
              <div className="mt-4">
                <div className="w-full h-[50px] rounded-full flex items-center justify-between px-5 text-[15px] font-bold text-white" style={{ background: "var(--coral)" }}>
                  <span>Jump In — {fp(featured.groupPrice)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ═══ THE FULL MENU ═══ */}
      <section className="px-5 mt-8">
        <h2 className="text-[24px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>The full menu</h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Want a better price? Request a pool. Ordering one plate is always the full individual price.</p>

        {/* Category pills */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mt-4">
          {menuTabs.filter((v, i, a) => a.indexOf(v) === i).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="h-[25px] px-3 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer shrink-0"
              style={{ background: currentTab === tab ? "#17271F" : "var(--sand)", color: currentTab === tab ? "white" : "var(--text-secondary)" }}
            >{tab}</button>
          ))}
        </div>

        {/* Menu items by category */}
        {Array.from(grouped.entries()).map(([cat, items]) => {
          const poolItems = items.filter((i) => i.groupPrice < i.retailPrice || i.poolable);
          const menuItems = items.filter((i) => !(i.groupPrice < i.retailPrice) && !i.poolable);

          return (
            <div key={cat} className="mt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--coral)" }}>{cat} · {items.length} meal{items.length !== 1 ? "s" : ""}</p>

              {/* Pool-eligible items — clean list with pool indicator */}
              {poolItems.length > 0 && (
                <div className="rounded-[22px] overflow-hidden mb-3" style={{ background: "var(--card)" }}>
                  {poolItems.map((item, i) => {
                    const hasPool = item.groupPrice < item.retailPrice;
                    const sav = hasPool ? Math.round(((item.retailPrice - item.groupPrice) / item.retailPrice) * 100) : 0;
                    return (
                      <Link key={item.id} href={`/product/${item.id}`} className="block press-feedback">
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
                            <h4 className="text-[14px] font-bold leading-[135%] truncate" style={{ color: "#17271F" }}>{item.name}</h4>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-[14px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--coral)" }}>{fp(item.groupPrice)}</span>
                              {hasPool && <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(item.retailPrice)}</span>}
                            </div>
                          </div>
                          {hasPool ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--lime)", color: "#17271F" }}>-{sav}%</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>Pool</span>
                          )}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Regular menu items — clean list rows, no card per item */}
              {menuItems.length > 0 && (
                <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
                  {menuItems.map((item, i) => {
                    const inCart = cart.items.filter((c) => c.dailyMenuId === item.id).length;
                    return (
                      <div key={item.id}>
                        {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Food image */}
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="w-[56px] h-[56px] rounded-[12px] object-cover shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                              <span className="text-[16px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                            </div>
                          )}
                          {/* Name + description + price */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold leading-[135%] truncate" style={{ color: "#17271F" }}>{item.name}</h4>
                            {item.description && <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                            <p className="text-[14px] font-extrabold tabular-nums mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(item.retailPrice)}</p>
                          </div>
                          {/* + / stepper */}
                          {inCart > 0 ? (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button type="button" onClick={() => cart.removeItem(item.id)}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer press-feedback"
                                style={{ background: "var(--sand)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#17271F" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                              </button>
                              <span className="w-[28px] text-center text-[14px] font-extrabold tabular-nums" style={{ color: "#17271F" }}>{inCart}</span>
                              <button type="button" onClick={() => addToPlate(item, store.name)}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer press-feedback"
                                style={{ background: "var(--coral)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => addToPlate(item, store.name)}
                              className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer press-feedback shrink-0"
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
          Campus pickup only · Pickup instructions are on every order. Wait for the vendor&apos;s ready alert before you set off.
        </p>
      </div>

      {/* ── Sticky cart bar — pay or beg ── */}
      {cart.totalItems > 0 && (() => {
        const total = cart.items.reduce((sum, i) => sum + i.price, 0);
        const begFloor = Math.round(total * 0.4);
        return (
          <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
            <div className="max-w-[480px] mx-auto">
              <Link href="/cart" className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
                <span>Pay Now — {fp(total)}</span>
                <span className="text-[12px]">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
              </Link>
              <button type="button" onClick={startBegPrice} disabled={begLoading}
                className="w-full h-[44px] rounded-full flex items-center justify-center gap-2 mt-2 text-[13px] font-bold cursor-pointer press-feedback disabled:opacity-50" style={{ background: "#17271F", color: "white" }}>
                <span>{begLoading ? "Starting..." : `Beg Price — pay as low as ${fp(begFloor)}`}</span>
                {!begLoading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>}
              </button>
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
