"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface ProductData {
  id: string; name: string; description: string | null; imageUrl: string | null;
  retailPrice: number; groupPrice: number; minPoolSize: number;
  vendor: { id: string; name: string; address: string };
}

interface PoolData {
  id: string; memberCount: number; memberNames: string[]; memberAvatars: string[];
  spotsLeft: number; deadline: string; minSize: number;
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

const AVATAR_BG = ["#E84C3D", "#F39C12", "#3498DB", "#1ABC9C", "#9B59B6", "#E67E22", "#2ECC71"];

export default function ChopProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chopCode, setChopCode] = useState<string | null>(null);
  const [chopping, setChopping] = useState(false);
  const [chopResult, setChopResult] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Load user name + check for existing chop session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.name) setUserName(p.name);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/products/${id}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (d.success) setProduct(d.data); else setError(true); })
      .catch(e => { if (e.name !== "AbortError") setError(true); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    fetch(`/api/pools?productId=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) {
          const active = d.data.find((p: PoolData & { status: string }) => p.status === "OPEN" && new Date(p.deadline).getTime() > Date.now());
          if (active) setPool(active);
        }
      })
      .catch(() => {});
  }, [product, id]);

  useEffect(() => {
    if (!pool?.deadline) return;
    const deadline = new Date(pool.deadline).getTime();
    const tick = () => setTimeLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [pool]);

  // Stable "mins ago" values — no Math.random in render
  const memberTimesAgo = useMemo(() => {
    if (!pool) return [];
    return pool.memberNames.map((_, i) => (i + 1) * 3 + (i * 7 % 5));
  }, [pool]);

  async function handleShare() {
    if (!product) return;
    setSharing(true);

    // Create a chop session if we don't have one
    let code = chopCode;
    if (!code) {
      try {
        const res = await fetch("/api/chop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ productId: product.id, quantity: 1, retailPrice: product.retailPrice, groupPrice: product.groupPrice, name: product.name, imageUrl: product.imageUrl }] }),
        });
        const d = await res.json();
        if (d.success && d.data?.shareCode) {
          code = d.data.shareCode;
          setChopCode(code);
        }
      } catch {}
    }

    const url = code ? `${window.location.origin}/chop/${code}` : `${window.location.origin}/chop/product/${id}`;
    const text = `Chop the price of ${product.name} on ChopDrop!`;
    if (navigator.share) {
      try { await navigator.share({ title: `Chop: ${product.name}`, text, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
    setSharing(false);
  }

  async function handleChop() {
    if (!product || chopping) return;
    const name = userName || "Friend";
    setChopping(true);
    // Try to find or create a chop session for this product
    try {
      // First try to create a session
      let code = chopCode;
      if (!code) {
        const res = await fetch("/api/chop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ productId: product.id, quantity: 1, retailPrice: product.retailPrice, groupPrice: product.groupPrice, name: product.name, imageUrl: product.imageUrl }] }),
        });
        const d = await res.json();
        if (d.success && d.data?.shareCode) {
          code = d.data.shareCode;
          setChopCode(code);
        }
      }
      if (code) {
        const clickRes = await fetch(`/api/chop/${code}/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const clickData = await clickRes.json();
        if (clickData.success) {
          setChopResult(`You chopped ${fp(clickData.data.chopAmount)} off!`);
          setTimeout(() => setChopResult(null), 3000);
          // Redirect to the chop session page
          router.push(`/chop/${code}`);
        } else {
          setChopResult(clickData.error || "Could not chop");
          setTimeout(() => setChopResult(null), 3000);
        }
      }
    } catch {
      setChopResult("Something went wrong");
      setTimeout(() => setChopResult(null), 3000);
    }
    setChopping(false);
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="h-[56px]" />
        <div className="mx-5 rounded-[16px]" style={{ height: "260px", background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="px-5 mt-4 space-y-3">
          <div className="h-6 rounded-lg w-[60%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          <div className="h-4 rounded-lg w-[40%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "150ms" }} />
          <div className="h-10 rounded-lg w-[50%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "200ms" }} />
        </div>
        <div className="px-5 mt-6">
          <div className="h-5 rounded-lg w-[35%] mb-3" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "250ms" }} />
          <div className="rounded-[14px] h-[100px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "300ms" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Couldn&apos;t load product</h2>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>Try again</button>
        </div>
        <BottomNav />
      </main>
    );
  }

  const savings = product.retailPrice - product.groupPrice;
  const savPct = Math.round((savings / product.retailPrice) * 100);
  const chopTarget = product.minPoolSize || 5;
  const chopsDone = pool?.memberCount || 0;
  const chopsLeft = Math.max(0, chopTarget - chopsDone);
  const chopPct = Math.round((chopsDone / chopTarget) * 100);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const chopAmountEach = Math.round(product.retailPrice / chopTarget);

  // Show filled rows + max 2 empty slots
  const visibleSlots = Math.min(chopTarget, chopsDone + 2);

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 px-5 h-[56px] flex items-center justify-between" style={{ background: "var(--bg)" }}>
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold tracking-[0.05em] uppercase" style={{ color: "var(--coral)" }}>Chop Price</p>
          <p className="text-[13px] font-bold truncate max-w-[200px]" style={{ color: "var(--text)" }}>{product.name}</p>
        </div>
        <button type="button" onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
        </button>
      </div>

      {/* ── Product image ── */}
      <div className="px-5">
        <div className="relative rounded-[16px] overflow-hidden" style={{ height: "260px", background: "var(--sand)" }}>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[40px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{product.name.charAt(0)}</span>
            </div>
          )}
          <span className="absolute top-3 left-3 text-[10px] font-extrabold px-3 py-1 rounded-full text-white" style={{ background: "var(--emerald)" }}>
            {savPct}% LESS TOGETHER
          </span>
        </div>
      </div>

      {/* ── Product info ── */}
      <div className="px-5 mt-4">
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{product.name}</h1>
        <button type="button" onClick={() => router.push(`/store/${product.vendor.id}`)} className="text-[12px] font-medium mt-0.5 press-feedback" style={{ color: "var(--coral)" }}>{product.vendor.name} &rarr;</button>
        {product.description && <p className="text-[12px] mt-1 leading-[155%]" style={{ color: "var(--text-muted)" }}>{product.description}</p>}

        {/* Price comparison */}
        <div className="flex items-baseline gap-3 mt-3">
          <div>
            <p className="text-[28px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--coral)" }}>{fp(product.groupPrice)}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--coral)" }}>With others</p>
          </div>
          <div>
            <p className="text-[18px] font-extrabold tabular-nums leading-none line-through" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-muted)" }}>{fp(product.retailPrice)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>store price</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>Save {fp(savings)}</span>
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
            Refundable
          </span>
        </div>
      </div>

      {/* ── Chop Progress ── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Chop Progress</h3>
          <div className="flex items-center gap-1">
            {(() => {
              const h = Math.floor(timeLeft / 3600);
              const m = Math.floor((timeLeft % 3600) / 60);
              const s = timeLeft % 60;
              const segments = h > 0
                ? [{ val: h, unit: "h" }, { val: m, unit: "m" }, { val: s, unit: "s" }]
                : [{ val: m, unit: "m" }, { val: s, unit: "s" }];
              return timeLeft > 0 ? segments.map((seg, si) => (
                <div key={si} className="flex items-center">
                  {si > 0 && <span className="text-[9px] font-bold mx-0.5" style={{ color: "var(--text-muted)" }}>:</span>}
                  <span className="text-[13px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-[5px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)", background: "var(--sand)" }}>
                    {String(seg.val).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] font-bold ml-0.5" style={{ color: "var(--text-muted)" }}>{seg.unit}</span>
                </div>
              )) : (
                <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Not started</span>
              );
            })()}
          </div>
        </div>

        <div className="rounded-[14px] p-4" style={{ background: "var(--sand)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{fp(product.retailPrice)}</span>
            <span className="text-[11px] font-extrabold" style={{ color: "var(--emerald)" }}>{fp(product.groupPrice)}</span>
          </div>
          <div className="h-[8px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.max(chopPct, 3)}%`,
              background: chopPct >= 100 ? "var(--emerald)" : "var(--coral)",
              transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12px] font-bold" style={{ color: "var(--text)" }}>
              {chopsDone} of {chopTarget} chops
            </span>
            {timeLeft > 0 && (
              <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: "var(--coral)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                {mins}m {secs}s left &mdash; share now
              </span>
            )}
            {!pool && (
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Share to start the timer</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Chop History ── */}
      <div className="px-5 mt-5">
        <h3 className="text-[14px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Chop History</h3>

        <div className="space-y-0">
          {Array.from({ length: visibleSlots }).map((_, i) => {
            const filled = pool && i < pool.memberCount;
            const name = filled ? (pool.memberNames[i] || `Friend ${i + 1}`) : null;
            const minsAgo = filled ? (memberTimesAgo[i] || (i + 1) * 4) : 0;
            return (
              <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < visibleSlots - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
                  style={{
                    background: filled ? AVATAR_BG[i % AVATAR_BG.length] : "var(--sand)",
                    border: filled ? "none" : "1.5px dashed var(--text-muted)",
                    color: filled ? "white" : "var(--text-muted)",
                  }}>
                  {filled && pool.memberAvatars?.[i]
                    ? <img src={pool.memberAvatars[i]} alt="" className="w-full h-full object-cover" />
                    : filled ? name?.charAt(0) : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  {filled ? (
                    <>
                      <p className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{name}</p>
                      <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{minsAgo} min ago</p>
                    </>
                  ) : (
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>Waiting for someone...</p>
                  )}
                </div>
                {filled && (
                  <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>
                    &minus;{fp(chopAmountEach)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Remaining slots summary */}
        {chopsLeft > 2 && (
          <p className="text-[11px] font-medium mt-2 text-center" style={{ color: "var(--text-muted)" }}>
            Share to invite {chopsLeft} more {chopsLeft === 1 ? "friend" : "friends"}
          </p>
        )}
      </div>

      {/* ── Copied toast ── */}
      {copied && (
        <div className="fixed z-[100] left-0 right-0 bottom-[140px] px-5 celebrate">
          <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-lg px-4 py-3" style={{ background: "var(--emerald)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            <span className="text-[13px] font-bold text-white">Link copied to clipboard</span>
          </div>
        </div>
      )}

      {/* ── Chop result toast ── */}
      {chopResult && (
        <div className="fixed z-[100] left-0 right-0 bottom-[140px] px-5 celebrate">
          <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-lg px-4 py-3" style={{ background: chopResult.includes("chopped") ? "var(--emerald)" : "var(--coral)" }}>
            <span className="text-[13px] font-bold text-white">{chopResult}</span>
          </div>
        </div>
      )}

      {/* ── Sticky bottom CTAs ── */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 px-5 pt-3 pb-3" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto space-y-2">
          {/* Primary: Chop now (for visitors) or Share (for owner) */}
          <div className="flex gap-2">
            <button type="button" onClick={handleChop} disabled={chopping}
              className="flex-1 h-[50px] rounded-[12px] flex items-center justify-center gap-2 text-[14px] font-bold text-white press-feedback disabled:opacity-50"
              style={{ background: "var(--coral)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
              {chopping ? "Chopping..." : "Chop the price"}
            </button>
            <button type="button" onClick={handleShare}
              className="w-[50px] h-[50px] rounded-[12px] flex items-center justify-center press-feedback shrink-0"
              style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            </button>
          </div>
          <button type="button" onClick={() => {
            cart.addItem({ dailyMenuId: product.id, name: product.name, description: product.description || "", imageUrl: product.imageUrl, restaurantId: product.vendor.id, restaurantName: product.vendor.name, price: product.retailPrice });
            router.push("/cart");
          }}
            className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[13px] font-bold press-feedback"
            style={{ background: "var(--sand)", color: "var(--text)" }}>
            Buy alone · {fp(product.retailPrice)}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
