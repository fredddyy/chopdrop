"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

export default function CartPage() {
  const cart = useCart();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [useCredit, setUseCredit] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setWalletBalance(d.data.walletBalance || 0); })
      .catch(() => {});
  }, []);

  const subtotal = cart.subtotal;
  const creditApplied = useCredit ? Math.min(walletBalance, subtotal) : 0;
  const remainingToPay = subtotal - creditApplied;
  const walletAfter = walletBalance - creditApplied;

  // Empty cart
  if (cart.totalItems === 0) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </div>
        <div className="py-16 text-center px-8">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </div>
          <h2 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Your plate is empty</h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Add items from a store to get started.</p>
          <Link href="/discover" className="h-[40px] px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center mt-4 press-feedback" style={{ background: "var(--coral)" }}>Browse deals</Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-40" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Student · Solo Checkout</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>One plate. Your own pace.</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Solo badge ── */}
      <div className="px-5 mt-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-full" style={{ background: "var(--sand)", color: "var(--text-muted)" }}>Solo order · No pool wait</span>
      </div>

      {/* ── Cart items ── */}
      <div className="px-5 mt-5 flex flex-col gap-3">
        {cart.items.map((item) => (
          <div key={item.dailyMenuId} className="flex items-start gap-3">
            <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[16px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold truncate" style={{ color: "#17271F" }}>{item.name}</h4>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.restaurantName} · ★ 4.9</p>
              <p className="text-[14px] font-extrabold tabular-nums mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(item.price)} · {item.quantity} plate{item.quantity !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => cart.changeQuantity(item.dailyMenuId, -1)} className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#17271F" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
              </button>
              <span className="w-[24px] text-center text-[14px] font-extrabold tabular-nums" style={{ color: "#17271F" }}>{item.quantity}</span>
              <button type="button" onClick={() => cart.addItem(item)} className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--coral)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 mt-4 h-px" style={{ background: "var(--border)" }} />

      {/* ── Price summary ── */}
      <div className="px-5 mt-4 flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span style={{ color: "var(--text-muted)" }}>{cart.totalItems} plate{cart.totalItems !== 1 ? "s" : ""} · Individual price</span>
          <span className="font-bold tabular-nums" style={{ color: "#17271F" }}>{fp(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span style={{ color: "var(--text-muted)" }}>Campus pickup</span>
          <span className="font-bold" style={{ color: "var(--emerald)" }}>Free</span>
        </div>
        <div className="flex justify-between text-[15px] font-extrabold mt-1">
          <span style={{ color: "#17271F" }}>Order total</span>
          <span className="tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(subtotal)}</span>
        </div>
      </div>

      {/* ── Wallet credit card ── */}
      {walletBalance > 0 && (
        <div className="px-5 mt-4">
          <div className="p-4 rounded-[16px]" style={{ background: "var(--emerald-soft)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--emerald)" }}>{fp(creditApplied)} credit applied</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--emerald)" }}>Automatically using your wallet balance</p>
              </div>
              <button type="button" onClick={() => setUseCredit(!useCredit)} className="text-[12px] font-bold cursor-pointer" style={{ color: "var(--emerald)" }}>
                {useCredit ? "Remove" : "Apply"}
              </button>
            </div>
            {useCredit && (
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                Prefer to keep it for later? Remove credit and pay the full {fp(subtotal)}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Breakdown with credit ── */}
      {creditApplied > 0 && (
        <div className="px-5 mt-4 flex flex-col gap-2">
          <div className="flex justify-between text-[13px]">
            <span style={{ color: "var(--text-muted)" }}>Food + free pickup</span>
            <span className="font-bold tabular-nums" style={{ color: "#17271F" }}>{fp(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span style={{ color: "var(--emerald)" }}>Wallet store credit</span>
            <span className="font-bold tabular-nums" style={{ color: "var(--emerald)" }}>−{fp(creditApplied)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-extrabold mt-1">
            <span style={{ color: "#17271F" }}>Remaining to pay</span>
            <span className="tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(remainingToPay)}</span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
            Wallet after this order: {fp(walletAfter)}. Points are separate and aren&apos;t being used.
          </p>
        </div>
      )}

      {/* ── Pickup location ── */}
      <div className="px-5 mt-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold" style={{ color: "#17271F" }}>Jaja Hostel Reception</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Free campus pickup · Wait for your ready alert</p>
        </div>
      </div>

      {/* ── Trust card ── */}
      <div className="px-5 mt-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-[14px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="m5 12 4 4L19 6" /></svg>
          <p className="text-[11px] leading-[155%]" style={{ color: "var(--emerald)" }}>
            Your order is confirmed once payment succeeds. No pool needs to fill. Cooking comes next; we&apos;ll alert you when it&apos;s ready.
          </p>
        </div>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[480px] mx-auto">
          <button type="button" disabled={loading}
            className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
            style={{ background: "var(--coral)" }}
            onClick={() => { setLoading(true); alert("Paystack checkout coming soon"); setLoading(false); }}>
            <span>{loading ? "Processing..." : `Pay ${fp(remainingToPay)} with Paystack`}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </button>
          {creditApplied > 0 && (
            <p className="text-[10px] text-center mt-2 tabular-nums" style={{ color: "var(--text-muted)" }}>
              {fp(creditApplied)} credit + {fp(remainingToPay)} cash = {fp(subtotal)} total
            </p>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
