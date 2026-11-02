"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BottomNav } from "@/components/bottom-nav";

interface ProductData {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; subcategory: string | null; retailPrice: number; groupPrice: number;
  minPoolSize: number; poolTiers: unknown; maxQuantity: number; tags: string | null;
  vendor: { id: string; name: string; imageUrl: string | null; address: string };
}

function formatPrice(kobo: number): string { return "₦" + (kobo / 100).toLocaleString(); }

export default function ProductDetailPage() {
  const params = useParams();
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
    setToast("Added to cart");
    setTimeout(() => setToast(""), 2000);
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="h-[300px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="px-5 pt-5 space-y-3">
          <div className="h-6 rounded-[6px] w-[70%]" style={{ background: "var(--sand)" }} />
          <div className="h-4 rounded-[6px] w-[40%]" style={{ background: "var(--sand)" }} />
          <div className="h-8 rounded-[6px] w-[50%]" style={{ background: "var(--sand)" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 flex flex-col items-center justify-center min-h-svh px-5" style={{ background: "var(--bg)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
        </div>
        <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Product not found</h1>
        <Link href="/discover" className="text-[14px] font-bold mt-3" style={{ color: "var(--coral)" }}>Browse products</Link>
        <BottomNav />
      </main>
    );
  }

  const savings = product.retailPrice > product.groupPrice ? Math.round(((product.retailPrice - product.groupPrice) / product.retailPrice) * 100) : 0;
  const savedAmount = product.retailPrice - product.groupPrice;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* Hero image */}
      <div className="relative h-[300px]" style={{ background: "var(--sand)" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
          </div>
        )}
        {/* Flat scrim for readability */}
        <div className="absolute top-0 left-0 right-0 h-20" style={{ background: "rgba(0,0,0,0.25)" }} />
        {/* Back + Share */}
        <Link href="/discover" className="absolute top-4 left-5 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.9)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        {/* Savings pill */}
        {savings > 0 && (
          <div className="absolute bottom-4 left-5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-white" style={{ background: "var(--emerald)" }}>
            Group rate
          </div>
        )}
      </div>

      {/* Price card — overlaps hero */}
      <div className="mx-5 -mt-4 rounded-[20px] p-5 relative z-10" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{product.name}</h1>

        {/* Vendor */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
            {product.vendor.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.vendor.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: "var(--text-muted)" }}>{product.vendor.name.charAt(0)}</div>
            )}
          </div>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>by {product.vendor.name}</span>
        </div>

        {/* Prices */}
        <div className="mt-4">
          <div className="text-[28px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(product.retailPrice)}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[22px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{formatPrice(product.groupPrice)}</span>
            <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>with {product.minPoolSize} people</span>
          </div>
          {savings > 0 && (
            <div className="text-[14px] font-bold mt-1" style={{ color: "var(--emerald)" }}>
              You save {formatPrice(savedAmount)} ({savings}%)
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-[14px] leading-relaxed mt-4" style={{ color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {product.description}
          </p>
        )}
      </div>

      {/* How pools work — brief explainer */}
      <div className="mx-5 mt-4 p-4 rounded-[16px]" style={{ background: "var(--sand)" }}>
        <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--text)" }}>How pool pricing works</h3>
        <div className="space-y-2">
          {[
            { icon: "M12 5v14M5 12h14", text: "Start a pool or join one — share the link" },
            { icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", text: `When ${product.minPoolSize} people join, everyone gets the group price` },
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", text: "Didn't fill? Full refund. You never lose money." },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--card)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d={s.icon} /></svg>
              </div>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor info */}
      <div className="mx-5 mt-4 p-4 rounded-[16px] flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
          {product.vendor.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.vendor.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>{product.vendor.name.charAt(0)}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{product.vendor.name}</h4>
          <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>{product.vendor.address}</p>
        </div>
      </div>

      {/* Quantity selector */}
      <div className="mx-5 mt-4 p-4 rounded-[16px] flex items-center justify-between" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Quantity</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-[10px] flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          <span className="text-[18px] font-extrabold tabular-nums w-8 text-center" style={{ color: "var(--text)" }}>{quantity}</span>
          <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-[10px] flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>

      {/* Sticky bottom CTAs */}
      <div className="fixed bottom-[52px] left-0 right-0 z-40 px-5 py-3" style={{ background: "rgba(250,247,242,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto flex gap-2.5">
          <button type="button" onClick={handleBuyNow}
            className="flex-[45] h-[50px] rounded-[12px] flex items-center justify-between px-4 text-[14px] font-bold cursor-pointer active:scale-[0.97] transition-transform"
            style={{ background: "var(--sand)", color: "var(--text)" }}>
            <span>Buy Now</span>
            <span className="tabular-nums">{formatPrice(product.retailPrice * quantity)}</span>
          </button>
          <button type="button"
            className="flex-[55] h-[50px] rounded-[12px] flex items-center justify-between px-4 text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform"
            style={{ background: "var(--coral)" }}>
            <span>Start Pool</span>
            <span className="tabular-nums">{formatPrice(product.groupPrice * quantity)}</span>
          </button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Money-back guarantee · Paystack secured</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed z-[100] left-1/2 bottom-32 -translate-x-1/2 rounded-[12px] pl-3 pr-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold text-white" style={{ background: "var(--dark)", animation: "toastIn 0.3s ease" }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          {toast}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
