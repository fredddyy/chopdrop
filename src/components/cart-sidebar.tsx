"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/utils";

export function CartSidebar() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="hidden lg:block w-[360px] flex-shrink-0">
        <div className="sticky top-20 bg-white rounded-2xl border border-black/[0.06] p-6">
          <h3 className="font-display font-bold text-[16px] text-[#1a1a1a] mb-4">Your order</h3>
          <div className="flex flex-col items-center py-8">
            <div className="w-14 h-14 bg-[#f5f5f3] rounded-full flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            </div>
            <p className="text-[13px] text-[#9ca3af] text-center">Add items from the menu to start your order</p>
          </div>
        </div>
      </div>
    );
  }

  const portionCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const serviceFee = Math.min(50000, Math.max(10000, Math.round(cart.subtotal * 0.05)));

  return (
    <div className="hidden lg:block w-[360px] flex-shrink-0">
      <div className="sticky top-20 bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-black/[0.04]">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-[16px] text-[#1a1a1a]">Your order</h3>
            <span className="text-[11px] font-medium text-[#9ca3af] bg-[#f5f5f3] px-2 py-0.5 rounded-md">{portionCount} item{portionCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-3 max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {cart.items.map((item, idx) => (
            <div key={item.dailyMenuId} className={`flex items-center gap-3 py-2.5 ${idx > 0 ? "border-t border-[#f0efeb]" : ""}`}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f5f5f3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[14px]">🍽️</div>}
                </div>
                <span className="absolute -top-1 -left-1 text-[8px] font-bold text-white bg-[#0f4030] w-4 h-4 rounded-md flex items-center justify-center">{item.quantity}x</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[12px] font-semibold text-[#1a1a1a] leading-tight truncate">{item.name}</h4>
                <p className="text-[10px] text-[#9ca3af]">{item.restaurantName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-display font-bold text-[13px] text-[#1a1a1a]">{formatNaira(item.price * item.quantity)}</span>
                <button
                  type="button"
                  onClick={() => cart.removeItem(item.dailyMenuId)}
                  className="w-5 h-5 rounded-full bg-[#f5f5f3] hover:bg-[#fee2e2] flex items-center justify-center transition-colors group"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-[#9ca3af] group-hover:text-[#f05f4b]"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-5 py-3 border-t border-black/[0.04] bg-[#fafaf8]">
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-[#6b7280]">Subtotal</span>
            <span className="font-semibold text-[#1a1a1a]">{formatNaira(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-[#6b7280]">Service fee</span>
            <span className="font-semibold text-[#1a1a1a]">{formatNaira(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-[#6b7280]">Delivery</span>
            <span className="font-semibold text-[#22c55e]">Free</span>
          </div>
          <div className="h-px bg-black/[0.06] my-2" />
          <div className="flex justify-between text-[13px]">
            <span className="font-bold text-[#1a1a1a]">Total</span>
            <span className="font-display font-bold text-[15px] text-[#1a1a1a]">{formatNaira(cart.subtotal + serviceFee)}</span>
          </div>
        </div>

        {/* Checkout button */}
        <div className="px-5 pb-5 pt-3">
          <Link
            href="/cart"
            className="block w-full bg-[#f05f4b] text-white text-center font-bold text-[14px] py-3.5 rounded-xl shadow-[0_2px_10px_rgba(240,95,75,0.3)] hover:bg-[#d95038] active:scale-[0.98] transition-all"
          >
            Checkout · {formatNaira(cart.subtotal + serviceFee)}
          </Link>
        </div>
      </div>
    </div>
  );
}
