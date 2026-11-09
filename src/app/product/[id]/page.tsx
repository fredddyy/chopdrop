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
  vendor: { id: string; name: string; imageUrl: string | null; address: string; latitude: number | null; longitude: number | null };
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

// Avatar colors for pool member initials
const AVATAR_COLORS = ["#1C1C1E", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];

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
  const [confirmSheet, setConfirmSheet] = useState<{ action: "join" | "create"; poolId?: string } | null>(null);
  const [sharePrompt, setSharePrompt] = useState<{ url: string; name: string } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery">("pickup");
  const [deliveryEstimate, setDeliveryEstimate] = useState<{ fullFee: number; subsidizedFee: number; distanceKm: number; walkMinutes: number } | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  // Joined pool state: null = not joined, or status string
  const [joinedStatus, setJoinedStatus] = useState<"filling" | "preparing" | "ready" | "collected" | "expired" | null>(null);
  const [joinedPrice, setJoinedPrice] = useState(0);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leavingPool, setLeavingPool] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const [userName, setUserName] = useState("");
  const [expiredPoolId, setExpiredPoolId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const cart = useCart();

  // Read user coordinates + joined pool status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.latitude && p.longitude) setUserCoords({ lat: p.latitude, lng: p.longitude, address: p.deliveryAddress });
        if (p.name) setUserName(p.name);
      }
      const joined = localStorage.getItem("chopdrop-joined-pools");
      if (joined) {
        const pools: Record<string, { status: string; price: number }> = JSON.parse(joined);
        if (pools[id]) {
          setJoinedStatus(pools[id].status as "filling" | "preparing" | "ready" | "collected");
          setJoinedPrice(pools[id].price);
        }
      }
      // Check if returning from Paystack with successful payment
      const params = new URLSearchParams(window.location.search);
      if (params.get("reference") || params.get("trxref")) {
        const pending = sessionStorage.getItem("chopdrop-pending-join");
        if (pending) {
          const { productId, price } = JSON.parse(pending);
          if (productId === id) {
            markJoined(id, price);
            setJustPaid(true);
            sessionStorage.removeItem("chopdrop-pending-join");
          }
        }
      }
    } catch {}
  }, [id]);

  // Fetch delivery estimate when delivery is selected
  useEffect(() => {
    if (deliveryOption !== "delivery" || !userCoords || !id) return;
    setEstimateLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/delivery-estimate?productId=${id}&lat=${userCoords.lat}&lng=${userCoords.lng}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (d.success) setDeliveryEstimate(d.data); })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setEstimateLoading(false); });
    return () => ctrl.abort();
  }, [deliveryOption, userCoords, id]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);

    // Fetch product + active pools + user's memberships in parallel
    Promise.allSettled([
      fetch(`/api/products/${id}`, { signal: ctrl.signal }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch(`/api/pools?productId=${id}`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null),
      fetch(`/api/pools?mine=true`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null),
    ]).then(([productResult, poolsResult, myPoolsResult]) => {
      if (productResult.status === "fulfilled" && productResult.value.success) {
        setProduct(productResult.value.data);
      } else if (productResult.status === "rejected" && (productResult.reason as Error).name !== "AbortError") {
        setError(true);
      }
      if (poolsResult.status === "fulfilled" && poolsResult.value?.success) {
        setPools(poolsResult.value.data);
      }
      // Check if user is already a member of a pool for this product (server truth)
      if (myPoolsResult.status === "fulfilled" && myPoolsResult.value?.success) {
        const myPool = myPoolsResult.value.data.find((p: { product: { id: string }; status: string; myPaymentStatus: string }) => p.product.id === id);
        if (myPool) {
          const price = myPool.product.groupPrice || 0;
          if (myPool.status === "EXPIRED" || myPool.status === "CANCELLED") {
            setJoinedStatus("expired");
            setJoinedPrice(price);
            setExpiredPoolId(myPool.id);
          } else {
            const status = myPool.status === "FILLED" ? "preparing" : "filling";
            setJoinedStatus(status);
            setJoinedPrice(price);
            markJoined(id, price, status as "filling" | "preparing");
          }
        }
      }
      if (!ctrl.signal.aborted) setLoading(false);
    });

    return () => ctrl.abort();
  }, [id, retryKey]);

  useEffect(() => {
    const activePool = pools.length > 0 ? pools[0] : null;
    if (!activePool) return;
    const deadline = new Date(activePool.deadline).getTime();
    const update = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 60000));
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [pools]);

  function markJoined(productId: string, price: number, status: "filling" | "preparing" | "ready" | "collected" = "filling") {
    try {
      const stored = localStorage.getItem("chopdrop-joined-pools");
      const pools = stored ? JSON.parse(stored) : {};
      pools[productId] = { status, price };
      localStorage.setItem("chopdrop-joined-pools", JSON.stringify(pools));
      setJoinedStatus(status);
      setJoinedPrice(price);
    } catch {}
  }

  function addSolo() {
    if (!product) return;
    cart.addItem({ dailyMenuId: `instant-${product.id}`, name: product.name, description: product.description || "", imageUrl: product.imageUrl, restaurantName: product.vendor.name, price: product.retailPrice });
    // Store delivery preference for cart page
    if (deliveryOption === "delivery" && userCoords) {
      try {
        localStorage.setItem("chopdrop-delivery-pref", JSON.stringify({
          option: deliveryOption,
          lat: userCoords.lat,
          lng: userCoords.lng,
          fee: deliveryEstimate?.fullFee || 0,
        }));
      } catch {}
    } else {
      try { localStorage.removeItem("chopdrop-delivery-pref"); } catch {}
    }
    router.push("/cart");
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
          ...(deliveryOption === "delivery" && userCoords ? { lat: userCoords.lat, lng: userCoords.lng, deliveryAddress: userCoords.address } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Initiate payment — only mark joined after payment succeeds
        const checkoutRes = await fetch(`/api/pools/${poolId}/checkout`, { method: "POST" });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.success && checkoutData.data.authorizationUrl) {
          // Save pending join so we can mark joined on return from Paystack
          sessionStorage.setItem("chopdrop-pending-join", JSON.stringify({ productId: id, price: product.groupPrice }));
          window.location.href = checkoutData.data.authorizationUrl;
          return;
        }
        // Checkout failed but join succeeded — mark joined
        markJoined(id, product.groupPrice);
        showToast("joined");
        const poolsRes = await fetch(`/api/pools?productId=${id}`);
        const poolsData = await poolsRes.json();
        if (poolsData.success) setPools(poolsData.data);
      } else {
        // If already joined, mark as joined and update CTA
        const err = (data.error || "").toLowerCase();
        if (err.includes("already") || err.includes("already joined")) {
          markJoined(id, product.groupPrice);
        }
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
        // Initiate payment — only mark joined after payment succeeds
        const checkoutRes = await fetch(`/api/pools/${data.data.poolId}/checkout`, { method: "POST" });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.success && checkoutData.data.authorizationUrl) {
          sessionStorage.setItem("chopdrop-pending-join", JSON.stringify({ productId: id, price: product.groupPrice }));
          sessionStorage.setItem("chopdrop-pool-share", JSON.stringify({
            url: `${typeof window !== "undefined" ? window.location.origin : ""}/product/${product.id}?pool=${data.data.poolId}`,
            name: product.name,
          }));
          window.location.href = checkoutData.data.authorizationUrl;
          return;
        }
        // Checkout failed but pool created — mark joined
        markJoined(id, product.groupPrice);
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

  async function leavePool() {
    if (!product) return;
    setLeavingPool(true);
    try {
      // Find the pool ID for this product
      const poolsRes = await fetch(`/api/pools?productId=${id}`);
      const poolsData = await poolsRes.json();
      const activePool = poolsData.success && poolsData.data.length > 0 ? poolsData.data[0] : null;
      if (!activePool) {
        showToast("Pool not found");
        setLeavingPool(false);
        return;
      }
      const res = await fetch(`/api/pools/${activePool.id}/leave`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Clear joined status from localStorage
        try {
          const stored = localStorage.getItem("chopdrop-joined-pools");
          if (stored) {
            const joined = JSON.parse(stored);
            delete joined[id];
            localStorage.setItem("chopdrop-joined-pools", JSON.stringify(joined));
          }
        } catch {}
        setJoinedStatus(null);
        setJoinedPrice(0);
        setLeaveOpen(false);
        showToast(`Refunded ${fp(data.data.refundAmount)} to wallet`);
        // Refresh pools
        const refreshRes = await fetch(`/api/pools?productId=${id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setPools(refreshData.data);
      } else {
        showToast(data.error || "Couldn't leave pool");
      }
    } catch {
      showToast("Network error");
    }
    setLeavingPool(false);
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
  const fillPct = pool ? Math.round((pool.memberCount / pool.minSize) * 100) : 0;
  const minutesLeft = pool ? Math.max(0, Math.round((new Date(pool.deadline).getTime() - Date.now()) / 60000)) : 180;
  const memberCount = pool ? pool.memberCount : 0;
  const poolSize = pool ? pool.minSize : product.minPoolSize;
  const spotsLeft = poolSize - memberCount;

  // ═══ POST-PAYMENT CELEBRATION SCREEN ═══
  if (justPaid && product) {
    const shareText = `${product.name} for ${fp(product.groupPrice)} (normally ${fp(product.retailPrice)})!\nWe need ${spotsLeft} more ${spotsLeft === 1 ? "person" : "people"} or the pool expires. Jump in: ${typeof window !== "undefined" ? window.location.origin : ""}/product/${id}`;
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-32" style={{ background: "var(--bg)" }}>

        {/* ── Celebration card — dark hero ── */}
        <div className="mx-5 mt-6 rounded-[16px] p-6 text-center celebrate" style={{ background: "var(--dark)" }}>
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--emerald)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          <h1 className="text-[24px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>You&apos;re in!</h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--subdued)" }}>{product.name} · {fp(joinedPrice || product.groupPrice)} paid</p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <span className="text-white">{memberCount}/{poolSize} joined</span>
              <span style={{ color: "var(--lime)" }}>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
            </div>
            <div className="h-[6px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: `${fillPct}%`, background: "var(--emerald)", borderRadius: "9px", transition: "width 300ms ease-out" }} />
            </div>
          </div>

          {/* Avatars */}
          {memberCount > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex -space-x-1.5">
                {Array.from({ length: Math.min(3, memberCount) }).map((_, j) => (
                  <div key={j} className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2px solid var(--dark)" }}>
                    {j === 0 ? (userName || "Y").charAt(0) : String.fromCharCode(65 + j)}
                  </div>
                ))}
              </div>
              <span className="text-[11px]" style={{ color: "var(--subdued)" }}>You{memberCount > 1 ? ` + ${memberCount - 1} more` : ""}</span>
            </div>
          )}
        </div>

        {/* ── Refund guarantee — compact ── */}
        <div className="mx-5 mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          <p className="text-[12px] font-bold" style={{ color: "var(--emerald)" }}>
            Fills → food is made. Doesn&apos;t fill → full refund.
          </p>
        </div>

        {/* ── Share prompt — what the message will say ── */}
        <div className="px-5 mt-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>Share to fill it</p>
          <div className="p-3.5 rounded-[16px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-3">
              {product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="w-[48px] h-[48px] rounded-[10px] object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold leading-[135%]" style={{ color: "var(--text)" }}>{product.name} · {fp(product.groupPrice)}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{product.vendor.name} · {memberCount}/{poolSize} in</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky CTA ── */}
        <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-[428px] mx-auto">
            <button type="button"
              className="w-full h-[50px] rounded-full flex items-center justify-center gap-2 text-[15px] font-bold text-white press-feedback"
              style={{ background: "var(--coral)" }}
              onClick={() => {
                if (navigator.share) navigator.share({ title: product.name, text: shareText, url: `${window.location.origin}/product/${id}` }).catch(() => {});
                else { navigator.clipboard.writeText(shareText); showToast("link"); }
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
              Share to fill it
            </button>
            <Link href="/orders" className="w-full text-[13px] font-bold text-center mt-2 block press-feedback" style={{ color: "var(--text-muted)" }}>
              View my orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>{hasPoolPricing ? "Pool deal" : product.vendor.name}</p>
          <p className="text-[14px] font-extrabold truncate max-w-[200px]" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {product.name}
          </p>
        </div>
        <button type="button" onClick={handleShare} aria-label="Share this deal" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
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
              <span className="text-[10px] font-extrabold uppercase tracking-wide rounded-full" style={{ background: "var(--lime)", color: "#1C1C1E", padding: "6px 12px" }}>
                {savings}% less together
              </span>
            </div>
          )}
        </div>
        {/* Badges below image */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: hasPoolPricing ? "var(--lime)" : "var(--sand)", color: "#1C1C1E" }}>
            {hasPoolPricing ? "Pool deal" : "No active pool"}
          </span>
          <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: "#1C1C1E" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#1C1C1E" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            4.9 (128)
          </span>
        </div>
      </div>

      {/* ── Title + Vendor ── */}
      <div className="px-5 mt-5">
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#1C1C1E" }}>{product.name}</h1>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[14px] font-semibold" style={{ color: "var(--text-muted)", lineHeight: "145%" }}>{product.vendor.name}</p>
          <span className="text-[14px] font-bold flex items-center gap-1" style={{ color: "#1C1C1E" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#1C1C1E" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            4.9 (128)
          </span>
        </div>
      </div>

      {/* ── Two-price display — pool is hero, solo is anchor ── */}
      {hasPoolPricing ? (
        <div className="px-5 mt-4">
          <div className="flex items-end gap-4">
            <div>
              <span className="text-[44px] font-extrabold tabular-nums leading-none block" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "var(--gold)" }}>{fp(product.groupPrice)}</span>
              <p className="text-[12px] font-bold mt-1" style={{ color: "var(--gold)" }}>Pool · join others</p>
            </div>
            <div className="pb-0.5">
              <span className="text-[22px] font-extrabold tabular-nums leading-none line-through block" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-muted)" }}>{fp(product.retailPrice)}</span>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>solo</p>
            </div>
          </div>
          <p className="text-[12px] font-bold mt-1.5 flex items-center gap-3" style={{ color: "var(--emerald)" }}>
            Save {fp(savedAmount)}
            <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Refundable
            </span>
          </p>
        </div>
      ) : (
        <div className="px-5 mt-4">
          <span className="text-[40px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1.5px", color: "var(--gold)" }}>{fp(product.retailPrice)}</span>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Individual price · No pool discount</p>
        </div>
      )}

      {/* ── Description ── */}
      {product.description && (
        <div className="px-5 mt-3">
          <p className="text-[14px] leading-[145%]" style={{ color: "var(--text-muted)" }}>{product.description}</p>
        </div>
      )}

      {/* ── Joined: green progress card ── */}
      {joinedStatus === "filling" && hasPoolPricing && (
        <div className="px-5 mt-4">
          <div className="rounded-[22px] overflow-hidden p-4" style={{ background: "var(--emerald-soft)" }}>
            <p className="text-[14px] font-extrabold" style={{ color: "#1C1C1E" }}>You&apos;re in! {pool ? `${pool.memberCount} of ${pool.minSize}` : `${memberCount} of ${product.minPoolSize}`} needed</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--emerald)" }}>
              {pool && pool.spotsLeft <= 3 ? `${pool.spotsLeft} more person and everyone eats.` : "More people needed and everyone eats."}
            </p>
            {/* You joined */}
            <div className="mt-3 flex items-center gap-2">
              <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[0] }}>{(userName || "Y").charAt(0)}</div>
              <span className="text-[11px] font-bold" style={{ color: "#1C1C1E" }}>{userName || "You"} (you)</span>
            </div>
            {pool && pool.memberCount > 1 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(pool.memberCount - 1, 3) }).map((_, j) => (
                    <div key={j} className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: AVATAR_COLORS[(j + 1) % AVATAR_COLORS.length] }}>
                      {String.fromCharCode(70 + j)}
                    </div>
                  ))}
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{pool.creatorName} + {pool.memberCount - 1} others in this pool</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pool progress / Demand signal ── */}
      <div className="px-5 mt-5">
        {!hasPoolPricing && (
          <div className="rounded-[22px] overflow-hidden p-5 mb-4" style={{ background: "#1C1C1E" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--lime)" }}>Let&apos;s make it cheaper together</p>
            <p className="text-[24px] font-extrabold text-white mt-2 leading-[120%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>12 people want this pool.</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[12px] font-extrabold text-white">12/20 people interested</span>
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
        <div className="rounded-[22px] overflow-hidden" style={{ background: "#1C1C1E" }}>
          <div className="p-4">
            {/* Progress text */}
            <div className="flex items-center justify-between text-[12px] font-extrabold">
              <span className="text-white">{memberCount > 0 ? `${memberCount}/${poolSize} plates claimed` : `0/${poolSize} plates claimed`}</span>
              <span style={{ color: "var(--lime)" }}>{timeLeft > 0 ? `${Math.floor(timeLeft / 60)}h ${String(timeLeft % 60).padStart(2, "0")}m left` : "Expired"}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-[7px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: `${fillPct}%`, background: "var(--lime)", borderRadius: "9px" }} />
            </div>
            <h3 className="text-[18px] font-extrabold text-white mt-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {memberCount === 0 ? "Be first to jump in." : spotsLeft === 1 ? "One more plate to unlock it." : `${spotsLeft} more to unlock it.`}
            </h3>
            {/* Avatar social proof + join feed */}
            {pool && pool.memberCount >= 1 && (
              <div className="mt-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(pool.memberCount, 3) }).map((_, j) => (
                      <div key={j} className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2.5px solid #1C1C1E" }}>
                        {j === 0 ? pool.creatorName.charAt(0) : String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--subdued)" }}>{pool.memberCount} {pool.memberCount === 1 ? "person is" : "people are"} in</span>
                </div>
                {/* Live join feed */}
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--lime)", color: "#1C1C1E" }}>
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
          <p className="text-[15px] font-bold" style={{ color: "#1C1C1E" }}>Pickup location</p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)", lineHeight: "145%" }}>Pickup nearby · Not delivery</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
      </div>

      {/* ── Refund deadline (joined only) ── */}
      {joinedStatus === "filling" && hasPoolPricing && (
        <div className="px-5 mt-4">
          <p className="text-[14px] font-bold leading-[150%]" style={{ color: "#1C1C1E" }}>
            If the pool doesn&apos;t fill by {pool ? new Date(pool.deadline).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true }) : "the deadline"}, everyone gets refunded.
          </p>
        </div>
      )}

      {/* ── Trust assurance (pool only, not joined) ── */}
      {hasPoolPricing && !joinedStatus && (
        <div className="px-5 mt-4">
          <div className="flex items-start gap-3 p-4 rounded-[16px]" style={{ background: "var(--emerald-soft)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <p className="text-[12px] leading-[160%]" style={{ color: "var(--emerald)" }}>
              Pay {fp(product.groupPrice)} upfront to join the pool. If it doesn&apos;t fill, you&apos;re automatically refunded in full. We notify you when food is ready.
            </p>
          </div>
        </div>
      )}

      {/* ── No pool: request one ── */}
      {!hasPoolPricing && (
        <div className="px-5 mt-5 p-4 rounded-[16px]" style={{ background: "var(--lime)" }}>
          <p className="text-[14px] font-extrabold" style={{ color: "#1C1C1E" }}>No pool yet for this item</p>
          <p className="text-[12px] mt-1" style={{ color: "#1C1C1E", opacity: 0.7 }}>Request a pool and we&apos;ll notify {product.vendor.name} when enough people want it. Add to your plate in the meantime.</p>
        </div>
      )}

      {/* ── Delivery toggle ── */}
      {!joinedStatus && (
        <div className="px-5 mt-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>Fulfillment</p>
          {userCoords ? (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOption("pickup")}
                  className="flex-1 h-[42px] rounded-[12px] flex items-center justify-center text-[13px] font-bold cursor-pointer transition-all"
                  style={{
                    background: deliveryOption === "pickup" ? "var(--card)" : "transparent",
                    border: deliveryOption === "pickup" ? "1.5px solid var(--charcoal)" : "1.5px solid var(--border)",
                    color: deliveryOption === "pickup" ? "var(--charcoal)" : "var(--text-muted)",
                  }}>
                  Pickup (free)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOption("delivery")}
                  className="flex-1 h-[42px] rounded-[12px] flex items-center justify-center text-[13px] font-bold cursor-pointer transition-all"
                  style={{
                    background: deliveryOption === "delivery" ? "var(--card)" : "transparent",
                    border: deliveryOption === "delivery" ? "1.5px solid var(--charcoal)" : "1.5px solid var(--border)",
                    color: deliveryOption === "delivery" ? "var(--charcoal)" : "var(--text-muted)",
                  }}>
                  {estimateLoading ? "..." : deliveryEstimate ? `Delivery (${fp(deliveryEstimate.fullFee)})` : "Delivery"}
                </button>
              </div>
              {deliveryOption === "delivery" && deliveryEstimate && (
                <div className="mt-2 flex flex-col gap-1">
                  {hasPoolPricing && (
                    <p className="text-[12px] font-bold" style={{ color: "var(--emerald)" }}>
                      {fp(deliveryEstimate.subsidizedFee)} split across pool
                    </p>
                  )}
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {deliveryEstimate.distanceKm}km away · {deliveryEstimate.walkMinutes} min walk
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-[12px]" style={{ background: "var(--sand)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Pickup only · Set location for delivery option</span>
            </div>
          )}
        </div>
      )}

      <div className="h-8" />

      {/* ═══ STICKY CTA ═══ */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto">

          {/* ── JOINED: filling — loss aversion copy ── */}
          {joinedStatus === "filling" && hasPoolPricing && (
            <>
              <button type="button"
                className="w-full h-[54px] rounded-full flex items-center justify-center gap-2 px-6 text-[15px] font-bold text-white cursor-pointer press-feedback"
                style={{ background: "var(--coral)" }}
                onClick={() => { if (navigator.share) navigator.share({ title: `Join my ChopDrop pool!`, text: `${product.name} for ${fp(product.groupPrice)}. We need more people or the pool expires and nobody eats! Join: ${window.location.href}`, url: window.location.href }).catch(() => {}); }}>
                Share to WhatsApp — Fill It
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
              </button>
              <button type="button" onClick={() => setLeaveOpen(true)} className="text-[12px] font-semibold mt-3 mx-auto block cursor-pointer" style={{ color: "var(--text-muted)" }}>
                Leave pool
              </button>
            </>
          )}

          {/* ── JOINED: preparing ── */}
          {joinedStatus === "preparing" && (
            <div className="text-center">
              <p className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>Pool filled! Preparing now...</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>{fp(joinedPrice || product.groupPrice)} paid · {product.vendor.name} is cooking</p>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>We&apos;ll notify you when it&apos;s ready</p>
            </div>
          )}

          {/* ── JOINED: ready ── */}
          {joinedStatus === "ready" && (
            <>
              <p className="text-[14px] font-bold mb-2" style={{ color: "var(--emerald)" }}>Your food is ready!</p>
              <button type="button"
                className="w-full h-[54px] rounded-full flex items-center justify-center text-[15px] font-bold text-white cursor-pointer press-feedback"
                style={{ background: "var(--emerald)" }}
                onClick={() => alert("QR code feature coming soon")}>
                Show QR Code
              </button>
            </>
          )}

          {/* ── JOINED: collected ── */}
          {joinedStatus === "collected" && (
            <div className="text-center">
              <p className="text-[13px] font-bold" style={{ color: "var(--emerald)" }}>Collected ✓</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>{fp(joinedPrice || product.groupPrice)} paid · Saved {fp(product.retailPrice - product.groupPrice)}</p>
              <div className="flex gap-2 mt-3 justify-center">
                <button className="h-[42px] px-5 rounded-full text-[13px] font-bold cursor-pointer press-feedback" style={{ background: "var(--coral)", color: "white" }}>Leave a Review</button>
                <Link href="/discover" className="h-[42px] px-5 rounded-full text-[13px] font-bold inline-flex items-center press-feedback" style={{ background: "var(--sand)", color: "#1C1C1E" }}>Reorder</Link>
              </div>
            </div>
          )}

          {/* ── EXPIRED: prompt refund or solo ── */}
          {joinedStatus === "expired" && (
            <>
              <div className="text-center mb-3">
                <p className="text-[14px] font-bold" style={{ color: "#E84C3D" }}>This pool didn&apos;t fill.</p>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Your payment is on hold. Choose what to do:</p>
              </div>
              <button type="button"
                className="w-full h-[48px] rounded-full flex items-center justify-center text-[14px] font-bold text-white cursor-pointer press-feedback"
                style={{ background: "var(--coral)" }}
                onClick={async () => {
                  if (!expiredPoolId) return;
                  try {
                    await fetch(`/api/pools/${expiredPoolId}/leave`, { method: "POST" });
                    try {
                      const stored = localStorage.getItem("chopdrop-joined-pools");
                      if (stored) { const j = JSON.parse(stored); delete j[id]; localStorage.setItem("chopdrop-joined-pools", JSON.stringify(j)); }
                    } catch {}
                    setJoinedStatus(null);
                    setJoinedPrice(0);
                    setExpiredPoolId(null);
                  } catch {}
                }}>
                Get refund to wallet
              </button>
              <button type="button" onClick={addSolo}
                className="w-full h-[44px] rounded-full flex items-center justify-center mt-2 text-[13px] font-bold cursor-pointer press-feedback"
                style={{ background: "var(--card)", color: "#1C1C1E", border: "1px solid var(--border)" }}>
                Order solo at {fp(product.retailPrice)}
              </button>
            </>
          )}

          {/* ── NOT JOINED: pool pricing ── */}
          {!joinedStatus && hasPoolPricing && (
            <>
              {/* Pool status scoreboard — visible at decision point */}
              {pool && memberCount > 0 && (
                <div className="flex items-center justify-between mb-2 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--emerald)" }}>{memberCount}/{poolSize} joined</span>
                  <span>{minutesLeft > 60 ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left` : `${minutesLeft}m left`}</span>
                </div>
              )}
              {/* Pool confidence — reduce risk for first-timers */}
              {!pool && (
                <p className="text-[11px] font-bold mb-2 text-center" style={{ color: "var(--emerald)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline -mt-px mr-1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  {poolSize <= 5 ? `Only ${poolSize} people needed. Pools this size usually fill fast.` : `${poolSize} people needed. Start it and share to your gang.`}
                </p>
              )}
              <button type="button" onClick={() => setConfirmSheet(pool ? { action: "join", poolId: pool.id } : { action: "create" })} disabled={joining}
                className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
                style={{ background: "var(--coral)" }}>
                <span>{joining ? "Joining\u2026" : pool ? `Join Pool \u2014 ${fp(product.groupPrice)}` : `Start Pool \u2014 ${fp(product.groupPrice)}`}</span>
                <span className="text-[12px] font-bold opacity-80">Save {savings}%</span>
              </button>
              {/* Pre-payment share — Pinduoduo viral loop */}
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={addSolo}
                  className="flex-1 h-[44px] rounded-full flex items-center justify-center text-[13px] font-bold cursor-pointer press-feedback"
                  style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}>
                  Solo {fp(product.retailPrice)}
                </button>
                <button type="button"
                  className="flex-1 h-[44px] rounded-full flex items-center justify-center gap-1.5 text-[13px] font-bold cursor-pointer press-feedback"
                  style={{ background: "var(--dark)", color: "white" }}
                  onClick={() => {
                    const shareText = `${product.name} for ${fp(product.groupPrice)} instead of ${fp(product.retailPrice)}! ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left. Join the pool: ${typeof window !== "undefined" ? window.location.href : ""}`;
                    if (navigator.share) navigator.share({ title: product.name, text: shareText, url: window.location.href }).catch(() => {});
                    else { navigator.clipboard.writeText(window.location.href); setToast("Link copied!"); }
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
                  Share deal
                </button>
              </div>
            </>
          )}

          {/* ── NOT JOINED: no pool pricing — request pool is primary ── */}
          {!joinedStatus && !hasPoolPricing && (
            <>
              <button type="button" onClick={() => router.push(`/request-sent/${id}`)}
                className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback"
                style={{ background: "var(--coral)" }}>
                <span>Request Pool</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round"><path d="M5 11.667c0 2.163.702 4.269 2 6 .265.353.66.587 1.098.65.437.062.882-.052 1.235-.317.354-.265.588-.66.65-1.098.063-.437-.051-.882-.316-1.235A6.644 6.644 0 018.333 11.667M5 11.667h1.667m1.666 0h.834c2.534-.066 5.012.76 7 2.333.124.093.271.15.425.163.154.014.31-.015.448-.084.138-.07.255-.176.336-.308.081-.131.125-.283.125-.438V3.333c0-.155-.044-.306-.125-.438a.832.832 0 00-.336-.308.834.834 0 00-.448-.084.834.834 0 00-.425.164c-1.989 1.573-4.466 2.398-7 2.333H6.667 4.167c-.442 0-.866.176-1.179.488A1.667 1.667 0 002.5 6.667V10c0 .442.176.866.488 1.179.313.312.737.488 1.179.488H5m3.333 0H6.667m0-6.667v6.667" /></svg>
              </button>
              <button type="button" onClick={addSolo}
                className="w-full h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold mt-2 cursor-pointer press-feedback"
                style={{ background: "var(--sand)", color: "#1C1C1E" }}>
                Add to plate — {fp(product.retailPrice)}
              </button>
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

      {/* ── Leave pool confirmation sheet ── */}
      {leaveOpen && product && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => setLeaveOpen(false)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="relative w-full max-w-[480px] rounded-t-[16px] p-5 sheet-enter" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
            <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>Leave this pool?</h3>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[13px] font-bold" style={{ color: "var(--emerald)" }}>Full refund</span>
              <span className="text-[15px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{fp(joinedPrice || product.groupPrice)}</span>
            </div>
            <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>
              {(() => {
                const stored = localStorage.getItem("chopdrop-joined-pools");
                if (!stored) return "Refund window closing soon";
                try {
                  // Estimate minutes left based on 30-min window — exact timing is server-side
                  return "Refund available within 30 min of joining";
                } catch { return "Refund window closing soon"; }
              })()}
            </p>
            <div className="flex flex-col gap-2.5 mt-5">
              <button type="button" onClick={() => setLeaveOpen(false)}
                className="h-[50px] rounded-[12px] flex items-center justify-center text-[14px] font-bold text-white cursor-pointer press-feedback"
                style={{ background: "var(--coral)" }}>
                Keep my spot
              </button>
              <button type="button" onClick={leavePool} disabled={leavingPool}
                className="h-[44px] rounded-[12px] flex items-center justify-center text-[13px] font-bold cursor-pointer press-feedback disabled:opacity-50"
                style={{ background: "var(--sand)", color: "var(--text)" }}>
                {leavingPool ? "Leaving..." : `Leave Pool \u2014 refund ${fp(joinedPrice || product.groupPrice)}`}
              </button>
            </div>
          </div>
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

      {/* ═══ PAYMENT CONFIRMATION SHEET ═══ */}
      {confirmSheet && product && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Confirm payment" onClick={() => setConfirmSheet(null)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="absolute bottom-0 left-0 right-0 sheet-enter" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[428px] mx-auto rounded-t-[22px] px-5 pt-5 pb-8" style={{ background: "var(--card)" }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />

              <h3 className="text-[18px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
                {confirmSheet.action === "join" ? "Join this pool?" : "Start a new pool?"}
              </h3>

              {/* Order summary */}
              <div className="mt-4 rounded-[12px] p-4" style={{ background: "var(--sand)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>{product.name}</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text)" }}>{fp(product.groupPrice)}</span>
                </div>
                {/* Quantity stepper */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Quantity</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="w-8 text-center text-[15px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{quantity}</span>
                    <button type="button" onClick={() => setQuantity(Math.min(product.maxQuantity || 10, quantity + 1))} aria-label="Increase quantity"
                      className="w-8 h-8 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--coral)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                </div>
                {pool && memberCount > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Pool status</span>
                    <span className="text-[13px] font-bold" style={{ color: "var(--emerald)" }}>{memberCount}/{poolSize} joined</span>
                  </div>
                )}
                <div className="h-px my-2" style={{ background: "var(--border)" }} />
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-extrabold" style={{ color: "var(--text)" }}>You pay</span>
                  <span className="text-[20px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(product.groupPrice * quantity)}</span>
                </div>
                {quantity > 1 && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {quantity} × {fp(product.groupPrice)} · Save {fp(savedAmount * quantity)} vs solo
                  </p>
                )}
                {quantity === 1 && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Solo price is {fp(product.retailPrice)} — you save {fp(savedAmount)}
                  </p>
                )}
              </div>

              {/* Refund guarantee */}
              <div className="flex items-center gap-2 mt-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <p className="text-[12px] font-bold" style={{ color: "var(--emerald)" }}>
                  {confirmSheet.action === "join" ? "Full refund if pool doesn\u2019t fill in time." : `Need ${poolSize} people total. Full refund if it doesn\u2019t fill.`}
                </p>
              </div>

              {/* Confirm CTA */}
              <button
                type="button"
                disabled={joining}
                onClick={async () => {
                  setConfirmSheet(null);
                  if (confirmSheet.action === "join" && confirmSheet.poolId) {
                    await joinPool(confirmSheet.poolId);
                  } else {
                    await createPool();
                  }
                }}
                className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback mt-5 disabled:opacity-50"
                style={{ background: "var(--coral)" }}
              >
                {joining ? "Processing\u2026" : `Pay ${fp(product.groupPrice * quantity)}`}
              </button>

              <button type="button" onClick={() => setConfirmSheet(null)} className="w-full h-[44px] flex items-center justify-center text-[13px] font-bold press-feedback mt-2" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
