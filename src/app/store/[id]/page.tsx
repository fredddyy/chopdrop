"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface Product {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number; minPoolSize: number;
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
  const [activeTab, setActiveTab] = useState("All meals");

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

  // Featured pool product (first product with savings)
  const featured = store.products.find((p) => p.groupPrice < p.retailPrice && p.imageUrl);
  const featuredFill = featured ? poolFill(featured.id, 0, featured.minPoolSize) : null;
  const featuredSav = featured ? Math.round(((featured.retailPrice - featured.groupPrice) / featured.retailPrice) * 100) : 0;

  // All menu items (products shown as individual meals)
  const allItems = store.products;
  const menuTabs = ["All meals", ...new Set(allItems.map((p) => p.subcategory || p.category))];
  const filteredItems = activeTab === "All meals" ? allItems : allItems.filter((p) => (p.subcategory || p.category) === activeTab);

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

          <Link href={`/product/${featured.id}`} className="block rounded-[22px] overflow-hidden press-feedback" style={{ background: "var(--card)" }}>
            {/* Badges + image */}
            <div className="relative">
              {featured.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.imageUrl} alt={featured.name} className="w-full h-[200px] object-cover" />
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "var(--lime)", color: "#17271F", padding: "6px 10px" }}>
                  Only {featuredFill.spotsLeft} spots
                </span>
                <span className="text-[10px] font-extrabold rounded-full uppercase tracking-wide" style={{ background: "#FFE9DD", color: "#17271F", padding: "6px 10px" }}>
                  Save {featuredSav}%
                </span>
              </div>
            </div>
            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{featured.name}</h4>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{store.name} · <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.9</p>
                </div>
                <span className="text-[24px] font-extrabold tabular-nums shrink-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--coral)" }}>{fp(featured.groupPrice)}</span>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{fp(featured.retailPrice)} individual</p>
              {/* Progress */}
              <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold" style={{ color: "#17271F" }}>
                <span>{featuredFill.joined}/{featured.minPoolSize} plates claimed</span>
                <span style={{ color: "var(--coral)" }}>{featuredFill.hours * 60}m left</span>
              </div>
              <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
                <div className="h-full" style={{ width: `${featuredFill.fillPct}%`, background: "var(--coral)", borderRadius: "9px" }} />
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(featuredFill.joined, 3) }).map((_, j) => (
                    <div key={j} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2px solid var(--card)" }}>
                      {String.fromCharCode(65 + j)}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{featuredFill.joined} people are in</span>
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
              className="h-[34px] px-4 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer shrink-0"
              style={{ background: activeTab === tab ? "#17271F" : "var(--sand)", color: activeTab === tab ? "white" : "var(--text-secondary)" }}
            >{tab}</button>
          ))}
        </div>

        {/* Menu items by category */}
        {Array.from(grouped.entries()).map(([cat, items]) => (
          <div key={cat} className="mt-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--coral)" }}>{cat} · {items.length} meal{items.length !== 1 ? "s" : ""}</p>
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-[82px] h-[86px] rounded-[16px] object-cover shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-[82px] h-[86px] rounded-[16px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                      <span className="text-[20px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[17px] font-extrabold leading-[145%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{item.name}</h4>
                    {item.description && <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                    <p className="text-[15px] font-extrabold tabular-nums mt-1" style={{ color: "#17271F" }}>{fp(item.retailPrice)} individual</p>
                    {/* Request Pool CTA */}
                    <Link href={`/product/${item.id}`} className="mt-2 h-[42px] rounded-full flex items-center justify-between px-4 text-[13px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
                      <span>Request Pool</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    </Link>
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>Order {fp(item.retailPrice)} · one plate, no pool</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Trust copy ── */}
      <div className="px-5 mt-8 mb-4">
        <p className="text-[11px] leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Campus pickup only · Pickup instructions are on every order. Wait for the vendor&apos;s ready alert before you set off.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
