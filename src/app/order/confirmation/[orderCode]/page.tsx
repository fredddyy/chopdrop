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
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-white"><div className="w-7 h-7 border-[2.5px] border-[#0f4030] border-t-transparent rounded-full animate-spin" /></div>}>
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
  const [officeCodeInput, setOfficeCodeInput] = useState("");
  const [officeConnectLoading, setOfficeConnectLoading] = useState(false);
  const [officeConnectError, setOfficeConnectError] = useState("");
  const [officeConnected, setOfficeConnected] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (reference) {
        setVerifying(true);
        await fetch(`/api/payments/verify?reference=${reference}`);
        setVerifying(false);
      }
      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
      setLoading(false);
      try {
        const stored = localStorage.getItem("chopdrop-customer");
        if (stored) {
          const profile = JSON.parse(stored);
          if (profile.officeId) setOfficeConnected(true);
        }
      } catch { /* ignore */ }
    }
    loadOrder();
  }, [orderCode, reference]);

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

  async function handleConnectOffice() {
    if (!officeCodeInput.trim()) return;
    setOfficeConnectLoading(true); setOfficeConnectError("");
    try {
      const res = await fetch("/api/auth/connect-office", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: officeCodeInput.trim() }) });
      const data = await res.json();
      if (!data.success) { setOfficeConnectError(data.error || "Office not found"); setOfficeConnectLoading(false); return; }
      try {
        const stored = localStorage.getItem("chopdrop-customer");
        const profile = stored ? JSON.parse(stored) : {};
        localStorage.setItem("chopdrop-customer", JSON.stringify({ ...profile, officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint }));
      } catch { /* ignore */ }
      setOfficeConnected(true);
      setOfficeConnectLoading(false);
    } catch { setOfficeConnectError("Network error."); setOfficeConnectLoading(false); }
  }

  function handleShare() {
    const text = `I just ordered with ChopDrop — fresh meals, batch delivered to the office for free. Try it: https://chopdrop-app.vercel.app`;
    if (navigator.share) {
      navigator.share({ title: "ChopDrop", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }).catch(() => {});
    }
  }

  if (loading || verifying) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-[2.5px] border-[#0f4030] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9ca3af] text-[13px]">{verifying ? "Verifying payment..." : "Loading order..."}</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen bg-white px-5">
        <div className="w-14 h-14 bg-[#fef2f2] rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f05f4b]"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 className="font-display font-bold text-[20px] text-[#1a1a1a] mb-1">Order not found</h1>
        <p className="text-[#9ca3af] text-[13px] mb-5">This order may have expired or doesn&apos;t exist</p>
        <Link href="/menu" className="bg-[#f05f4b] text-white font-bold text-[13px] px-6 py-2.5 rounded-full">Back to menu</Link>
      </main>
    );
  }

  const isConfirmed = order.paymentStatus === "SUCCESS";
  const isPending = order.paymentStatus === "PENDING";
  const isOffice = !!order.office;
  const dropTime = order.timeSlot.startTime;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 bg-[#fafaf8]">
      <div className="px-5 pt-6 pb-4">
        {/* ── Status header ── */}
        <div className="text-center mb-5">
          {isConfirmed ? (
            <div className="w-14 h-14 bg-[#0f4030] rounded-full flex items-center justify-center mx-auto mb-3" style={{ animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m5 12 4 4L19 6" /></svg>
            </div>
          ) : isPending ? (
            <div className="w-14 h-14 bg-[#fef3c7] rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 border-[2.5px] border-[#92400e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f05f4b]"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
          )}
          <h1 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em]">
            {isConfirmed ? "You're all set!" : isPending ? "Verifying payment..." : "Payment failed"}
          </h1>
          {isConfirmed && (
            <p className="text-[#9ca3af] text-[13px] mt-1">
              {isOffice
                ? `Your food arrives at ${dropTime}. Show your code to the captain.`
                : `Your food will be ready at ${dropTime}.`
              }
            </p>
          )}
          {isPending && <p className="text-[#9ca3af] text-[12px] mt-1">This usually takes a few seconds</p>}
          {!isConfirmed && !isPending && <Link href="/menu" className="text-[#f05f4b] font-bold text-[13px] mt-2 block">Try again</Link>}
        </div>

        {/* ── Order code — the main event ── */}
        <div className="bg-white rounded-2xl p-5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-3">
          <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.1em]">Collection code</p>
          <p className="font-display font-[800] text-[38px] text-[#1a1a1a] tracking-[0.04em] mt-1 leading-none">{order.orderCode}</p>
          <p className="text-[11px] text-[#0f4030] font-semibold mt-2">
            {isOffice ? "Show this to your captain at collection" : "Show this code when collecting your food"}
          </p>
        </div>

        {/* ── What happens next ── */}
        {isConfirmed && (
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-3">
            <h2 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">What happens next</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <div className="text-[12px] font-semibold text-[#1a1a1a]">Restaurant prepares your food</div>
                  <div className="text-[10px] text-[#9ca3af] mt-0.5">{order.restaurant.name} gets your order now</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <div className="text-[12px] font-semibold text-[#1a1a1a]">
                    {isOffice ? `Batch delivery to ${order.office!.name}` : "Your food is delivered"}
                  </div>
                  <div className="text-[10px] text-[#9ca3af] mt-0.5">Arrives at {dropTime}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <div className="text-[12px] font-semibold text-[#1a1a1a]">
                    {isOffice ? `Collect from ${order.office!.collectionPoint}` : "Collect with your code"}
                  </div>
                  <div className="text-[10px] text-[#9ca3af] mt-0.5">Show code <strong className="text-[#1a1a1a]">{order.orderCode}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Order summary ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden mb-3">
          {order.meal.imageUrl && (
            <div className="h-[120px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.meal.imageUrl} alt={order.meal.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-[#9ca3af] font-semibold">{order.restaurant.name}</p>
                <h3 className="text-[14px] font-semibold text-[#1a1a1a] mt-0.5">{order.meal.name}</h3>
              </div>
              <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md ${
                isConfirmed ? "bg-[#d1fae5] text-[#0f4030]" : isPending ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#fee2e2] text-[#991b1b]"
              }`}>{isConfirmed ? "Confirmed" : isPending ? "Pending" : "Failed"}</span>
            </div>

            {order.items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#f0efeb]">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[12px] py-0.5">
                    <span className="text-[#6b7280]">{item.name}</span>
                    <span className="text-[#1a1a1a] font-medium">{formatNaira(item.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#f0efeb] space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Quantity</span>
                <span className="font-medium text-[#1a1a1a]">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Delivery</span>
                <span className="font-medium text-[#1a1a1a]">{isOffice ? "Office Batch (Free)" : order.fulfillmentType === "DELIVERY" ? "Express" : "Pickup"}</span>
              </div>
              {isOffice && (
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Office</span>
                  <span className="font-medium text-[#1a1a1a] text-right max-w-[180px]">{order.office!.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Drop time</span>
                <span className="font-medium text-[#1a1a1a]">{dropTime}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f0efeb] flex justify-between items-center">
              <span className="text-[13px] font-semibold text-[#1a1a1a]">Total paid</span>
              <span className="font-display font-bold text-[18px] text-[#1a1a1a]">{formatNaira(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2.5 mb-3">
          <Link href="/orders" className="flex-1 bg-[#1a1a1a] text-white font-semibold py-3 rounded-xl text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            Track order
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
          </Link>
          <Link href="/menu" className="flex-1 bg-[#f5f5f3] text-[#1a1a1a] font-semibold py-3 rounded-xl text-[13px] flex items-center justify-center active:scale-[0.98] transition-transform">
            Order more
          </Link>
        </div>

        {/* ── Office connect prompt ── */}
        {!officeConnected && isConfirmed && (
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 mb-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-[#0f4030]/[0.06] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[#0f4030]"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#1a1a1a]">Want free delivery next time?</h3>
                <p className="text-[10px] text-[#9ca3af] mt-0.5">Connect your office code for batch delivery</p>
              </div>
            </div>
            {officeConnectError && (
              <div className="bg-[#fef2f2] text-[#f05f4b] text-[10px] font-semibold p-2 rounded-lg mb-2">{officeConnectError}</div>
            )}
            <div className="flex gap-2">
              <input type="text" value={officeCodeInput} onChange={(e) => setOfficeCodeInput(e.target.value)} placeholder="e.g. NORTH-241" className="flex-1 px-3 py-2 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30 uppercase" onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
              <button type="button" onClick={handleConnectOffice} disabled={officeConnectLoading} className="bg-[#0f4030] text-white font-bold px-4 py-2 rounded-lg text-[11px] active:scale-95 transition-transform disabled:opacity-50">{officeConnectLoading ? "..." : "Connect"}</button>
            </div>
          </div>
        )}

        {officeConnected && (
          <div className="bg-[#d1fae5] rounded-2xl p-3 mb-3 flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#0f4030] flex-shrink-0"><path d="m5 12 4 4L19 6" /></svg>
            <span className="text-[12px] font-semibold text-[#0f4030]">Office connected — free delivery next time</span>
          </div>
        )}

        {/* ── Share ── */}
        <button type="button" onClick={handleShare} className="w-full bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left">
          <div className="w-8 h-8 bg-[#f05f4b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            {shareCopied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#22c55e]"><path d="m5 12 4 4L19 6" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[#f05f4b]"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#1a1a1a]">{shareCopied ? "Link copied!" : "Share with colleagues"}</p>
            <p className="text-[10px] text-[#9ca3af]">{shareCopied ? "Paste it anywhere" : "More people = free delivery for everyone"}</p>
          </div>
        </button>
      </div>

      <BottomNav />

      <style jsx global>{`
        @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </main>
  );
}
