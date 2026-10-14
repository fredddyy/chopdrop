"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface OrderData {
  orderCode: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  fulfillmentType: string;
  deliveryAddress: string | null;
  quantity: number;
  totalAmount: number;
  meal: { name: string; type: string; imageUrl: string | null };
  restaurant: { name: string; address: string };
  timeSlot: { startTime: string; endTime: string };
  office: { name: string; address: string; collectionPoint: string; assistantName: string | null; assistantPhone: string | null } | null;
  items: { name: string; category: string; price: number; quantity: number }[];
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-cream"><div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderCode = params.orderCode as string;
  const reference = searchParams.get("reference");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (reference) {
        setVerifying(true);
        await fetch(`/api/payments/verify?reference=${reference}`);
        setVerifying(false);
      }

      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
      setLoading(false);
    }

    loadOrder();
  }, [orderCode, reference]);

  // Poll if payment is still pending
  useEffect(() => {
    if (!order || order.paymentStatus === "SUCCESS") return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 10) { clearInterval(interval); return; }

      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();
      if (data.success && data.data.paymentStatus === "SUCCESS") {
        setOrder(data.data);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order, orderCode]);

  if (loading || verifying) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-soft text-sm font-medium">
            {verifying ? "Verifying payment..." : "Loading order..."}
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-cream px-5">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-xl mb-2">Order not found</h1>
          <Link href="/menu" className="text-coral font-bold text-sm hover:underline">Back to menu</Link>
        </div>
      </main>
    );
  }

  const isConfirmed = order.paymentStatus === "SUCCESS";
  const isPending = order.paymentStatus === "PENDING";

  return (
    <main className="flex-1 max-w-lg mx-auto w-full pb-20 bg-cream">
      <div className="px-5 py-8">
        {/* Status icon */}
        <div className="text-center mb-6">
          {isConfirmed ? (
            <div className="w-16 h-16 bg-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_0_10px_var(--green-soft)]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
          ) : isPending ? (
            <div className="w-16 h-16 bg-amber rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </div>
          )}

          <h1 className="font-display font-bold text-[24px] tracking-[-0.03em]">
            {isConfirmed ? "Order Confirmed" : isPending ? "Verifying Payment..." : "Payment Failed"}
          </h1>
          {isPending && <p className="text-ink-soft text-xs mt-1">This usually takes a few seconds</p>}
          {!isConfirmed && !isPending && (
            <Link href="/menu" className="text-coral font-bold text-sm mt-2 block hover:underline">Try ordering again</Link>
          )}
        </div>

        {/* Order code card */}
        <div className="bg-paper border-2 border-green/20 rounded-[16px] p-6 text-center mb-5">
          <p className="text-ink-soft text-[11px] font-semibold uppercase tracking-[0.1em]">Your Order Code</p>
          <p className="font-display font-[800] text-[36px] tracking-[0.02em] text-ink mt-1">{order.orderCode}</p>
          <p className="text-green text-[11px] font-semibold mt-1">Show this code at pickup</p>
        </div>

        {/* Order details */}
        <div className="bg-paper border border-line rounded-[16px] overflow-hidden mb-5">
          {/* Meal image + info */}
          {order.meal.imageUrl && (
            <div className="h-[140px] overflow-hidden">
              <img src={order.meal.imageUrl} alt={order.meal.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-4 space-y-3.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.08em]">{order.restaurant.name}</div>
                <strong className="font-display text-[16px] block mt-0.5">{order.meal.name}</strong>
              </div>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-full ${
                isConfirmed ? "bg-green-soft text-green" : "bg-amber-soft text-[#7d5716]"
              }`}>{order.status}</span>
            </div>

            {/* Items if build-your-plate */}
            {order.items.length > 0 && (
              <div className="border-t border-line pt-3">
                <span className="text-ink-soft text-[10px] font-semibold block mb-1.5">Your plate</span>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[12px] py-1">
                    <span>{item.name}</span>
                    <span className="text-ink-soft">{formatNaira(item.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-3 space-y-2.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-ink-soft">Quantity</span>
                <strong>{order.quantity}</strong>
              </div>

              {/* Office batch delivery */}
              {order.office ? (
                <>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-ink-soft">Delivery</span>
                    <strong className="text-green">Office Batch Drop</strong>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-ink-soft">Office</span>
                    <strong className="text-right max-w-[180px]">{order.office.name}</strong>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-ink-soft">Collect at</span>
                    <strong className="text-right max-w-[180px]">{order.office.collectionPoint}</strong>
                  </div>
                  {order.office.assistantName && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-ink-soft">Assistant</span>
                      <strong>{order.office.assistantName}</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-[12px]">
                    <span className="text-ink-soft">Drop time</span>
                    <strong>{order.timeSlot.startTime} – {order.timeSlot.endTime}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-ink-soft">{order.fulfillmentType === "PICKUP" ? "Pickup at" : "Delivery to"}</span>
                    <strong className="text-right max-w-[180px]">
                      {order.fulfillmentType === "PICKUP" ? order.restaurant.address : order.deliveryAddress}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-ink-soft">Ready at</span>
                    <strong>{order.timeSlot.startTime} – {order.timeSlot.endTime}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-line pt-3 flex justify-between items-center">
              <span className="font-semibold text-[13px]">Amount paid</span>
              <strong className="font-display font-bold text-[18px]">{formatNaira(order.totalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Collection ticket */}
        <div className="bg-paper border border-line rounded-[16px] p-4 mb-5">
          <div className="grid grid-cols-3 divide-x divide-line text-center">
            <div className="px-2">
              <span className="text-ink-soft text-[8px] font-extrabold uppercase tracking-[0.08em] block">Code</span>
              <strong className="font-display text-[13px] mt-1 block">{order.orderCode}</strong>
            </div>
            <div className="px-2">
              <span className="text-ink-soft text-[8px] font-extrabold uppercase tracking-[0.08em] block">Slot</span>
              <strong className="font-display text-[13px] mt-1 block">{order.timeSlot.startTime}</strong>
            </div>
            <div className="px-2">
              <span className="text-ink-soft text-[8px] font-extrabold uppercase tracking-[0.08em] block">Type</span>
              <strong className="font-display text-[13px] mt-1 block">{order.office ? "Office Drop" : order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Link
            href="/orders"
            className="w-full bg-ink text-white font-bold py-3 rounded-[10px] text-sm flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors"
          >
            Track my lunch
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
          </Link>
          <Link
            href="/menu"
            className="w-full bg-paper border border-line text-ink font-bold py-3 rounded-[10px] text-sm flex items-center justify-center gap-2 hover:bg-cream transition-colors"
          >
            Order more
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-6 text-ink-soft text-[11px]">
          <p>Questions? WhatsApp us:</p>
          <p className="font-bold text-ink mt-0.5">0801 234 5678</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
