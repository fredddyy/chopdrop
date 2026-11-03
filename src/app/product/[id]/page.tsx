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

// Simulated pool data — deterministic per product
const POOL_NAMES = ["Ikeja Lunch Crew", "Weekend Foodies", "Office Gang"];
const POOL_AVATARS = ["T", "A", "C", "N", "E"];
const POOL_COLORS = ["#E8604C", "#0D9F5F", "#2563EB", "#D4A24E", "#0891B2"];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const cart = useCart();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/products/${id}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { if (d.success) setProduct(d.data); setLoading(false); })
      .catch(e => { if ((e as Error).name !== "AbortError") { setError(true); setLoading(false); } });
    return () => ctrl.abort();
  }, [id, retryKey]);

  function addSolo() {
    if (!product) return;
    cart.addItem({ dailyMenuId: `instant-${product.id}`, name: product.name, description: product.description || "", imageUrl: product.imageUrl, restaurantName: product.vendor.name, price: product.retailPrice });
    showToast("added");
  }

  function addGroup() {
    if (!product) return;
    cart.addItem({ dailyMenuId: `pool-${product.id}`, name: product.name, description: product.description || "", imageUrl: product.imageUrl, restaurantName: product.vendor.name, price: product.groupPrice });
    showToast("added");
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
  const seed = product.id.charCodeAt(0);
  const poolCount = 1 + (seed % 2);

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

      {/* ═══ SOCIAL PROOF — people buying together ═══ */}
      {savings > 0 && (
        <section className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>Join a group</h3>
            <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
              {product.minPoolSize} needed · every kobo back if not filled
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {Array.from({ length: poolCount }).map((_, i) => {
              const joined = Math.max(2, Math.round(product.minPoolSize * (0.6 + i * 0.15)));
              const spotsLeft = product.minPoolSize - joined;
              const avatarStart = (seed + i * 2) % POOL_AVATARS.length;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={addGroup}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[8px] text-left cursor-pointer press-feedback"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {/* Avatar stack */}
                  <div className="flex -space-x-1.5 shrink-0">
                    {Array.from({ length: Math.min(joined, 3) }).map((_, j) => (
                      <div key={j} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: POOL_COLORS[(avatarStart + j) % POOL_COLORS.length], border: "2px solid var(--card)" }}>
                        {POOL_AVATARS[(avatarStart + j) % POOL_AVATARS.length]}
                      </div>
                    ))}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{POOL_NAMES[i]}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{joined}/{product.minPoolSize} joined</span>
                      {spotsLeft <= 2 && <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>{spotsLeft} left!</span>}
                    </div>
                  </div>
                  {/* Price + join */}
                  <div className="shrink-0 text-right">
                    <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{fp(product.groupPrice)}</span>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--emerald)" }}>Join</p>
                  </div>
                </button>
              );
            })}

            {/* Start new */}
            <button type="button" onClick={addGroup}
              className="w-full flex items-center justify-center gap-1.5 h-11 rounded-[8px] cursor-pointer press-feedback"
              style={{ border: "1px dashed var(--border)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>Start a new group</span>
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
          <button type="button" onClick={addGroup}
            className="flex-[65] h-[50px] rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold text-white cursor-pointer press-feedback"
            style={{ background: "var(--emerald)" }}>
            <span>Join group</span>
            <span className="tabular-nums">{fp(product.groupPrice * quantity)}</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed z-[100] left-0 right-0 bottom-[104px] px-5 celebrate">
          {toast === "link" ? (
            <div className="max-w-[480px] mx-auto flex items-center justify-center gap-2 rounded-[8px] px-4 py-3" style={{ background: "var(--dark)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[13px] font-bold text-white">Link copied!</span>
            </div>
          ) : (
            <Link href="/cart" className="max-w-[480px] mx-auto flex items-center justify-between rounded-[8px] px-4 py-3" style={{ background: "var(--emerald)" }}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                <span className="text-[13px] font-bold text-white">Added! View cart</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
