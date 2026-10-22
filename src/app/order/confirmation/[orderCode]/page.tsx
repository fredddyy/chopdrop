"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface OrderData {
  id: string; orderCode: string; status: string; paymentStatus: string;
  customerName: string; fulfillmentType: string; deliveryAddress: string | null;
  quantity: number; totalAmount: number;
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
      attempts++; if (attempts > 10) { clearInterval(interval); return; }
      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();
      if (data.success && data.data.paymentStatus === "SUCCESS") { setOrder(data.data); clearInterval(interval); }
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
    const text = `I just ordered lunch with ChopDrop — fresh food at the office, ₦0 delivery. Try it: https://chopdrop-app.vercel.app`;
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
        {isConfirmed ? (
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
            <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>This usually takes a few seconds</p>
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
