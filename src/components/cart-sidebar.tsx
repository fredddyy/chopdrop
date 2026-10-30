"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/utils";

export function CartSidebar() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="hidden lg:block w-[360px] flex-shrink-0">
        <div className="sticky top-20 rounded-[16px] p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="font-bold text-[16px] mb-4" style={{ color: "var(--text)" }}>Your order</h3>
          <div className="flex flex-col items-center py-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--sand)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            </div>
            <p className="text-[13px] text-center" style={{ color: "var(--text-muted)" }}>Add items from the menu to start your order</p>
          </div>
        </div>
      </div>
    );
  }

  const portionCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const packCount = Math.max(1, cart.items.filter(i => i.isPackItem).reduce((s, i) => s + i.quantity, 0) || Math.ceil(cart.items.filter(i => !i.isPackItem).length / 3) || 1);
  const serviceFee = packCount * 15000;

  return (
    <div className="hidden lg:block w-[360px] flex-shrink-0">
      <div className="sticky top-20 rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[16px]" style={{ color: "var(--text)" }}>Your order</h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-[6px]" style={{ color: "var(--text-muted)", background: "var(--sand)" }}>{portionCount} item{portionCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-3 max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {cart.items.map((item, idx) => (
            <div key={item.dailyMenuId} className={`flex items-center gap-3 py-2.5 ${idx > 0 ? "" : ""}`} style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-[10px] overflow-hidden" style={{ background: "var(--sand)" }}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                    </div>
                  )}
                </div>
                <span className="absolute -top-1 -left-1 text-[8px] font-bold text-white w-4 h-4 rounded-[4px] flex items-center justify-center" style={{ background: "var(--dark)" }}>{item.quantity}x</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[12px] font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>{item.name}</h4>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{item.restaurantName}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-bold text-[13px] tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(item.price * item.quantity)}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => cart.changeQuantity(item.dailyMenuId, -1)}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "var(--sand)" }}
                  >
                    {item.quantity === 1 ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--text-muted)" }}><path d="M3 6h18M8 6V4h8v2M5 6v14h14V6" /><path d="M10 11v6M14 11v6" /></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--text-secondary)" }}><path d="M5 12h14" /></svg>
                    )}
                  </button>
                  <span className="text-[11px] font-bold min-w-[18px] text-center tabular-nums" style={{ color: "var(--text)" }}>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => cart.addItem({ ...item })}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "var(--sand)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--text-secondary)" }}><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--sand)" }}>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{formatNaira(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span style={{ color: "var(--text-secondary)" }}>Order handling</span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{formatNaira(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span style={{ color: "var(--text-secondary)" }}>Delivery</span>
            <span className="font-semibold" style={{ color: "var(--emerald)" }}>Free</span>
          </div>
          <div className="h-px my-2" style={{ background: "var(--border)" }} />
          <div className="flex justify-between text-[13px]">
            <span className="font-bold" style={{ color: "var(--text)" }}>Total</span>
            <span className="font-bold text-[15px] tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(cart.subtotal + serviceFee)}</span>
          </div>
        </div>

        {/* Checkout button */}
        <div className="px-5 pb-5 pt-3">
          <Link
            href="/cart"
            className="block w-full text-white text-center font-bold text-[14px] py-3.5 rounded-[12px] active:scale-[0.98] transition-all"
            style={{ background: "var(--coral)" }}
          >
            Checkout · {formatNaira(cart.subtotal + serviceFee)}
          </Link>
        </div>
      </div>
    </div>
  );
}
