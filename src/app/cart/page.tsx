"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/customer";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

type FulfillmentMode = "office" | "delivery" | "pickup";

export default function CartPage() {
  const cart = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [officeId, setOfficeId] = useState<string | undefined>();
  const [officeName, setOfficeName] = useState("");
  const [collectionPoint, setCollectionPoint] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentMode>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) {
      setCustomerName(profile.name);
      setCustomerPhone(profile.phone);
      setDeliveryAddress(profile.deliveryAddress || "");
      if (profile.officeId) {
        setOfficeId(profile.officeId);
        setOfficeName(profile.officeName || "");
        setCollectionPoint(profile.collectionPoint || "");
        setFulfillment("office");
      }
    }
  }, []);

  const DELIVERY_FEE = 100000;
  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const orderTotal = cart.subtotal + deliveryFee;
  const MIN_BASKET = 250000;
  const belowMinimum = cart.subtotal > 0 && cart.subtotal < MIN_BASKET;
  const shortfall = MIN_BASKET - cart.subtotal;
  const portionCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  async function handleConnectOffice() {
    if (!codeInput.trim()) return;
    setCodeLoading(true); setCodeError("");
    try {
      const res = await fetch(`/api/offices/lookup?code=${encodeURIComponent(codeInput.trim())}`);
      const data = await res.json();
      if (data.success) {
        setOfficeId(data.data.id); setOfficeName(data.data.name); setCollectionPoint(data.data.collectionPoint); setFulfillment("office"); setCodeInput("");
        const profile = getCustomerProfile();
        if (profile) saveCustomerProfile({ ...profile, officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint });
      } else { setCodeError(data.error || "Office not found"); }
    } catch { setCodeError("Network error"); }
    setCodeLoading(false);
  }

  async function handlePay() {
    if (!customerName.trim() || !customerPhone.trim()) { setError("Name and phone are required"); return; }
    if (cart.items.length === 0) return;
    if (belowMinimum) { setError(`Add ${formatNaira(shortfall)} more. Min order ${formatNaira(MIN_BASKET)}.`); return; }
    if (fulfillment === "delivery" && !deliveryAddress.trim()) { setError("Enter your delivery address"); return; }

    setError(null); setLoading(true);
    saveCustomerProfile({ name: customerName.trim(), phone: customerPhone.trim(), email: "", deliveryAddress: deliveryAddress.trim(), preferredFulfillment: fulfillment === "delivery" ? "DELIVERY" : "PICKUP", officeId, officeName, collectionPoint });

    // Create an order for each unique dailyMenuId in the cart
    // For MVP: submit the first valid combo item, or the first item if all are individual
    // Individual items from restaurant pages have composite IDs like "dmid-itemid"
    const firstCombo = cart.items.find((i) => !i.dailyMenuId.includes("-") || i.dailyMenuId.split("-").length <= 2);
    const primaryItem = firstCombo || cart.items[0];
    const realDailyMenuId = primaryItem.dailyMenuId.split("-").length > 2
      ? primaryItem.dailyMenuId.split("-").slice(0, -1).join("-")
      : primaryItem.dailyMenuId.includes("-") && primaryItem.customItems?.length
      ? primaryItem.dailyMenuId.split("-")[0]
      : primaryItem.dailyMenuId;

    // Aggregate: total quantity across all items, collect all custom items
    const totalQuantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const allCustomItems = cart.items.filter((i) => i.customItems?.length).flatMap((i) => i.customItems || []);

    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dailyMenuId: realDailyMenuId, officeId: fulfillment === "office" ? officeId : undefined, customerName: customerName.trim(), customerPhone: customerPhone.trim(), customerEmail: "", fulfillmentType: fulfillment === "delivery" ? "DELIVERY" : "PICKUP", deliveryAddress: fulfillment === "delivery" ? deliveryAddress.trim() : undefined, quantity: totalQuantity, items: allCustomItems.length > 0 ? allCustomItems : undefined }) });
      const data = await res.json();
      if (!data.success) { if (data.error === "Menu item not found") { setError("Cart contains expired items. Please clear and re-add from the menu."); cart.clearCart(); } else { setError(data.error || "Something went wrong"); } setLoading(false); return; }
      cart.clearCart(); window.location.href = data.data.authorizationUrl;
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full pb-40 md:pb-10">
      {/* Header */}
      <div className="px-5 md:px-10 pt-7 pb-4">
        <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Secure checkout</div>
        <h1 className="font-display font-bold text-[26px] tracking-[-0.04em] mt-1">Review your lunch drop</h1>
        <p className="text-ink-soft text-[12px] mt-1">Confirm your meals and how you&apos;d like to receive them.</p>
      </div>

      {/* Progress */}
      <div className="px-5 md:px-10 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center text-white text-[10px] font-bold">1</div>
            <div><strong className="text-[11px] block">Review order</strong><small className="text-ink-soft text-[9px]">Meals &amp; delivery</small></div>
          </div>
          <div className="flex-1 h-px bg-line" />
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-6 h-6 border border-line rounded-full flex items-center justify-center text-ink-soft text-[10px] font-bold">2</div>
            <div><strong className="text-[11px] block">Secure payment</strong><small className="text-ink-soft text-[9px]">Powered by Paystack</small></div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-10 grid md:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Section 1: Meals */}
          <div className="bg-paper border border-line rounded-[16px] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-ink rounded-full flex items-center justify-center text-white text-[10px] font-bold">1</div>
                <div>
                  <div className="font-display font-bold text-[15px]">Your meals</div>
                  <small className="text-ink-soft text-[10px]">{portionCount} {portionCount === 1 ? "portion" : "portions"} from today&apos;s drop</small>
                </div>
              </div>
              <Link href="/menu" className="text-green text-[10px] font-bold hover:underline">Add more</Link>
            </div>

            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-ink-soft">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                <strong className="text-ink text-sm">Your drop is empty</strong>
                <Link href="/menu" className="mt-3 bg-coral text-white text-xs font-bold px-4 py-2 rounded-[10px]">Browse meals</Link>
              </div>
            ) : cart.items.map((item) => (
              <div key={item.dailyMenuId} className="flex gap-3 py-3.5 border-b border-line last:border-b-0 items-center">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-coral text-[8px] font-extrabold uppercase tracking-[0.08em]">{item.restaurantName}</div>
                  <strong className="text-[13px] block mt-0.5 leading-tight">{item.name}</strong>
                </div>
                <div className="flex items-center border border-line rounded-[8px] flex-shrink-0">
                  <button type="button" onClick={() => cart.changeQuantity(item.dailyMenuId, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-cream"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /></svg></button>
                  <strong className="w-5 text-center text-[11px]">{item.quantity}</strong>
                  <button type="button" onClick={() => cart.changeQuantity(item.dailyMenuId, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-cream"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg></button>
                </div>
                <strong className="font-display text-[13px] min-w-[60px] text-right">{formatNaira(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          {/* Section 2: Fulfillment */}
          {cart.items.length > 0 && (
            <div className="bg-paper border border-line rounded-[16px] p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 bg-ink rounded-full flex items-center justify-center text-white text-[10px] font-bold">2</div>
                <div>
                  <div className="font-display font-bold text-[15px]">Choose fulfillment</div>
                  <small className="text-ink-soft text-[10px]">How should we get your lunch to you?</small>
                </div>
              </div>

              <div className="space-y-2">
                {/* Office Batch */}
                <button type="button" onClick={() => setFulfillment("office")} className={`w-full text-left p-3 rounded-[12px] border-2 transition-all ${fulfillment === "office" ? "border-green bg-green-soft/40" : "border-line hover:border-ink-soft/20"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 mt-0.5 ${fulfillment === "office" ? "border-green" : "border-ink-soft/40"}`}>
                      {fulfillment === "office" && <div className="w-[9px] h-[9px] bg-green rounded-full" />}
                    </div>
                    <div className="w-8 h-8 bg-green-soft text-green rounded-[8px] flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><strong className="text-[12px]">Office Batch Drop</strong><span className="bg-green-soft text-green text-[7px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">Best value</span></div>
                      {officeId ? (
                        <p className="text-ink-soft text-[10px] mt-0.5">{officeName} · {collectionPoint}</p>
                      ) : (
                        <p className="text-ink-soft text-[10px] mt-0.5">Enter your office code to join</p>
                      )}
                      <div className="flex items-center gap-1 text-ink-soft text-[9px] mt-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                        Arrives together, 12:30–1:30 PM
                      </div>
                    </div>
                    <strong className="text-green text-[12px] flex-shrink-0">FREE</strong>
                  </div>
                  {fulfillment === "office" && !officeId && (
                    <div className="mt-3 ml-10">
                      <div className="flex gap-2">
                        <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="e.g. NORTH-241" className="flex-1 px-2.5 py-2 border border-line rounded-[8px] text-[11px] bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 uppercase" onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
                        <button type="button" onClick={handleConnectOffice} disabled={codeLoading} className="bg-green text-white font-bold px-3 py-2 rounded-[8px] text-[10px] disabled:opacity-50">{codeLoading ? "..." : "Join"}</button>
                      </div>
                      {codeError && <p className="text-coral text-[9px] mt-1">{codeError}</p>}
                    </div>
                  )}
                </button>

                {/* Solo Delivery */}
                <button type="button" onClick={() => setFulfillment("delivery")} className={`w-full text-left p-3 rounded-[12px] border-2 transition-all ${fulfillment === "delivery" ? "border-green bg-green-soft/40" : "border-line hover:border-ink-soft/20"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 mt-0.5 ${fulfillment === "delivery" ? "border-green" : "border-ink-soft/40"}`}>
                      {fulfillment === "delivery" && <div className="w-[9px] h-[9px] bg-green rounded-full" />}
                    </div>
                    <div className="w-8 h-8 bg-red-soft text-coral rounded-[8px] flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-[12px] block">Direct Solo Delivery</strong>
                      <p className="text-ink-soft text-[10px] mt-0.5">Delivered to your own address</p>
                      <p className="text-ink-soft text-[9px] mt-0.5">Separate rider · Enter location below</p>
                    </div>
                    <strong className="text-[12px] flex-shrink-0">{formatNaira(DELIVERY_FEE)}</strong>
                  </div>
                  {fulfillment === "delivery" && (
                    <div className="mt-3 ml-10">
                      <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter your delivery address" className="w-full px-2.5 py-2 border border-line rounded-[8px] text-[11px] bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                    </div>
                  )}
                </button>

                {/* Self Pickup */}
                <button type="button" onClick={() => setFulfillment("pickup")} className={`w-full text-left p-3 rounded-[12px] border-2 transition-all ${fulfillment === "pickup" ? "border-green bg-green-soft/40" : "border-line hover:border-ink-soft/20"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 mt-0.5 ${fulfillment === "pickup" ? "border-green" : "border-ink-soft/40"}`}>
                      {fulfillment === "pickup" && <div className="w-[9px] h-[9px] bg-green rounded-full" />}
                    </div>
                    <div className="w-8 h-8 bg-amber-soft text-[#7d5716] rounded-[8px] flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-[12px] block">Restaurant Self-Pickup</strong>
                      <p className="text-ink-soft text-[10px] mt-0.5">Collect from the restaurant counter</p>
                      <div className="flex items-center gap-1 text-ink-soft text-[9px] mt-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                        Ready from 12:30 PM
                      </div>
                    </div>
                    <strong className="text-[12px] flex-shrink-0">FREE</strong>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Contact */}
          {cart.items.length > 0 && (
            <div className="bg-paper border border-line rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 bg-ink rounded-full flex items-center justify-center text-white text-[10px] font-bold">3</div>
                  <div>
                    <div className="font-display font-bold text-[15px]">Contact details</div>
                    <small className="text-ink-soft text-[10px]">For order and handoff updates</small>
                  </div>
                </div>
                {customerName && <span className="bg-green-soft text-green text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6" /></svg>Saved</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-ink-soft block mb-1">Full name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Amaka Okoro" className="w-full px-3 py-2.5 border border-line rounded-[10px] text-[12px] bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-soft block mb-1">Phone number</label>
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+234 904 570 1943" className="w-full px-3 py-2.5 border border-line rounded-[10px] text-[12px] bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Summary */}
        <aside className="bg-paper border border-line rounded-[16px] p-5 md:sticky md:top-6 hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-[17px]">Order summary</div>
            <span className="bg-green-soft text-green text-[8px] font-extrabold px-2 py-0.5 rounded-full">100% prepaid</span>
          </div>

          <div className="flex justify-between text-[12px] py-2"><span className="text-ink-soft">{portionCount} meal {portionCount !== 1 ? "portions" : "portion"}</span><strong>{formatNaira(cart.subtotal)}</strong></div>
          <div className="flex justify-between text-[12px] py-2"><span className="text-ink-soft">{fulfillment === "office" ? "Office batch drop" : fulfillment === "delivery" ? "Solo delivery" : "Self-pickup"}</span><strong className={deliveryFee === 0 ? "text-green" : ""}>{deliveryFee === 0 ? "FREE" : formatNaira(deliveryFee)}</strong></div>

          {fulfillment === "office" && (
            <div className="flex items-center gap-1.5 bg-green-soft rounded-[8px] px-2.5 py-2 mt-2 text-green text-[10px] font-semibold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>
              You&apos;re saving {formatNaira(DELIVERY_FEE)} with batch delivery
            </div>
          )}

          <div className="flex justify-between items-center border-t border-line mt-3 pt-4"><span className="text-ink-soft text-sm">Total</span><strong className="font-display font-[750] text-[22px] tracking-[-0.03em]">{formatNaira(orderTotal)}</strong></div>

          <div className="flex items-center gap-2 bg-cream rounded-[8px] px-2.5 py-2 mt-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <div><small className="text-ink-soft text-[9px] block">Estimated handoff</small><strong className="text-[11px]">Today, 12:30–1:30 PM</strong></div>
          </div>

          <div className="flex items-center gap-2 bg-cream rounded-[8px] px-2.5 py-2 mt-2 text-ink-soft text-[9px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
            <span>Secure prepaid checkout<br /><strong className="text-ink">Powered by Paystack</strong></span>
          </div>

          {belowMinimum && (
            <div className="bg-amber-soft text-[#7d5716] text-[10px] font-semibold p-2.5 rounded-[8px] mt-2 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>
              Add {formatNaira(shortfall)} more. Min {formatNaira(MIN_BASKET)}.
            </div>
          )}
          {error && <div className="bg-red-soft text-coral text-[10px] font-semibold p-2.5 rounded-[8px] mt-2">{error}</div>}

          <button type="button" onClick={handlePay} disabled={loading || cart.items.length === 0 || belowMinimum} className="w-full mt-3 bg-coral text-white font-bold py-3 rounded-[10px] text-[13px] inline-flex items-center justify-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? "Processing..." : belowMinimum ? `Add ${formatNaira(shortfall)} more` : `Pay ${formatNaira(orderTotal)} securely`}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
          </button>

          <p className="text-ink-soft text-[9px] text-center mt-2.5 flex items-center justify-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green"><path d="m5 12 4 4L19 6" /></svg>
            No cash or pay-on-delivery. Instant confirmation.
          </p>
        </aside>
      </div>

      {/* Mobile sticky bottom bar */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-[60px] left-0 right-0 z-40 px-4 pb-2 md:hidden">
          <div className="max-w-lg mx-auto bg-ink rounded-[14px] px-4 py-3 flex items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <div>
              <span className="text-[#b8c6c1] text-[9px] block">Total</span>
              <strong className="text-white font-display text-[16px]">{formatNaira(orderTotal)}</strong>
            </div>
            <button type="button" onClick={handlePay} disabled={loading || belowMinimum} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-[12px] inline-flex items-center gap-1.5 shadow-sm disabled:opacity-40">
              {loading ? "..." : "Continue to payment"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
