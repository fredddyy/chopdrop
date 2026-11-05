"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";
import { calculateDeliveryFee } from "@/lib/delivery-fee";

interface ProductData {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number;
  minPoolSize: number; poolTiers: unknown; maxQuantity: number; tags: string | null;
  vendor: { id: string; name: string; imageUrl: string | null; address: string; latitude: number | null; longitude: number | null };
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

// Avatar colors for pool member initials
const AVATAR_COLORS = ["#17271F", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];

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
  const [sharePrompt, setSharePrompt] = useState<{ url: string; name: string } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const cart = useCart();

  // Read user coordinates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.latitude && p.longitude) setUserCoords({ lat: p.latitude, lng: p.longitude, address: p.deliveryAddress });
      }
    } catch {}
  }, []);

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
        body: JSON.stringify({
          quantity,
          ...(userCoords ? { lat: userCoords.lat, lng: userCoords.lng, deliveryAddress: userCoords.address } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Immediately initiate payment
        const checkoutRes = await fetch(`/api/pools/${poolId}/checkout`, { method: "POST" });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.success && checkoutData.data.authorizationUrl) {
          // Redirect to Paystack checkout
          window.location.href = checkoutData.data.authorizationUrl;
          return;
        }
        // Fallback: show joined toast if checkout fails
        showToast("joined");
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
        body: JSON.stringify({
          productId: product.id,
          quantity,
          ...(userCoords ? { areaName: undefined } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Initiate payment for pool creator
        const checkoutRes = await fetch(`/api/pools/${data.data.poolId}/checkout`, { method: "POST" });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.success && checkoutData.data.authorizationUrl) {
          // Save share URL for after payment callback
          sessionStorage.setItem("chopdrop-pool-share", JSON.stringify({
            url: `${typeof window !== "undefined" ? window.location.origin : ""}/product/${product.id}?pool=${data.data.poolId}`,
            name: product.name,
          }));
          window.location.href = checkoutData.data.authorizationUrl;
          return;
        }
        // Fallback: show share prompt if checkout fails
        const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/product/${product.id}?pool=${data.data.poolId}`;
        setSharePrompt({ url: shareUrl, name: product.name });
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

  async function joinForBeg() {
    if (!product) return;
    const poolId = pool?.id;
    setJoining(true);
    try {
      let begCode: string | null = null;
      if (poolId) {
        // Join existing pool, skip checkout
        const res = await fetch(`/api/pools/${poolId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity, ...(userCoords ? { lat: userCoords.lat, lng: userCoords.lng, deliveryAddress: userCoords.address } : {}) }),
        });
        const data = await res.json();
        if (data.success) { begCode = data.data.begCode; }
        else { showToast(data.error || "Couldn't join"); setJoining(false); return; }
      } else {
        // Create pool, skip checkout
        const res = await fetch("/api/pools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity }),
        });
        const data = await res.json();
        if (data.success) { begCode = data.data.begCode; }
        else { showToast(data.error === "Not authenticated" ? "Log in first" : (data.error || "Couldn't create")); setJoining(false); return; }
      }
      if (begCode) {
        router.push(`/beg/${begCode}`);
      } else {
        showToast("joined");
      }
    } catch { showToast("Network error"); }
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

  const pool = pools.length > 0 ? pools[0] : null;
  // Show pool variant when product has group pricing, even without a real Pool record
  const hasPoolPricing = savings > 0;
  const fillPct = pool ? Math.round((pool.memberCount / pool.minSize) * 100) : (hasPoolPricing ? Math.round(0.7 * 100) : 0);
  const minutesLeft = pool ? Math.max(0, Math.round((new Date(pool.deadline).getTime() - Date.now()) / 60000)) : 180;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>{hasPoolPricing ? "Pool" : product.vendor.name}</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {hasPoolPricing ? (pool && pool.spotsLeft <= 3 ? `${pool.spotsLeft} spot${pool.spotsLeft !== 1 ? "s" : ""}. One good lunch.` : "Join the pool. Save together.") : product.name}
          </p>
        </div>
        <button type="button" onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
        </button>
      </div>

      {/* ── Hero food image ── */}
      <div className="px-5 mt-4">
        <div className="relative rounded-[28px] overflow-hidden" style={{ background: "var(--sand)" }}>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full h-[236px] object-cover" />
          ) : (
            <div className="w-full h-[236px]" />
          )}
          {hasPoolPricing && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-white rounded-full" style={{ background: "var(--emerald)", padding: "6px 12px" }}>
                {savings}% less together
              </span>
            </div>
          )}
        </div>
        {/* Badges below image */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: hasPoolPricing ? "var(--lime)" : "var(--sand)", color: "#17271F" }}>
            {hasPoolPricing ? "Pool deal" : "No active pool"}
          </span>
          <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: "#17271F" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#17271F" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            4.9 (128)
          </span>
        </div>
      </div>

      {/* ── Title + Vendor ── */}
      <div className="px-5 mt-5">
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#17271F" }}>{product.name}</h1>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[14px] font-semibold" style={{ color: "var(--text-muted)", lineHeight: "145%" }}>{product.vendor.name}</p>
          <span className="text-[14px] font-bold flex items-center gap-1" style={{ color: "#17271F" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#17271F" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            4.9 (128)
          </span>
        </div>
      </div>

      {/* ── Price ── */}
      <div className="px-5 mt-4 flex items-end gap-3">
        <span className="text-[52px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "var(--coral)" }}>{fp(hasPoolPricing ? product.groupPrice : product.retailPrice)}</span>
        <div className="pb-1.5">
          {hasPoolPricing ? (
            <>
              <span className="text-[14px] line-through tabular-nums block" style={{ color: "var(--text-muted)" }}>{fp(product.retailPrice)} solo</span>
              {savedAmount > 0 && <span className="text-[14px] font-bold block" style={{ color: "var(--text-muted)" }}>Keep {fp(savedAmount)} for yourself.</span>}
            </>
          ) : (
            <>
              <span className="text-[14px] block" style={{ color: "var(--text-muted)" }}>Individual price</span>
              <span className="text-[14px] block" style={{ color: "var(--text-muted)" }}>No pool discount</span>
            </>
          )}
        </div>
      </div>

      {/* ── Pool progress / Demand signal ── */}
      <div className="px-5 mt-5">
        {!hasPoolPricing && (
          <div className="rounded-[22px] overflow-hidden p-5 mb-4" style={{ background: "#17271F" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--lime)" }}>Let&apos;s make it cheaper together</p>
            <p className="text-[24px] font-extrabold text-white mt-2 leading-[120%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>12 people want this pool.</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[12px] font-extrabold text-white">12/20 interested students</span>
              <span className="text-[12px] font-bold" style={{ color: "var(--lime)" }}>8 more</span>
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--subdued)" }}>
              Add your request. At 20, we&apos;ll notify {product.vendor.name}. You&apos;ll hear if she opens a pool.
            </p>
          </div>
        )}
        {!hasPoolPricing && (
          <div className="flex items-start gap-2.5 p-4 rounded-[16px] mb-4" style={{ background: "var(--emerald-soft)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <p className="text-[12px] leading-[155%]" style={{ color: "var(--emerald)" }}>
              Requesting shows demand. It doesn&apos;t place an order, charge you or guarantee a pool.
            </p>
          </div>
        )}
        <div className="rounded-[22px] overflow-hidden" style={{ background: "#17271F" }}>
          <div className="p-4">
            {/* Progress text */}
            <div className="flex items-center justify-between text-[12px] font-extrabold">
              <span className="text-white">{pool ? `${pool.memberCount}/${pool.minSize}` : `${Math.round(product.minPoolSize * 0.7)}/${product.minPoolSize}`} plates claimed</span>
              <span style={{ color: "var(--lime)" }}>{minutesLeft > 0 ? `${Math.floor(minutesLeft / 60)}h ${String(minutesLeft % 60).padStart(2, "0")}m left` : "Starting"}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-[7px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: `${fillPct}%`, background: "var(--lime)", borderRadius: "9px" }} />
            </div>
            {/* Avatar social proof + join feed */}
            {pool && pool.memberCount >= 1 && (
              <div className="mt-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(pool.memberCount, 3) }).map((_, j) => (
                      <div key={j} className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2.5px solid #17271F" }}>
                        {j === 0 ? pool.creatorName.charAt(0) : String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--subdued)" }}>{pool.memberCount} {pool.memberCount === 1 ? "person is" : "people are"} in</span>
                </div>
                {/* Live join feed */}
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--lime)", color: "#17271F" }}>
                    {pool.creatorName.charAt(0)}
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--subdued)" }}>{pool.creatorName} {pool.memberCount > 1 ? `+${pool.memberCount - 1} friend${pool.memberCount > 2 ? "s" : ""} joined` : "joined"} 1 min ago</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pickup location ── */}
      <div className="px-5 mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold" style={{ color: "#17271F" }}>{userCoords?.address?.split(",")[0] || "Pickup location"}</p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)", lineHeight: "145%" }}>Pickup, not delivery</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
      </div>

      {/* ── Trust assurance (pool only) ── */}
      {hasPoolPricing && (
        <div className="px-5 mt-4">
          <div className="flex items-start gap-3 p-4 rounded-[16px]" style={{ background: "var(--emerald-soft)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <p className="text-[12px] leading-[160%]" style={{ color: "var(--emerald)" }}>
              Payment stays held until the pool fills. If it expires unfilled, you&apos;re automatically refunded. Ready comes after cooking.
            </p>
          </div>
        </div>
      )}

      {/* ── Solo: quantity + explanation (no pool) ── */}
      {!hasPoolPricing && (
        <>
          <div className="px-5 mt-5 flex items-center justify-between">
            <span className="text-[15px] font-bold" style={{ color: "#17271F" }}>Solo quantity</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
              </button>
              <span className="text-[16px] font-extrabold tabular-nums w-6 text-center" style={{ color: "#17271F" }}>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </div>
          <div className="px-5 mt-5">
            <h3 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Need your own plate?</h3>
            <p className="text-[13px] mt-2 leading-[155%]" style={{ color: "var(--text-muted)" }}>
              Solo checkout confirms your order after payment — no waiting for a pool to fill. {product.vendor.name} still needs time to prepare it.
            </p>
            <p className="text-[13px] mt-2 font-bold" style={{ color: "#17271F" }}>
              We&apos;ll notify you when she marks it ready.
            </p>
          </div>
        </>
      )}

      {/* ── Description ── */}
      {product.description && (
        <div className="px-5 mt-5">
          <p className="text-[14px] leading-[145%]" style={{ color: "var(--text-muted)" }}>{product.description}</p>
        </div>
      )}

      <div className="h-8" />

      {/* ═══ STICKY CTA ═══ */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto">
          {hasPoolPricing ? (
            <>
              <button type="button" onClick={() => pool ? joinPool(pool.id) : createPool()} disabled={joining}
                className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
                style={{ background: "var(--coral)" }}>
                <span>Jump In — {fp(product.groupPrice * quantity)}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </button>
              <button type="button" onClick={joinForBeg} disabled={joining}
                className="text-[12px] text-center mt-2.5 w-full cursor-pointer disabled:opacity-50"
                style={{ color: "var(--text-muted)" }}>
                or <span className="font-bold" style={{ color: "var(--coral)" }}>beg price</span> → pay as low as {fp(Math.round(product.groupPrice * 0.4))}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => router.push(`/request-sent/${id}`)} disabled={joining}
                className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
                style={{ background: "var(--coral)" }}>
                <span>Request Pool</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round"><path d="M5 11.667c0 2.163.702 4.269 2 6 .265.353.66.587 1.098.65.437.062.882-.052 1.235-.317.354-.265.588-.66.65-1.098.063-.437-.051-.882-.316-1.235A6.644 6.644 0 018.333 11.667M5 11.667h1.667m1.666 0h.834c2.534-.066 5.012.76 7 2.333.124.093.271.15.425.163.154.014.31-.015.448-.084.138-.07.255-.176.336-.308.081-.131.125-.283.125-.438V3.333c0-.155-.044-.306-.125-.438a.832.832 0 00-.336-.308.834.834 0 00-.448-.084.834.834 0 00-.425.164c-1.989 1.573-4.466 2.398-7 2.333H6.667 4.167c-.442 0-.866.176-1.179.488A1.667 1.667 0 002.5 6.667V10c0 .442.176.866.488 1.179.313.312.737.488 1.179.488H5m3.333 0H6.667m0-6.667v6.667" /></svg>
              </button>
              <p className="text-[12px] text-center mt-2.5" style={{ color: "var(--text-muted)" }}>
                Order solo — {fp(product.retailPrice * quantity)} →
              </p>
            </>
          )}
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
            <Link href="/pools" className="max-w-[480px] mx-auto flex items-center justify-between rounded-[8px] px-4 py-3.5" style={{ background: "var(--emerald)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                </div>
                <div>
                  <span className="text-[14px] font-bold text-white block">You&apos;re in!</span>
                  <span className="text-[11px] text-white/70">Tap to track your pool</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
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

      {/* ── Share sheet — appears after creating a pool ── */}
      {sharePrompt && product && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => setSharePrompt(null)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="relative w-full max-w-[480px] rounded-t-[16px] p-5 sheet-enter" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
            <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>Group started!</h3>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Share the link with friends. When {product.minPoolSize} people join, everyone pays {fp(product.groupPrice)} for {sharePrompt.name}.
            </p>

            <div className="flex flex-col gap-2.5 mt-4">
              {/* WhatsApp share — primary */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Join my ChopDrop group deal! ${sharePrompt.name} for ${fp(product.groupPrice)} (save ${fp(product.retailPrice - product.groupPrice)}). ${sharePrompt.url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[50px] rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold text-white press-feedback"
                style={{ background: "#25D366" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share on WhatsApp
              </a>

              {/* Copy link */}
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(sharePrompt.url); showToast("link"); setSharePrompt(null); }}
                className="h-[44px] rounded-[8px] flex items-center justify-center gap-2 text-[13px] font-bold cursor-pointer press-feedback"
                style={{ background: "var(--sand)", color: "var(--text)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                Copy link
              </button>

              {/* Skip */}
              <button type="button" onClick={() => setSharePrompt(null)} className="text-[13px] font-bold cursor-pointer py-2" style={{ color: "var(--text-muted)" }}>
                Share later
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
