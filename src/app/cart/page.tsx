"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/customer";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

type FulfillmentMode = "office" | "delivery";

export default function CartPage() {
  const cart = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [officeId, setOfficeId] = useState<string | undefined>();
  const [officeName, setOfficeName] = useState("");
  const [collectionPoint, setCollectionPoint] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentMode>("office");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [editContact, setEditContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderingClosed, setOrderingClosed] = useState(false);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [poolData, setPoolData] = useState<{ officeOrderCount: number; meals: Record<string, { poolPrice: number; basePrice: number; savings: number }> }>({ officeOrderCount: 0, meals: {} });
  const [creditBalance, setCreditBalance] = useState(0);
  const [deliveryPref, setDeliveryPref] = useState<{ option: "pickup" | "delivery"; lat: number; lng: number; fee: number } | null>(null);
  const [realDeliveryFee, setRealDeliveryFee] = useState<number | null>(null);
  const [deliveryToggle, setDeliveryToggle] = useState<"pickup" | "delivery">("pickup");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Load delivery preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-delivery-pref");
      if (stored) {
        const pref = JSON.parse(stored);
        setDeliveryPref(pref);
        setDeliveryToggle(pref.option || "pickup");
      }
    } catch {}
  }, []);

  // Fetch delivery estimate
  useEffect(() => {
    if (deliveryToggle !== "delivery" || cart.items.length === 0) { setRealDeliveryFee(null); return; }
    let lat: number | undefined, lng: number | undefined;
    if (deliveryPref?.lat && deliveryPref?.lng) { lat = deliveryPref.lat; lng = deliveryPref.lng; }
    else {
      try {
        const stored = localStorage.getItem("chopdrop-customer");
        if (stored) { const p = JSON.parse(stored); if (p.latitude && p.longitude) { lat = p.latitude; lng = p.longitude; } }
      } catch {}
    }
    if (!lat || !lng) return;
    const productId = cart.items[0].dailyMenuId.replace("instant-", "");
    fetch(`/api/delivery-estimate?productId=${productId}&lat=${lat}&lng=${lng}`)
      .then(r => r.json()).then(d => { if (d.success) setRealDeliveryFee(d.data.fullFee); }).catch(() => {});
  }, [deliveryToggle, cart.items, deliveryPref]);

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) {
      setDeliveryAddress(profile.deliveryAddress || "");
      if (profile.officeId) { setOfficeId(profile.officeId); setOfficeName(profile.officeName || ""); setCollectionPoint(profile.collectionPoint || ""); setFulfillment("office"); }
    }
    fetch("/api/menu/status").then(r => r.json()).then(d => { if (d.allExpired) setOrderingClosed(true); }).catch(() => {});
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setIsAuthenticated(!!d.success);
      if (d.success && d.data) {
        const u = d.data;
        if (u.firstName) setCustomerName(`${u.firstName} ${u.lastName || ""}`);
        if (u.phone) setCustomerPhone(u.phone);
        if (u.office?.id) { setOfficeId(u.office.id); setOfficeName(u.office.name || ""); setCollectionPoint(u.office.collectionPoint || ""); setFulfillment("office"); }
      } else { setCustomerName(""); setCustomerPhone(""); }
      if (d.success) { fetch("/api/orders/mine").then(r => r.json()).then(od => { if (od.success && (!od.data || od.data.length === 0)) setIsFirstOrder(true); }).catch(() => {}); }
    }).catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!officeId) return;
    fetch(`/api/pool-price?officeId=${officeId}`).then(r => r.json()).then(d => { if (d.success && d.data) setPoolData(d.data); }).catch(() => {});
  }, [officeId]);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.success && d.data) setCreditBalance(d.data.balance); }).catch(() => {});
  }, []);

  const deliveryFee = deliveryToggle === "delivery" ? (realDeliveryFee !== null ? realDeliveryFee : (deliveryPref?.fee || 0)) : 0;
  const packCount = Math.max(1, cart.items.filter(i => i.isPackItem).reduce((s, i) => s + i.quantity, 0) || Math.ceil(cart.items.filter(i => !i.isPackItem).length / 3) || 1);
  const serviceFee = packCount * 15000;
  const creditsToApply = Math.min(creditBalance, cart.subtotal + deliveryFee + serviceFee);
  const orderTotal = cart.subtotal + deliveryFee + serviceFee - creditsToApply;
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

  function validateBeforePay(): boolean {
    if (!customerName.trim() || !customerPhone.trim()) { setError("Name and phone required"); setEditContact(true); return false; }
    const phoneClean = customerPhone.trim().replace(/\s/g, "");
    if (!/^(\+?234|0)\d{10}$/.test(phoneClean)) { setError("Enter a valid Nigerian phone number (e.g. 08012345678)"); setEditContact(true); return false; }
    if (cart.items.length === 0) return false;
    if (deliveryToggle === "delivery" && !deliveryAddress.trim()) { setError("Enter a delivery address"); return false; }
    return true;
  }

  async function handlePay() {
    setError(null); setLoading(true); setConfirmOpen(false);
    saveCustomerProfile({ name: customerName.trim(), phone: customerPhone.trim(), email: "", deliveryAddress: deliveryAddress.trim(), preferredFulfillment: "DELIVERY", officeId, officeName, collectionPoint });
    try {
      const items = cart.items.map(i => ({ productId: i.dailyMenuId, quantity: i.quantity, price: i.price }));
      const payload: Record<string, unknown> = { items, deliveryOption: deliveryToggle };
      if (deliveryToggle === "delivery" && deliveryPref?.lat && deliveryPref?.lng) {
        payload.lat = deliveryPref.lat; payload.lng = deliveryPref.lng;
      } else if (deliveryToggle === "delivery") {
        try {
          const stored = localStorage.getItem("chopdrop-customer");
          if (stored) { const p = JSON.parse(stored); if (p.latitude && p.longitude) { payload.lat = p.latitude; payload.lng = p.longitude; } }
        } catch {}
      }
      const res = await fetch("/api/orders/instant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Something went wrong"); setLoading(false); return; }
      if (data.data.authorizationUrl) {
        // Save cart to sessionStorage so we can restore on failed payment
        sessionStorage.setItem("chopdrop-cart-backup", JSON.stringify(cart.items));
        cart.clearCart();
        window.location.href = data.data.authorizationUrl;
      } else if (orderTotal === 0) {
        // Zero-amount order (credits covered everything)
        cart.clearCart();
        window.location.href = `/order/confirmation/${data.data.orderCode || "success"}`;
      } else { setError("Payment failed. Try again."); setLoading(false); }
    } catch { setError("Network error. Check your connection and try again."); setLoading(false); }
  }

  function cleanName(name: string): string {
    return name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "");
  }

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-48" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Checkout</h1>
          <p className="text-[14px] mt-0.5" style={{ color: "var(--text-muted)" }}>{portionCount} item{portionCount !== 1 ? "s" : ""} · {formatNaira(cart.subtotal)}</p>
        </div>
        <Link href="/discover" className="text-[14px] font-bold" style={{ color: "var(--coral)" }}>+ Add more</Link>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-6">
          <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Your plate is empty</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-muted)" }}>Browse meals and add something tasty</p>
          <Link href="/discover" className="h-[50px] px-6 rounded-[12px] text-[14px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse deals</Link>
        </div>
      ) : (
        <div className="px-5 space-y-5">
          {/* ═══ ITEMS ═══ */}
          {(() => {
            const packedIds = [...new Set(cart.items.filter(i => i.packId).map(i => i.packId!))];
            const unpackedItems = cart.items.filter(i => !i.packId);

            const renderItem = (item: typeof cart.items[0], showBorder: boolean) => (
              <div key={item.dailyMenuId} className={`flex items-center gap-3 py-3 ${showBorder ? "border-t" : ""}`} style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold leading-tight" style={{ color: item.isPackItem ? "var(--text-secondary)" : "var(--text)" }}>{cleanName(item.name)}</h3>
                  {item.restaurantName && !item.isPackItem && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.restaurantName}</p>}
                  <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(item.price * item.quantity)}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"} onClick={() => cart.changeQuantity(item.dailyMenuId, -1)}
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center press-feedback"
                    style={{ background: item.quantity === 1 ? "var(--coral-soft)" : "var(--sand)" }}>
                    {item.quantity === 1 ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14H6L5 6" /></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                    )}
                  </button>
                  <span className="text-[13px] font-bold tabular-nums w-5 text-center" style={{ color: "var(--text)" }}>{item.quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => cart.addItem(item)}
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
            );

            return (
              <>
                {packedIds.map((packId, packIdx) => {
                  const packItems = cart.items.filter(i => i.packId === packId && !i.isPackItem);
                  const packContainer = cart.items.find(i => i.packId === packId && i.isPackItem);
                  const packTotal = packItems.reduce((s, i) => s + i.price * i.quantity, 0) + (packContainer ? packContainer.price * packContainer.quantity : 0);
                  return (
                    <section key={packId} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "var(--sand)" }}>
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                          <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Pack {packIdx + 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(packTotal)}</span>
                          <button type="button" onClick={() => cart.removePack(packId)} className="text-[11px] font-bold press-feedback" style={{ color: "var(--coral)" }}>Remove</button>
                        </div>
                      </div>
                      <div className="px-4">
                        {packItems.map((item, idx) => renderItem(item, idx > 0))}
                        {packContainer && renderItem(packContainer, packItems.length > 0)}
                        {!packContainer && (
                          <div className="py-2.5 flex items-center gap-1.5" style={{ borderTop: packItems.length > 0 ? "1px solid var(--border)" : "none" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                            <span className="text-[12px] font-semibold" style={{ color: "var(--coral)" }}>No pack selected. Add a pack size</span>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
                {unpackedItems.length > 0 && (
                  <section className="rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    {unpackedItems.map((item, idx) => renderItem(item, idx > 0))}
                  </section>
                )}
              </>
            );
          })()}

          {/* ═══ NOT AUTHENTICATED ═══ */}
          {isAuthenticated === false && (
            <section className="rounded-[16px] p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Log in to checkout</h2>
              <p className="text-[14px] mb-5" style={{ color: "var(--text-secondary)" }}>Verify your phone to complete your order</p>
              <a href="/auth?returnTo=/cart" className="w-full h-[50px] rounded-[12px] text-[15px] font-bold text-white flex items-center justify-center" style={{ background: "var(--coral)" }}>
                Log in with phone number
              </a>
            </section>
          )}

          {/* ═══ CONTACT EDITING (shown when validation fails) ═══ */}
          {editContact && isAuthenticated && (
            <section className="rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--coral)" }}>Your details</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="cart-name" className="text-[12px] font-bold block mb-1" style={{ color: "var(--text)" }}>Name</label>
                  <input id="cart-name" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name"
                    className="w-full h-[44px] px-3.5 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                    style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
                </div>
                <div>
                  <label htmlFor="cart-phone" className="text-[12px] font-bold block mb-1" style={{ color: "var(--text)" }}>Phone</label>
                  <input id="cart-phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08012345678" autoComplete="tel"
                    className="w-full h-[44px] px-3.5 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                    style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
                </div>
              </div>
            </section>
          )}

          {/* ═══ FULFILLMENT ═══ */}
          <section className="rounded-[16px] p-4" data-delivery-section style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>How do you want it?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeliveryToggle("pickup")}
                className="flex-1 h-[44px] rounded-[12px] flex items-center justify-center text-[13px] font-bold press-feedback"
                style={{ background: deliveryToggle === "pickup" ? "var(--card)" : "transparent", border: deliveryToggle === "pickup" ? "1.5px solid var(--text)" : "1.5px solid var(--border)", color: deliveryToggle === "pickup" ? "var(--text)" : "var(--text-muted)" }}>
                Pickup (free)
              </button>
              <button type="button" onClick={() => setDeliveryToggle("delivery")}
                className="flex-1 h-[44px] rounded-[12px] flex items-center justify-center text-[13px] font-bold press-feedback"
                style={{ background: deliveryToggle === "delivery" ? "var(--card)" : "transparent", border: deliveryToggle === "delivery" ? "1.5px solid var(--text)" : "1.5px solid var(--border)", color: deliveryToggle === "delivery" ? "var(--text)" : "var(--text-muted)" }}>
                Delivery {deliveryFee > 0 ? `(${formatNaira(deliveryFee)})` : ""}
              </button>
            </div>
            {/* Delivery address input — was missing */}
            {deliveryToggle === "delivery" && (
              <div className="mt-3">
                <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter delivery address"
                  aria-label="Delivery address" autoComplete="street-address"
                  className="w-full h-[44px] px-3.5 rounded-[12px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                  style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
                {deliveryFee === 0 && !deliveryPref && !deliveryAddress.trim() && (
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>Enter your address above for a delivery quote</p>
                )}
                {deliveryFee === 0 && deliveryAddress.trim() && !deliveryPref && (
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--emerald)" }}>Delivery fee will be confirmed at checkout</p>
                )}
              </div>
            )}
          </section>

          {/* ═══ ORDER SUMMARY ═══ */}
          <section className="rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Subtotal ({portionCount} item{portionCount !== 1 ? "s" : ""})</span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Delivery</span>
                <span className="font-bold" style={{ color: deliveryFee === 0 ? "var(--emerald)" : "var(--text)" }}>{deliveryFee === 0 ? "FREE" : formatNaira(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Service fee <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>({packCount} {packCount === 1 ? "pack" : "packs"})</span></span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(serviceFee)}</span>
              </div>
              {creditsToApply > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--emerald)" }}>Credits applied</span>
                  <span className="font-bold" style={{ color: "var(--emerald)" }}>-{formatNaira(creditsToApply)}</span>
                </div>
              )}
              {/* Pool savings callout */}
              {cart.items.some(item => {
                const key = item.realDailyMenuId || item.dailyMenuId;
                return poolData?.meals?.[key]?.savings > 0;
              }) && (() => {
                const totalSaved = cart.items.reduce((sum, item) => {
                  const key = item.realDailyMenuId || item.dailyMenuId;
                  const pool = poolData?.meals?.[key];
                  return sum + (pool ? pool.savings * item.quantity : 0);
                }, 0);
                return totalSaved > 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-[12px]" style={{ background: "var(--emerald-soft)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                    <span className="text-[13px] font-bold" style={{ color: "var(--emerald)" }}>Saving {formatNaira(totalSaved)} with pool pricing</span>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: "2px solid var(--border)" }}>
                <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Total</span>
                <span className="text-[22px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(orderTotal)}</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ═══ STICKY CTA ═══ */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-[52px] left-0 right-0 z-40 px-5 py-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-[428px] mx-auto">
            {orderingClosed ? (
              <div className="text-center">
                <p className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>Orders open at 7:00 AM. Your cart is saved.</p>
                <Link href="/discover" className="w-full h-[50px] rounded-[12px] text-[14px] font-bold flex items-center justify-center" style={{ background: "var(--sand)", color: "var(--text)" }}>
                  Back to menu
                </Link>
              </div>
            ) : (
              <>
                {error && <div className="text-[12px] font-bold p-2.5 rounded-[10px] mb-2 text-center" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>{error}</div>}
                <button type="button"
                  onClick={() => {
                    if (isAuthenticated === false) { window.location.href = "/auth?returnTo=/cart"; return; }
                    if (!validateBeforePay()) return;
                    setConfirmOpen(true);
                  }}
                  disabled={loading}
                  className="w-full h-[50px] rounded-[12px] text-[15px] font-bold text-white flex items-center justify-between px-5 press-feedback disabled:opacity-50"
                  style={{ background: isAuthenticated === false ? "var(--dark)" : "var(--coral)" }}>
                  <span>{loading ? "Processing\u2026" : isAuthenticated === false ? "Log in to pay" : "Pay now"}</span>
                  <span className="text-[15px] font-extrabold tabular-nums">{formatNaira(orderTotal)}</span>
                </button>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Money-back guarantee</span>
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--border)" }}>\u00B7</span>
                  <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Paystack secured</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ PAYMENT CONFIRMATION SHEET ═══ */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Confirm payment" onClick={() => setConfirmOpen(false)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="absolute bottom-0 left-0 right-0 sheet-enter" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-[428px] mx-auto rounded-t-[22px] px-5 pt-5 pb-8" style={{ background: "var(--card)" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
              <h3 className="text-[18px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Confirm your order</h3>

              <div className="mt-4 rounded-[12px] p-4" style={{ background: "var(--sand)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Items</span>
                  <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{portionCount} item{portionCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Delivery</span>
                  <span className="text-[13px] font-bold" style={{ color: deliveryFee === 0 ? "var(--emerald)" : "var(--text)" }}>{deliveryFee === 0 ? "Pickup (free)" : formatNaira(deliveryFee)}</span>
                </div>
                {creditsToApply > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px]" style={{ color: "var(--emerald)" }}>Credits</span>
                    <span className="text-[13px] font-bold" style={{ color: "var(--emerald)" }}>-{formatNaira(creditsToApply)}</span>
                  </div>
                )}
                <div className="h-px my-2" style={{ background: "var(--border)" }} />
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-extrabold" style={{ color: "var(--text)" }}>You pay</span>
                  <span className="text-[20px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{formatNaira(orderTotal)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <p className="text-[12px] font-bold" style={{ color: "var(--emerald)" }}>Secured by Paystack. Money-back guarantee.</p>
              </div>

              <button type="button" disabled={loading} onClick={handlePay}
                className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white press-feedback mt-5 disabled:opacity-50"
                style={{ background: "var(--coral)" }}>
                {loading ? "Processing\u2026" : `Pay ${formatNaira(orderTotal)}`}
              </button>
              <button type="button" onClick={() => setConfirmOpen(false)} className="w-full h-[44px] flex items-center justify-center text-[13px] font-bold press-feedback mt-2" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
