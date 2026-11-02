"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { Suspense } from "react";

function formatPrice(kobo: number): string { return "₦" + (kobo / 100).toLocaleString(); }

interface OrderData {
  orderCode: string; status: string; paymentStatus: string;
  quantity: number; totalAmount: number; deliveryAddress: string | null;
  deliveryFee: number; serviceFee: number; paidAt: string | null;
  product: { name: string; imageUrl: string | null; category: string };
  vendor: { name: string; address: string };
}

export default function InstantConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}><div className="w-7 h-7 border-[2.5px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--coral)", borderTopColor: "transparent" }} /></div>}>
      <InstantConfirmationContent />
    </Suspense>
  );
}

function InstantConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderCode = params.orderCode as string;
  const reference = searchParams.get("reference");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (reference) await fetch(`/api/payments/verify?reference=${reference}`);
      const res = await fetch(`/api/instant-orders/${orderCode}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
      setLoading(false);
    }
    load();
  }, [orderCode, reference]);

  // Poll for payment confirmation
  useEffect(() => {
    if (!order || order.paymentStatus === "SUCCESS") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/instant-orders/${orderCode}`);
      const data = await res.json();
      if (data.success && data.data.paymentStatus === "SUCCESS") {
        setOrder(data.data);
        clearInterval(interval);
        localStorage.removeItem("chopdrop-cart");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, orderCode]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-[2.5px] border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--coral)", borderTopColor: "transparent" }} />
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>Loading order...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 flex flex-col items-center justify-center min-h-svh px-5" style={{ background: "var(--bg)" }}>
        <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Order not found</h1>
        <Link href="/discover" className="text-[14px] font-bold mt-3" style={{ color: "var(--coral)" }}>Browse products</Link>
        <BottomNav />
      </main>
    );
  }

  const isConfirmed = order.paymentStatus === "SUCCESS";

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Celebration / pending header */}
      <div className="pt-10 pb-8 text-center" style={{ background: isConfirmed ? "var(--dark)" : "var(--bg)" }}>
        {isConfirmed ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--emerald)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h1 className="text-[24px] font-extrabold text-white">Order confirmed!</h1>
            <p className="text-[14px] text-white/50 mt-1">{order.product.name} from {order.vendor.name}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--gold)" }}>
              <div className="w-6 h-6 border-[2.5px] border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>Verifying payment...</h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>This usually takes a few seconds</p>
          </>
        )}
      </div>

      <div className="px-5 space-y-4" style={{ marginTop: isConfirmed ? "-16px" : "0" }}>

        {/* Order code */}
        {isConfirmed && (
          <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Order code</p>
            <p className="text-[42px] font-extrabold tracking-[0.05em] leading-none tabular-nums" style={{ color: "var(--text)" }}>{order.orderCode}</p>
          </div>
        )}

        {/* Order details */}
        {isConfirmed && (
          <div className="rounded-[20px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                {order.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.product.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>{order.product.name}</h3>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{order.vendor.name} · Qty: {order.quantity}</p>
              </div>
            </div>
            <div className="space-y-2 text-[14px]" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Total paid</span>
                <span className="font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(order.totalAmount)}</span>
              </div>
              {order.deliveryAddress && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Delivery to</span>
                  <span className="font-semibold text-right max-w-[200px] truncate" style={{ color: "var(--text)" }}>{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {isConfirmed && (
          <div className="flex gap-3">
            <Link href="/discover" className="flex-1 h-12 rounded-[12px] text-[15px] font-bold flex items-center justify-center active:scale-[0.97] transition-transform" style={{ background: "var(--coral)", color: "white" }}>
              Keep shopping
            </Link>
            <Link href="/account" className="flex-1 h-12 rounded-[12px] text-[15px] font-bold flex items-center justify-center active:scale-[0.97] transition-transform" style={{ background: "var(--sand)", color: "var(--text)" }}>
              My orders
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
