"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface OrderData {
  id: string; orderCode: string; status: string; paymentStatus: string;
  customerName: string; fulfillmentType: string; deliveryAddress: string | null;
  quantity: number; totalAmount: number; creditsApplied: number;
  meal: { name: string; type: string; imageUrl: string | null };
  restaurant: { name: string; address: string };
  timeSlot: { startTime: string; endTime: string };
  office: { name: string; address: string; collectionPoint: string; assistantName: string | null; assistantPhone: string | null } | null;
  items: { name: string; category: string; price: number; quantity: number }[];
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}><div className="w-7 h-7 border-[2.5px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--coral)", borderTopColor: "transparent" }} /></div>}>
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
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingIssues, setRatingIssues] = useState<string[]>([]);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (reference) { setVerifying(true); await fetch(`/api/payments/verify?reference=${reference}`); setVerifying(false); }
      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
      setLoading(false);
      try { const stored = localStorage.getItem("chopdrop-customer"); if (stored) { const profile = JSON.parse(stored); if (profile.officeId) setOfficeConnected(true); } } catch {}
    }
    loadOrder();
  }, [orderCode, reference]);

  useEffect(() => {
    if (!order || order.paymentStatus === "SUCCESS") return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 40) { clearInterval(interval); setPaymentTimedOut(true); return; }
      try {
        const res = await fetch(`/api/orders/${orderCode}`);
        const data = await res.json();
        if (data.success && data.data.paymentStatus === "SUCCESS") { setOrder(data.data); clearInterval(interval); }
      } catch { /* retry on next interval */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, orderCode]);

  // Poll for order STATUS updates after payment confirmed (preparing → ready → delivered)
  useEffect(() => {
    if (!order || order.paymentStatus !== "SUCCESS" || order.status === "COMPLETED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderCode}`);
        const data = await res.json();
        if (data.success && data.data.status !== order.status) { setOrder(data.data); }
        if (data.success && data.data.status === "COMPLETED") { clearInterval(interval); }
      } catch { /* retry */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [order, orderCode]);

  async function handleConnectOffice() {
    if (!officeCodeInput.trim()) return;
    setOfficeConnectLoading(true); setOfficeConnectError("");
    try {
      const res = await fetch("/api/auth/connect-office", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: officeCodeInput.trim() }) });
      const data = await res.json();
      if (!data.success) { setOfficeConnectError(data.error || "Office not found"); setOfficeConnectLoading(false); return; }
      try { const stored = localStorage.getItem("chopdrop-customer"); const profile = stored ? JSON.parse(stored) : {}; localStorage.setItem("chopdrop-customer", JSON.stringify({ ...profile, officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint })); } catch {}
      setOfficeConnected(true);
    } catch { setOfficeConnectError("Network error."); }
    setOfficeConnectLoading(false);
  }

  async function handleRate(score: number) {
    setRatingScore(score);
    if (score >= 3) { await fetch("/api/orders/rate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order?.id, score }) }); setRatingSubmitted(true); }
  }

  async function handleRateWithIssues() {
    await fetch("/api/orders/rate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order?.id, score: ratingScore, issues: ratingIssues.join(",") }) });
    setRatingSubmitted(true);
  }

  function toggleIssue(issue: string) { setRatingIssues((prev) => prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]); }

  function handleShare() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `I just ordered lunch with ChopDrop — fresh food at the office, ₦0 delivery. Try it: ${origin}`;
    if (navigator.share) { navigator.share({ title: "ChopDrop", text }).catch(() => {}); }
    else { navigator.clipboard.writeText(text).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }).catch(() => {}); }
  }

  function cleanName(name: string) { return name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, ""); }

  if (loading || verifying) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-[2.5px] border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--coral)", borderTopColor: "transparent" }} />
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>{verifying ? "Verifying payment..." : "Loading order..."}</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-svh px-5" style={{ background: "var(--bg)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Order not found</h1>
        <p className="text-[14px] mb-5" style={{ color: "var(--text-muted)" }}>This order may have expired</p>
        <Link href="/menu" className="h-11 px-6 rounded-full text-[14px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Back to menu</Link>
      </main>
    );
  }

  const isConfirmed = order.paymentStatus === "SUCCESS";
  const isPending = order.paymentStatus === "PENDING";
  const isOffice = !!order.office;
  const dropTime = order.timeSlot.startTime;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Celebration header — dark */}
      <div className="pt-10 pb-8 text-center" style={{ background: isConfirmed ? "var(--dark)" : "var(--bg)" }}>
        {isConfirmed && order.status === "COMPLETED" ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--emerald)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h1 className="text-[22px] font-extrabold text-white mb-1">Delivered!</h1>
            <p className="text-[14px] text-white/50">
              {isOffice ? `Collected at ${order.office!.collectionPoint}` : "Order complete"}
            </p>
            <p className="text-[13px] text-white/30 mt-2">Pool credits (if any) will be applied to your next order</p>
          </>
        ) : isConfirmed ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--emerald)", animation: "fu 0.4s ease" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h1 className="text-[24px] font-extrabold text-white tracking-[-0.02em]">You&apos;re all set!</h1>
            <p className="text-[15px] text-white/50 mt-1 max-w-[300px] mx-auto">
              {isOffice ? `Arrives at ${dropTime} · Show your code at ${order.office!.collectionPoint}` : `Ready at ${dropTime}`}
            </p>
          </>
        ) : isPending ? (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--gold)" }}>
              <div className="w-6 h-6 border-[2.5px] border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>Verifying payment...</h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
              {paymentTimedOut ? "Taking longer than usual" : "This usually takes a few seconds"}
            </p>
            {paymentTimedOut && (
              <button type="button" onClick={() => { setPaymentTimedOut(false); window.location.reload(); }} className="mt-3 h-10 px-6 rounded-full text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-all" style={{ background: "var(--coral)" }}>
                Check again
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>Payment failed</h1>
            <Link href="/menu" className="text-[14px] font-bold mt-2 block" style={{ color: "var(--coral)" }}>Try again</Link>
          </>
        )}
      </div>

      <div className="px-5 space-y-4" style={{ marginTop: isConfirmed ? "-16px" : "0" }}>

        {/* Collection code — THE dominant element */}
        {isConfirmed && (
          <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Your collection code</p>
            <p className="text-[42px] font-extrabold tracking-[0.05em] leading-none tabular-nums" style={{ color: "var(--text)" }}>{order.orderCode}</p>
            <p className="text-[13px] font-medium mt-3" style={{ color: "var(--emerald)" }}>
              {isOffice ? `Show this at ${order.office!.collectionPoint}` : "Show this when collecting"}
            </p>
          </div>
        )}

        {/* WhatsApp save — send order details to yourself or captain */}
        {isConfirmed && (() => {
          const mealName = order.meal.name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "");
          const waText = encodeURIComponent(
            `My ChopDrop Order\n\nCode: ${order.orderCode}\nMeal: ${mealName} × ${order.quantity}\nFrom: ${order.restaurant.name}\nTotal: ${formatNaira(order.totalAmount)}\n${isOffice ? `Pickup: ${order.office!.collectionPoint}` : ""}\nArrives by ${dropTime}`
          );
          return (
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full h-12 rounded-full text-[14px] font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: "#25d366" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Save order to WhatsApp
            </a>
          );
        })()}

        {/* Order status timeline — clean, no numbers, no emoji */}
        {isConfirmed && (() => {
          const statusMap: Record<string, number> = { PENDING: 0, CONFIRMED: 1, READY: 2, COMPLETED: 3 };
          const currentStep = statusMap[order.status] ?? 0;
          const steps = [
            { label: "Order placed", sub: "Payment confirmed" },
            { label: "Preparing", sub: `${order.restaurant.name} is cooking` },
            { label: "On the way", sub: `Arriving by ${dropTime}` },
            { label: isOffice ? "At reception" : "Ready", sub: isOffice ? order.office!.collectionPoint : "Collect with your code" },
          ];
          return (
            <div className="rounded-[20px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="space-y-0">
                {steps.map((s, i) => {
                  const isDone = i <= currentStep;
                  const isActive = i === currentStep;
                  return (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all`} style={{
                          background: isDone ? "var(--emerald)" : "var(--sand)",
                          ...(isActive ? { boxShadow: "0 0 0 4px rgba(13,159,95,0.15)" } : {}),
                        }}>
                          {isDone ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full" style={{ background: "var(--text-muted)" }} />
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="w-0.5 h-7 my-1 rounded-full" style={{ background: i < currentStep ? "var(--emerald)" : "var(--border)" }} />
                        )}
                      </div>
                      <div className={`pt-1.5 ${i < steps.length - 1 ? "pb-2" : ""}`}>
                        <div className="text-[14px] font-bold" style={{ color: isDone ? "var(--text)" : "var(--text-muted)" }}>{s.label}</div>
                        <div className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.sub}</div>
                        {isActive && i < 3 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--emerald)" }} />
                            <span className="text-[12px] font-semibold" style={{ color: "var(--emerald)" }}>In progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* What you ordered — food photo + details */}
        <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {order.meal.imageUrl && (
            <div className="h-[130px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.meal.imageUrl} alt={order.meal.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{order.restaurant.name}</p>
                <h3 className="text-[16px] font-bold mt-0.5" style={{ color: "var(--text)" }}>{cleanName(order.meal.name)}</h3>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full" style={{
                background: isConfirmed ? "rgba(13,159,95,0.1)" : isPending ? "rgba(212,162,78,0.15)" : "#FEF2F2",
                color: isConfirmed ? "var(--emerald)" : isPending ? "var(--gold)" : "var(--coral)",
              }}>{isConfirmed ? "Confirmed" : isPending ? "Pending" : "Failed"}</span>
            </div>

            {order.items.length > 0 && (
              <div className="pt-3 mb-3" style={{ borderTop: "1px solid var(--border)" }}>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[14px] py-1">
                    <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                    <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(item.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 text-[14px] pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Quantity</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Delivery</span>
                <span className="font-semibold" style={{ color: isOffice ? "var(--emerald)" : "var(--text)" }}>{isOffice ? "Free office drop" : order.fulfillmentType === "DELIVERY" ? "Express" : "Pickup"}</span>
              </div>
              {order.creditsApplied > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Credits applied</span>
                  <span className="font-semibold tabular-nums" style={{ color: "var(--emerald)" }}>-{formatNaira(order.creditsApplied)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Total paid</span>
                <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating — only when order is delivered */}
        {isConfirmed && (order.status === "COMPLETED" || order.status === "READY") && !ratingSubmitted && (
          <div className="rounded-[20px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {ratingScore === 0 ? (
              <>
                <h3 className="text-[16px] font-bold text-center mb-1" style={{ color: "var(--text)" }}>How was your meal?</h3>
                <p className="text-[13px] text-center mb-4" style={{ color: "var(--text-muted)" }}>{order.restaurant.name}</p>
                <div className="flex justify-center gap-3">
                  {[
                    { label: "Bad", score: 1 }, { label: "Meh", score: 2 },
                    { label: "OK", score: 3 }, { label: "Good", score: 4 }, { label: "Great", score: 5 },
                  ].map((r) => (
                    <button key={r.score} type="button" onClick={() => handleRate(r.score)}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold cursor-pointer active:scale-90 transition-transform"
                      style={{ background: "var(--sand)", color: "var(--text)" }}>
                      {r.score}
                    </button>
                  ))}
                </div>
              </>
            ) : ratingScore <= 2 ? (
              <>
                <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text)" }}>What went wrong?</h3>
                <div className="space-y-2 mb-4">
                  {["Portion too small", "Food was cold", "Didn't taste good", "Wrong order", "Arrived late", "Something else"].map((issue) => (
                    <button key={issue} type="button" onClick={() => toggleIssue(issue)}
                      className="w-full text-left px-4 py-3 rounded-[12px] text-[14px] font-medium cursor-pointer transition-colors"
                      style={{ background: ratingIssues.includes(issue) ? "rgba(232,96,76,0.1)" : "var(--sand)", color: ratingIssues.includes(issue) ? "var(--coral)" : "var(--text-secondary)", border: ratingIssues.includes(issue) ? "1px solid rgba(232,96,76,0.2)" : "1px solid transparent" }}>
                      {ratingIssues.includes(issue) ? "✓ " : ""}{issue}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={handleRateWithIssues} className="w-full h-12 rounded-full text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--dark)" }}>
                  Submit feedback
                </button>
              </>
            ) : null}
          </div>
        )}

        {ratingSubmitted && (
          <div className="rounded-[14px] p-4 text-center" style={{ background: "rgba(13,159,95,0.08)" }}>
            <span className="text-[14px] font-semibold" style={{ color: "var(--emerald)" }}>Thanks for the feedback!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/orders" className="flex-1 h-12 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ background: "var(--dark)" }}>
            Track order
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
          </Link>
          <Link href="/menu" className="flex-1 h-12 rounded-full text-[15px] font-bold flex items-center justify-center active:scale-[0.97] transition-transform" style={{ background: "var(--sand)", color: "var(--text)" }}>
            Order more
          </Link>
        </div>

        {/* Office connect — only for non-connected users */}
        {!officeConnected && isConfirmed && (
          <div className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--text)" }}>Want free delivery next time?</h3>
            <p className="text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>Connect your office code</p>
            {officeConnectError && <p className="text-[12px] mb-2" style={{ color: "var(--coral)" }}>{officeConnectError}</p>}
            <div className="flex gap-2">
              <input type="text" value={officeCodeInput} onChange={(e) => setOfficeCodeInput(e.target.value)} placeholder="e.g. STERL-001" className="flex-1 px-4 h-11 rounded-[10px] text-[14px] uppercase focus:outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
              <button type="button" onClick={handleConnectOffice} disabled={officeConnectLoading} className="h-11 px-5 rounded-[10px] text-[14px] font-bold text-white disabled:opacity-50 cursor-pointer" style={{ background: "var(--dark)" }}>{officeConnectLoading ? "..." : "Connect"}</button>
            </div>
          </div>
        )}

        {officeConnected && (
          <div className="rounded-[14px] p-3 flex items-center gap-2" style={{ background: "rgba(13,159,95,0.08)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            <span className="text-[13px] font-semibold" style={{ color: "var(--emerald)" }}>Office connected — free delivery next time</span>
          </div>
        )}

        {/* Pool credits note */}
        {isConfirmed && (
          <div className="rounded-[14px] p-3 flex items-start gap-2.5" style={{ background: "rgba(13,159,95,0.08)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
            <p className="text-[13px]" style={{ color: "var(--emerald)" }}>
              Pool credits will be applied automatically when the pool settles
            </p>
          </div>
        )}

        {/* Share */}
        <button type="button" onClick={handleShare} className="w-full rounded-[20px] p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all text-left" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: shareCopied ? "rgba(13,159,95,0.1)" : "rgba(232,96,76,0.1)" }}>
            {shareCopied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            )}
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{shareCopied ? "Link copied!" : "Share with colleagues"}</p>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{shareCopied ? "Paste it anywhere" : "₦0 delivery for your office"}</p>
          </div>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
