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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [buyMode, setBuyMode] = useState<"solo" | "pool">("pool");
  const [toast, setToast] = useState("");
  const cart = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
      if (d.success) setProduct(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  function handleBuyNow() {
    if (!product) return;
    cart.addItem({
      dailyMenuId: `instant-${product.id}`,
      name: product.name,
      description: product.description || "",
      imageUrl: product.imageUrl,
      restaurantName: product.vendor.name,
      price: product.retailPrice,
    });
    setToast("added");
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="h-[340px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="px-5 pt-5 space-y-3">
          <div className="h-7 rounded w-[65%]" style={{ background: "var(--sand)" }} />
          <div className="h-4 rounded w-[35%]" style={{ background: "var(--sand)" }} />
          <div className="h-10 rounded w-[45%]" style={{ background: "var(--sand)" }} />
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

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-36" style={{ background: "var(--bg)" }}>

      {/* ── A. Hero image with badges ── */}
      <div className="relative h-[320px]" style={{ background: "var(--sand)" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--sand)" }} />
        )}
        <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.9)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" onClick={() => { if (navigator.share) navigator.share({ title: product.name, url: window.location.href }); }} className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.9)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
          </button>
        </div>
        {savings > 0 && (
          <div className="absolute bottom-3 left-5 px-2.5 py-1 rounded-[6px] text-[12px] font-extrabold text-white" style={{ background: "var(--coral)" }}>
            {savings}% OFF
          </div>
        )}
      </div>

      {/* ── B. Product info + pricing ── */}
      <div className="px-5 pt-4">
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{product.name}</h1>
        <Link href={`/store/${product.vendor.id}`} className="text-[12px] font-medium mt-0.5 inline-block" style={{ color: "var(--text-muted)" }}>
          {product.vendor.name}
        </Link>

        {/* Rating + orders */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>★ 4.8</span>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>·</span>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>120+ orders</span>
        </div>

        {/* Price block */}
        <div className="flex items-baseline gap-2.5 mt-3">
          <span className="text-[28px] font-extrabold tabular-nums" style={{ color: savings > 0 ? "var(--emerald)" : "var(--text)" }}>{fp(savings > 0 ? product.groupPrice : product.retailPrice)}</span>
          {savings > 0 && (
            <>
              <span className="text-[14px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(product.retailPrice)}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[4px]" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>SAVE {fp(product.retailPrice - product.groupPrice)}</span>
            </>
          )}
        </div>
        {savings > 0 && (
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{savings}% group discount · with {product.minPoolSize}+ people</p>
        )}
      </div>

      {/* ── C. Active pools to join — THE hero feature ── */}
      {savings > 0 && (() => {
        const POOL_NAMES = ["Ikeja Lunch Crew", "Weekend Foodies", "Office Gang"];
        const seed = product.id.charCodeAt(0);
        const poolCount = 1 + (seed % 2); // 1-2 active pools
        return (
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-extrabold mb-2.5" style={{ color: "var(--text)" }}>People are buying together</h3>
            <div className="flex flex-col gap-2">
              {Array.from({ length: poolCount }).map((_, i) => {
                const joined = Math.max(2, Math.round(product.minPoolSize * (0.6 + i * 0.15)));
                const spotsLeft = product.minPoolSize - joined;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBuyMode("pool")}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-[8px] text-left cursor-pointer"
                    style={{ background: "var(--card)", border: buyMode === "pool" ? "2px solid var(--emerald)" : "1px solid var(--border)" }}
                  >
                    <div className="min-w-0">
                      <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{POOL_NAMES[i]}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{joined} of {product.minPoolSize} joined</span>
                        {spotsLeft <= 2 && (
                          <span className="text-[10px] font-bold" style={{ color: "var(--coral)" }}>{spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left!</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[15px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{fp(product.groupPrice)}</span>
                    </div>
                  </button>
                );
              })}
              {/* Start new pool option */}
              <button
                type="button"
                onClick={() => setBuyMode("pool")}
                className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[8px] cursor-pointer"
                style={{ border: "1px dashed var(--border)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                <span className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>Start a new group</span>
              </button>
            </div>
            <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Join a group or start one. When {product.minPoolSize} people join, everyone pays {fp(product.groupPrice)}. If it doesn&apos;t fill, every kobo back.
            </p>
          </div>
        );
      })()}

      {/* ── D. Description ── */}
      {product.description && (
        <div className="px-5 mt-5">
          <h3 className="text-[13px] font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>About this product</h3>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{product.description}</p>
        </div>
      )}

      {/* ── E. Merchant ── */}
      <div className="px-5 mt-5">
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Sold by</h3>
        <Link href={`/store/${product.vendor.id}`} className="flex items-center gap-3 p-3 rounded-[8px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 text-[14px] font-bold text-white" style={{ background: "var(--coral)" }}>
            {product.vendor.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{product.vendor.name}</span>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>★ 4.8 · {product.vendor.address}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
      </div>

      {/* ── F. Quantity ── */}
      <div className="px-5 mt-5 flex items-center justify-between">
        <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Quantity</span>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          <span className="text-[16px] font-extrabold tabular-nums w-6 text-center" style={{ color: "var(--text)" }}>{quantity}</span>
          <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-11 h-11 rounded-[8px] flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>

      <div className="h-8" />

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-[52px] left-0 right-0 z-40 px-5 py-3" style={{ background: "rgba(249,250,251,0.92)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto flex gap-2.5">
          <button type="button" onClick={handleBuyNow}
            className="flex-[40] h-[50px] rounded-[8px] flex items-center justify-center text-[14px] font-bold cursor-pointer active:scale-[0.97] transition-transform"
            style={{ background: "var(--sand)", color: "var(--text)" }}>
            Buy · {fp(product.retailPrice * quantity)}
          </button>
          <button type="button"
            className="flex-[60] h-[50px] rounded-[8px] flex items-center justify-center gap-1.5 text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform"
            style={{ background: "var(--emerald)" }}>
            <span>Join group</span>
            <span className="tabular-nums">{fp(product.groupPrice * quantity)}</span>
          </button>
        </div>
      </div>

      {/* Added to cart */}
      {toast && (
        <div className="fixed z-[100] left-0 right-0 bottom-[104px] px-5 celebrate">
          <Link href="/cart" className="max-w-[480px] mx-auto flex items-center justify-between rounded-[8px] px-4 py-3" style={{ background: "var(--emerald)" }}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[13px] font-bold text-white">Added! View cart</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
