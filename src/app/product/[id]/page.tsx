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

      {/* ── Hero — full bleed, tall, immersive ── */}
      <div className="relative h-[340px]" style={{ background: "var(--sand)" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--sand)" }} />
        )}
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-4 left-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      </div>

      {/* ── Content — no card overlap, just clean flow ── */}
      <div className="px-5 pt-5">

        {/* Name + vendor — one line */}
        <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{product.name}</h1>
        <Link href={`/store/${product.vendor.id}`} className="text-[12px] font-medium mt-1 inline-block" style={{ color: "var(--text-muted)" }}>
          {product.vendor.name} · {product.vendor.address}
        </Link>

        {/* Description — inline, not in a card */}
        {product.description && (
          <p className="text-[14px] leading-relaxed mt-3" style={{ color: "var(--text-secondary)" }}>
            {product.description}
          </p>
        )}

        {/* ── Price block — the core decision ── */}
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-[13px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(product.retailPrice)}</span>
            <div className="text-[36px] font-extrabold tabular-nums leading-none mt-0.5" style={{ color: "var(--text)" }}>
              {fp(product.groupPrice)}
            </div>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
              with {product.minPoolSize}+ people · You keep {fp(product.retailPrice - product.groupPrice)}
            </p>
          </div>
          {/* Quantity — compact, inline */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </button>
            <span className="text-[16px] font-extrabold tabular-nums w-6 text-center" style={{ color: "var(--text)" }}>{quantity}</span>
            <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>

        {/* ── Pool progress — the signature element ── */}
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Pool progress</span>
            <div className="flex items-center gap-1.5">
              <span className="pool-dot" />
              <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>Open</span>
            </div>
          </div>
          <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
            <div className="h-full rounded-full" style={{ width: "15%", background: "var(--emerald)" }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>0 joined</span>
            <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>{product.minPoolSize} needed</span>
          </div>
        </div>

        {/* ── Pool guarantee — one line, not a card ── */}
        <p className="text-[12px] mt-4" style={{ color: "var(--text-muted)" }}>
          Pool doesn&apos;t fill? Full refund. No risk.
        </p>
      </div>

      {/* ── Sticky CTAs ── */}
      <div className="fixed bottom-[52px] left-0 right-0 z-40 px-5 py-3" style={{ background: "rgba(250,250,248,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto flex gap-2.5">
          <button type="button" onClick={handleBuyNow}
            className="flex-[45] h-[50px] rounded-[12px] flex items-center justify-between px-4 text-[14px] font-bold cursor-pointer active:scale-[0.97] transition-transform"
            style={{ background: "var(--sand)", color: "var(--text)" }}>
            <span>Buy Now</span>
            <span className="tabular-nums">{fp(product.retailPrice * quantity)}</span>
          </button>
          <button type="button"
            className="flex-[55] h-[50px] rounded-[12px] flex items-center justify-between px-4 text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform"
            style={{ background: "var(--coral)" }}>
            <span>Pool &amp; Save</span>
            <span className="tabular-nums">{fp(product.groupPrice * quantity)}</span>
          </button>
        </div>
      </div>

      {/* Added to cart */}
      {toast && (
        <div className="fixed z-[100] left-0 right-0 bottom-[104px] px-5" style={{ animation: "cardIn 0.3s ease both" }}>
          <Link href="/cart" className="max-w-[480px] mx-auto flex items-center justify-between rounded-[12px] px-4 py-3" style={{ background: "var(--dark)" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              </div>
              <span className="text-[13px] font-semibold text-white">Added to cart</span>
            </div>
            <span className="text-[13px] font-bold" style={{ color: "var(--coral)" }}>View Cart →</span>
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
