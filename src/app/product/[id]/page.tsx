"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface ProductData {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number;
  minPoolSize: number; poolTiers: unknown; maxQuantity: number; tags: string | null;
  vendor: { id: string; name: string; imageUrl: string | null; address: string };
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

// Avatar colors for pool member initials
const AVATAR_COLORS = ["#E8604C", "#0D9F5F", "#2563EB", "#D4A24E", "#0891B2"];

interface PoolData {
  id: string;
  name: string | null;
  memberCount: number;
  spotsLeft: number;
  deadline: string;
  creatorName: string;
  groupPrice: number;
  minSize: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [joining, setJoining] = useState(false);
  const cart = useCart();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);

    // Fetch product + active pools in parallel
    Promise.allSettled([
      fetch(`/api/products/${id}`, { signal: ctrl.signal }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch(`/api/pools?productId=${id}`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null),
    ]).then(([productResult, poolsResult]) => {
      if (productResult.status === "fulfilled" && productResult.value.success) {
        setProduct(productResult.value.data);
      } else if (productResult.status === "rejected" && (productResult.reason as Error).name !== "AbortError") {
        setError(true);
      }
      if (poolsResult.status === "fulfilled" && poolsResult.value?.success) {
        setPools(poolsResult.value.data);
      }
      if (!ctrl.signal.aborted) setLoading(false);
    });

    return () => ctrl.abort();
  }, [id, retryKey]);

  function addSolo() {
    if (!product) return;
    cart.addItem({ dailyMenuId: `instant-${product.id}`, name: product.name, description: product.description || "", imageUrl: product.imageUrl, restaurantName: product.vendor.name, price: product.retailPrice });
    showToast("added");
  }

  async function joinPool(poolId: string) {
    if (!product) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("joined");
        // Refresh pools
        const poolsRes = await fetch(`/api/pools?productId=${id}`);
        const poolsData = await poolsRes.json();
        if (poolsData.success) setPools(poolsData.data);
      } else {
        showToast(data.error || "Couldn't join");
      }
    } catch {
      showToast("Network error");
    }
    setJoining(false);
  }

  async function createPool() {
    if (!product) return;
    setJoining(true);
    try {
      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("created");
        // Refresh pools
        const poolsRes = await fetch(`/api/pools?productId=${id}`);
        const poolsData = await poolsRes.json();
        if (poolsData.success) setPools(poolsData.data);
      } else {
        showToast(data.error === "Not authenticated" ? "Log in to start a group" : (data.error || "Couldn't create"));
      }
    } catch {
      showToast("Network error");
    }
    setJoining(false);
  }

  function showToast(type: string) {
    setToast(type);
    setTimeout(() => setToast(""), 3000);
  }

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = product ? `${product.name} for ${fp(product.groupPrice)} on ChopDrop` : "ChopDrop";
    if (navigator.share) { navigator.share({ title: product?.name || "ChopDrop", text, url }); }
    else { navigator.clipboard.writeText(url).then(() => showToast("link")); }
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="h-[56vh]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="px-5 pt-5 space-y-3">
          <div className="h-7 rounded w-[65%]" style={{ background: "var(--sand)" }} />
          <div className="h-10 rounded w-[45%]" style={{ background: "var(--sand)" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load product</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => setRetryKey(k => k + 1)} className="h-11 px-6 rounded-[8px] text-[13px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>Try again</button>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 flex flex-col items-center justify-center min-h-svh px-5" style={{ background: "var(--bg)" }}>
        <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Product not found</h1>
        <Link href="/discover" className="text-[14px] font-bold mt-3" style={{ color: "var(--coral)" }}>Browse stores</Link>
        <BottomNav />
      </main>
    );
  }

  const savings = product.retailPrice > product.groupPrice ? Math.round(((product.retailPrice - product.groupPrice) / product.retailPrice) * 100) : 0;
  const savedAmount = product.retailPrice - product.groupPrice;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-32" style={{ background: "var(--bg)" }}>

      {/* ═══ HERO — immersive, edge-to-edge ═══ */}
      <div className="relative" style={{ height: "56vh", minHeight: 340, maxHeight: 420, background: "var(--sand)" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--sand)" }} />
        )}

        {/* Top bar — floats over image */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4">
          <button type="button" onClick={() => router.back()} className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "rgba(255,255,255,0.92)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" onClick={handleShare} className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "rgba(255,255,255,0.92)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
          </button>
        </div>

        {/* Bottom info strip — overlaid on image, no card overlap */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-16" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" /* taste-skill-ignore: neutral scrim over photo */ }}>
          <h1 className="text-[24px] font-extrabold text-white leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Link href={`/store/${product.vendor.id}`} className="text-[12px] font-medium text-white/70">{product.vendor.name}</Link>
            <span className="text-[12px] text-white/40">·</span>
            <span className="text-[12px] font-medium text-white/70">120+ orders</span>
          </div>
        </div>
      </div>

      {/* ═══ PRICE — the decision moment ═══ */}
      <div className="px-5 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[32px] font-extrabold tabular-nums leading-none" style={{ color: "var(--emerald)" }}>{fp(product.groupPrice)}</span>
              {savings > 0 && <span className="text-[14px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(product.retailPrice)}</span>}
            </div>
            {savings > 0 && (
              <p className="text-[12px] font-bold mt-1" style={{ color: "var(--emerald)" }}>
                You save {fp(savedAmount)} with {product.minPoolSize}+ people
              </p>
            )}
          </div>
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </button>
            <span className="text-[16px] font-extrabold tabular-nums w-6 text-center" style={{ color: "var(--text)" }}>{quantity}</span>
            <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ POOL SECTION — real data from API ═══ */}
      {savings > 0 && (
        <section className="mt-5 mx-5 rounded-[12px] overflow-hidden" style={{ background: "var(--dark)" }}>
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-extrabold text-white">
                {pools.length > 0 ? "Join a group" : "Start a group"}
              </h3>
              <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>
                Every kobo back if not filled
              </span>
            </div>
          </div>

          {/* Active pools from API */}
          {pools.length > 0 && (
            <div className="flex flex-col gap-0">
              {pools.map((pool, i) => {
                const fillPct = Math.round((pool.memberCount / pool.minSize) * 100);
                const isHot = pool.spotsLeft <= 2;
                const hoursLeft = Math.max(0, Math.round((new Date(pool.deadline).getTime() - Date.now()) / 3600000));
                return (
                  <button
                    key={pool.id}
                    type="button"
                    onClick={() => joinPool(pool.id)}
                    disabled={joining}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer press-feedback disabled:opacity-50"
                    style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
                  >
                    {/* Avatar stack */}
                    <div className="flex -space-x-2 shrink-0">
                      {Array.from({ length: Math.min(pool.memberCount, 3) }).map((_, j) => (
                        <div key={j} className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2.5px solid var(--dark)" }}>
                          {j === 0 ? pool.creatorName.charAt(0) : String.fromCharCode(65 + j)}
                        </div>
                      ))}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-white">
                        {pool.name || `${pool.creatorName}'s group`}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                          <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: isHot ? "var(--coral)" : "var(--emerald)" }} />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: isHot ? "var(--coral)" : "rgba(255,255,255,0.5)" }}>
                          {isHot ? `${pool.spotsLeft} left!` : `${pool.memberCount}/${pool.minSize}`}
                        </span>
                      </div>
                      {hoursLeft > 0 && (
                        <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{hoursLeft}h left</p>
                      )}
                    </div>
                    {/* CTA */}
                    <div className="shrink-0">
                      <div className="h-[34px] px-3.5 rounded-[6px] flex items-center justify-center text-[12px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                        Join · {fp(pool.groupPrice)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No active pools — explain the value */}
          {pools.length === 0 && (
            <div className="px-4 pb-2">
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Be the first to start a group. Share the link — when {product.minPoolSize} people join, everyone pays {fp(product.groupPrice)} instead of {fp(product.retailPrice)}.
              </p>
            </div>
          )}

          {/* Start new group */}
          <div className="px-4 pb-4 pt-1">
            <button type="button" onClick={createPool} disabled={joining}
              className="w-full flex items-center justify-center gap-1.5 h-11 rounded-[8px] cursor-pointer press-feedback disabled:opacity-50"
              style={{ background: pools.length === 0 ? "var(--emerald)" : "transparent", border: pools.length === 0 ? "none" : "1px dashed rgba(255,255,255,0.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pools.length === 0 ? "white" : "rgba(255,255,255,0.4)"} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span className="text-[12px] font-bold" style={{ color: pools.length === 0 ? "white" : "rgba(255,255,255,0.4)" }}>
                {pools.length === 0 ? "Start a group · " + fp(product.groupPrice) : "Start a new group"}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* ═══ DETAILS — clean, minimal ═══ */}
      {product.description && (
        <div className="px-5 mt-5">
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{product.description}</p>
        </div>
      )}

      {/* Merchant */}
      <Link href={`/store/${product.vendor.id}`} className="mx-5 mt-4 flex items-center gap-3 p-3 rounded-[8px] press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 text-[14px] font-bold text-white" style={{ background: "var(--coral)" }}>
          {product.vendor.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{product.vendor.name}</span>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{product.vendor.address}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
      </Link>

      <div className="h-4" />

      {/* ═══ STICKY CTA ═══ */}
      <div className="fixed bottom-[52px] left-0 right-0 z-40 px-5 py-3" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto flex gap-2.5">
          <button type="button" onClick={addSolo}
            className="flex-[35] h-[50px] rounded-[8px] flex items-center justify-center text-[13px] font-bold cursor-pointer press-feedback"
            style={{ background: "var(--sand)", color: "var(--text)" }}>
            Buy · {fp(product.retailPrice * quantity)}
          </button>
          <button type="button" onClick={() => pools.length > 0 ? joinPool(pools[0].id) : createPool()} disabled={joining}
            className="flex-[65] h-[50px] rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
            style={{ background: "var(--emerald)" }}>
            <span>{pools.length > 0 ? "Join group" : "Start group"}</span>
            <span className="tabular-nums">{fp(product.groupPrice * quantity)}</span>
          </button>
        </div>
      </div>

      {/* Toast — handles all states */}
      {toast && (
        <div className="fixed z-[100] left-0 right-0 bottom-[104px] px-5 celebrate">
          {toast === "link" ? (
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-[8px] px-4 py-3" style={{ background: "var(--dark)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[13px] font-bold text-white">Link copied!</span>
            </div>
          ) : toast === "joined" ? (
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-[8px] px-4 py-3" style={{ background: "var(--emerald)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[13px] font-bold text-white">Joined the group!</span>
            </div>
          ) : toast === "created" ? (
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-[8px] px-4 py-3" style={{ background: "var(--emerald)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[13px] font-bold text-white">Group started! Share the link</span>
            </div>
          ) : toast === "added" ? (
            <Link href="/cart" className="max-w-[480px] mx-auto flex items-center justify-between rounded-[8px] px-4 py-3" style={{ background: "var(--emerald)" }}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                <span className="text-[13px] font-bold text-white">Added! View cart</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          ) : (
            /* Error or custom message */
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-[8px] px-4 py-3" style={{ background: "var(--coral)" }}>
              <span className="text-[13px] font-bold text-white">{toast}</span>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
