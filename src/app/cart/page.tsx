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

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) {
      setDeliveryAddress(profile.deliveryAddress || "");
      if (profile.officeId) {
        setOfficeId(profile.officeId);
        setOfficeName(profile.officeName || "");
        setCollectionPoint(profile.collectionPoint || "");
        setFulfillment("office");
      }
    }
    fetch("/api/menu/status").then((r) => r.json()).then((d) => { if (d.allExpired) setOrderingClosed(true); }).catch(() => {});
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setIsAuthenticated(!!d.success);
      if (d.success && d.data) {
        const u = d.data;
        if (u.firstName) setCustomerName(`${u.firstName} ${u.lastName || ""}`);
        if (u.phone) setCustomerPhone(u.phone);
        if (u.office?.id) { setOfficeId(u.office.id); setOfficeName(u.office.name || ""); setCollectionPoint(u.office.collectionPoint || ""); setFulfillment("office"); }
      } else { setCustomerName(""); setCustomerPhone(""); }
      if (d.success) {
        fetch("/api/orders/mine").then((r) => r.json()).then((od) => { if (od.success && (!od.data || od.data.length === 0)) setIsFirstOrder(true); }).catch(() => {});
      }
    }).catch(() => setIsAuthenticated(false));
  }, []);

  // Fetch pool pricing + credits when office is known
  useEffect(() => {
    if (!officeId) return;
    fetch(`/api/pool-price?officeId=${officeId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setPoolData(d.data); })
      .catch(() => {});
  }, [officeId]);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setCreditBalance(d.data.balance); })
      .catch(() => {});
  }, []);

  const EXPRESS_FEE = 120000;
  const deliveryFee = fulfillment === "delivery" ? (isFirstOrder ? 0 : EXPRESS_FEE) : 0;
  // Service charge: ₦150 per pack (15000 kobo per pack)
  const packCount = Math.max(1, cart.items.filter(i => i.isPackItem).reduce((s, i) => s + i.quantity, 0) || Math.ceil(cart.items.filter(i => !i.isPackItem).length / 3) || 1);
  const serviceFee = packCount * 15000;
  const creditsToApply = Math.min(creditBalance, cart.subtotal + deliveryFee + serviceFee);
  const orderTotal = cart.subtotal + deliveryFee + serviceFee - creditsToApply;
  const portionCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const hasContact = customerName.trim() && customerPhone.trim();

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
    if (!customerName.trim() || !customerPhone.trim()) { setError("Name and phone required"); setEditContact(true); return; }
    const phoneClean = customerPhone.trim().replace(/\s/g, "");
    if (!/^(\+234|0)\d{10}$/.test(phoneClean)) { setError("Enter a valid Nigerian phone number (e.g. 08012345678)"); setEditContact(true); return; }
    if (cart.items.length === 0) return;
    if (fulfillment === "office" && !officeId && !isFirstOrder) { setError("Enter your group code for free delivery"); return; }
    if (fulfillment === "delivery" && !deliveryAddress.trim()) { setError("Enter delivery address"); return; }
    setError(null); setLoading(true);
    saveCustomerProfile({ name: customerName.trim(), phone: customerPhone.trim(), email: "", deliveryAddress: deliveryAddress.trim(), preferredFulfillment: "DELIVERY", officeId, officeName, collectionPoint });
    const primaryItem = cart.items[0];
    const realDailyMenuId = primaryItem.realDailyMenuId || primaryItem.dailyMenuId;
    const totalQuantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const allCustomItems = cart.items.filter((i) => i.customItems?.length).flatMap((i) => i.customItems || []);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dailyMenuId: realDailyMenuId, officeId: fulfillment === "office" ? officeId : undefined, customerName: customerName.trim(), customerPhone: customerPhone.trim(), customerEmail: "", fulfillmentType: fulfillment === "delivery" ? "DELIVERY" : "PICKUP", deliveryAddress: fulfillment === "delivery" ? deliveryAddress.trim() : undefined, quantity: totalQuantity, subtotal: cart.subtotal, captainTip: 0, serviceFee, creditsApplied: creditsToApply, items: allCustomItems.length > 0 ? allCustomItems : undefined }) });
      const data = await res.json();
      if (!data.success) { if (data.error === "Menu item not found") { setError("Some items are no longer available. Remove them and try again, or browse the menu to re-add."); } else { setError(data.error || "Something went wrong"); } setLoading(false); return; }
      const redirectUrl = data.data.authorizationUrl;
      if (redirectUrl) { window.location.href = redirectUrl; }
      else { setError("Payment failed. Try again."); setLoading(false); }
    } catch { setError("Network error."); setLoading(false); }
  }

  function cleanName(name: string): string {
    return name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "");
  }

  return (
    <main className="flex-1 max-w-[480px] lg:max-w-[640px] mx-auto w-full pb-48 lg:pb-8" style={{ background: "var(--bg)" }}>
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Your plate is empty</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-muted)" }}>Browse meals and add something tasty</p>
          <Link href="/discover" className="h-11 px-6 rounded-[12px] text-[14px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse meals</Link>
        </div>
      ) : (
        <div className="px-5 space-y-4">
          {/* Items — grouped by pack */}
          {(() => {
            // Separate packed and unpacked items
            const packedIds = [...new Set(cart.items.filter(i => i.packId).map(i => i.packId!))];
            const unpackedItems = cart.items.filter(i => !i.packId);

            const renderItem = (item: typeof cart.items[0], showBorder: boolean) => (
              <div key={item.dailyMenuId} className={`flex items-center gap-3 py-3 ${showBorder ? "border-t" : ""}`} style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold leading-tight" style={{ color: item.isPackItem ? "var(--text-secondary)" : "var(--text)" }}>{cleanName(item.name)}</h3>
                  {item.restaurantName && !item.isPackItem && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.restaurantName}</p>}
                  <span className="text-[13px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(item.price * item.quantity)}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => cart.changeQuantity(item.dailyMenuId, -1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                    style={{ background: item.quantity === 1 ? "#FEF2F2" : "var(--sand)" }}>
                    {item.quantity === 1 ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14H6L5 6" /></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                    )}
                  </button>
                  <span className="text-[13px] font-bold tabular-nums w-5 text-center" style={{ color: "var(--text)" }}>{item.quantity}</span>
                  <button type="button" onClick={() => cart.addItem(item)}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform" style={{ background: "var(--sand)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
            );

            return (
              <>
                {/* Packed items — grouped */}
                {packedIds.map((packId, packIdx) => {
                  const packItems = cart.items.filter(i => i.packId === packId && !i.isPackItem);
                  const packContainer = cart.items.find(i => i.packId === packId && i.isPackItem);
                  const packTotal = packItems.reduce((s, i) => s + i.price * i.quantity, 0) + (packContainer ? packContainer.price * packContainer.quantity : 0);
                  return (
                    <section key={packId} className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      {/* Pack header */}
                      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "var(--sand)" }}>
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                          <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Pack {packIdx + 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(packTotal)}</span>
                          <button type="button" onClick={() => cart.removePack(packId)} className="text-[11px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="px-4">
                        {packItems.map((item, idx) => renderItem(item, idx > 0))}
                        {packContainer && renderItem(packContainer, packItems.length > 0)}
                        {!packContainer && (
                          <div className="py-2.5 flex items-center gap-1.5" style={{ borderTop: packItems.length > 0 ? "1px solid var(--border)" : "none" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                            <span className="text-[12px] font-semibold" style={{ color: "var(--coral)" }}>No pack selected — add a pack size</span>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}

                {/* Unpacked items — regular display */}
                {unpackedItems.length > 0 && (
                  <section className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    {unpackedItems.map((item, idx) => renderItem(item, idx > 0))}
                  </section>
                )}
              </>
            );
          })()}

          {/* Not authenticated */}
          {isAuthenticated === false && (
            <section className="rounded-[20px] p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--coral)", opacity: 0.1 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
              </div>
              <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Log in to checkout</h2>
              <p className="text-[14px] mb-5" style={{ color: "var(--text-secondary)" }}>Verify your phone to complete your order</p>
              <a href="/auth?returnTo=/cart" className="w-full h-12 rounded-[12px] text-[15px] font-bold text-white flex items-center justify-center" style={{ background: "var(--coral)" }}>
                Log in with phone number
              </a>
            </section>
          )}

          {/* Delivery */}
          {isAuthenticated && (
            <section data-delivery-section className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-extrabold mb-3" style={{ color: "var(--text)" }}>Delivery</h2>

              {officeId ? (
                /* ── STATE 1: Connected to office — confirmed, no choices needed ── */
                <div className="p-4 rounded-[14px]" style={{ background: "rgba(13,159,95,0.04)", border: "1px solid rgba(13,159,95,0.15)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 21V4h11v17M15 9h5v12" /></svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{officeName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--emerald)" }}>FREE</span>
                      </div>
                      <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Arrives by 12:00 PM at {collectionPoint || "reception"}</p>
                    </div>
                  </div>
                </div>
              ) : isFirstOrder ? (
                /* ── STATE 2: First order, no office — just ask for address, free delivery ── */
                <div className="p-4 rounded-[14px]" style={{ background: "rgba(13,159,95,0.04)", border: "1px solid rgba(13,159,95,0.15)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                    <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Your first delivery is free</span>
                  </div>
                  <input type="text" value={deliveryAddress} onChange={(e) => { setDeliveryAddress(e.target.value); setFulfillment("delivery"); }} placeholder="Enter your address — building, street, area" className="w-full px-4 h-12 rounded-[12px] text-[14px] focus:outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
                  <p className="text-[12px] mt-3" style={{ color: "var(--text-muted)" }}>
                    Have a group code? <button type="button" onClick={() => setIsFirstOrder(false)} className="font-bold underline cursor-pointer" style={{ color: "var(--text-secondary)" }}>Enter it for free delivery every time</button>
                  </p>
                </div>
              ) : (
                /* ── STATE 3: Returning user, no office — office code + express choice ── */
                <div className="space-y-3">
                  <div className="p-4 rounded-[14px]" style={{ border: fulfillment === "office" ? "2px solid var(--emerald)" : "1px solid var(--border)", background: fulfillment === "office" ? "rgba(13,159,95,0.04)" : "var(--card)" }}>
                    <button type="button" onClick={() => setFulfillment("office")} className="w-full text-left cursor-pointer">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Office Drop</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--emerald)" }}>FREE</span>
                      </div>
                    </button>
                    {fulfillment === "office" && (
                      <div>
                        <p className="text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>Enter your group code for free delivery</p>
                        <div className="flex gap-2">
                          <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="e.g. STERL-001" className="flex-1 min-w-0 px-3 h-11 rounded-[10px] text-[14px] focus:outline-none uppercase" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
                          <button type="button" onClick={handleConnectOffice} disabled={codeLoading} className="h-11 px-4 rounded-[10px] text-[14px] font-bold text-white disabled:opacity-50 cursor-pointer shrink-0" style={{ background: "var(--dark)" }}>{codeLoading ? "..." : "Join"}</button>
                        </div>
                        {codeError && <p className="text-[12px] mt-1.5" style={{ color: "var(--coral)" }}>{codeError}</p>}
                        <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>
                          No code? <a href="https://wa.me/2349120532827?text=I%20need%20an%20office%20code" target="_blank" rel="noopener noreferrer" className="font-bold underline" style={{ color: "var(--text-secondary)" }}>Get one via WhatsApp</a>
                        </p>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={() => setFulfillment("delivery")} className="w-full text-left p-4 rounded-[14px] transition-all cursor-pointer" style={{
                    border: fulfillment === "delivery" ? "2px solid var(--coral)" : "1px solid var(--border)",
                    background: fulfillment === "delivery" ? "rgba(232,96,76,0.04)" : "var(--card)",
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Express Delivery</span>
                        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>Delivered to your door · 30-60 min</p>
                      </div>
                      <span className="text-[15px] font-extrabold shrink-0" style={{ color: "var(--text)" }}>
                        {formatNaira(EXPRESS_FEE)}
                      </span>
                    </div>
                    {fulfillment === "delivery" && (
                      <div className="mt-3">
                        <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter delivery address" className="w-full px-4 h-11 rounded-[10px] text-[14px] focus:outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()} />
                      </div>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Contact */}
          {isAuthenticated !== null && (
            <section className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>Contact</h2>
                {isAuthenticated && hasContact && !editContact ? (
                  <button type="button" onClick={() => setEditContact(true)} className="text-[13px] font-semibold cursor-pointer" style={{ color: "var(--text-secondary)" }}>Edit</button>
                ) : isAuthenticated && hasContact && editContact ? (
                  <button type="button" onClick={() => setEditContact(false)} className="text-[13px] font-semibold cursor-pointer" style={{ color: "var(--emerald)" }}>Done</button>
                ) : null}
              </div>
              {isAuthenticated && hasContact && !editContact ? (
                <div className="flex items-center gap-2 mt-3 text-[14px]" style={{ color: "var(--text-secondary)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{customerName}</span>
                  <span>·</span>
                  <span>{customerPhone}</span>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="w-full px-4 h-12 rounded-[12px] text-[15px] focus:outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" className="w-full px-4 h-12 rounded-[12px] text-[15px] focus:outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} />
                </div>
              )}
            </section>
          )}

          {/* Order summary — transparent breakdown */}
          <section className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Subtotal ({portionCount} item{portionCount !== 1 ? "s" : ""})</span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Delivery</span>
                <span className="font-bold" style={{ color: deliveryFee === 0 ? "var(--emerald)" : "var(--text)" }}>{deliveryFee === 0 ? "FREE" : formatNaira(deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--text-secondary)" }}>Order handling</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--sand)", color: "var(--text-muted)" }}>₦150 × {packCount} {packCount === 1 ? "pack" : "packs"}</span>
                </div>
                <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(serviceFee)}</span>
              </div>
              {creditsToApply > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--emerald)" }}>Pool credits applied</span>
                  <span className="font-bold" style={{ color: "var(--emerald)" }}>-{formatNaira(creditsToApply)}</span>
                </div>
              )}
              {/* Pool savings callout — only when discount is active */}
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
                  <div className="flex items-center gap-2 p-3 rounded-[12px] mt-1 mb-1" style={{ background: "rgba(13,159,95,0.08)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                    <div className="flex-1">
                      <span className="text-[14px] font-bold" style={{ color: "var(--emerald)" }}>Saving {formatNaira(totalSaved)} with pool pricing</span>
                      {poolData.officeOrderCount > 0 && (
                        <span className="text-[12px] ml-1" style={{ color: "var(--text-muted)" }}>· {poolData.officeOrderCount} orders in pool</span>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: "2px solid var(--border)" }}>
                <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Total</span>
                <span className="text-[22px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(orderTotal)}</span>
              </div>
            </div>

            {/* Pool refund guarantee — with potential savings */}
            {officeId && (
              <div className="mt-3 p-4 rounded-[14px]" style={{ background: "var(--dark)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span className="text-[14px] font-bold text-white">Pool member guarantee</span>
                </div>
                {poolData.officeOrderCount > 0 && poolData.officeOrderCount < 30 ? (() => {
                  const currentPct = poolData.officeOrderCount >= 30 ? 8 : poolData.officeOrderCount >= 20 ? 5 : poolData.officeOrderCount >= 10 ? 3 : 0;
                  const nextPct = currentPct >= 8 ? 8 : currentPct >= 5 ? 8 : currentPct >= 3 ? 5 : 3;
                  const nextMin = nextPct === 3 ? 10 : nextPct === 5 ? 20 : 30;
                  const moreNeeded = Math.max(0, nextMin - poolData.officeOrderCount);
                  const potentialCredit = Math.round(cart.subtotal * (nextPct - currentPct) / 100);
                  return (
                    <p className="text-[13px] text-white/70 leading-relaxed">
                      {moreNeeded > 0
                        ? <>If <span className="font-bold text-white">{moreNeeded} more</span> people join your group, you get <span className="font-bold" style={{ color: "var(--emerald)" }}>{formatNaira(potentialCredit)} credit</span> back on this order.</>
                        : <>Credits will be calculated when the pool closes today.</>
                      }
                    </p>
                  );
                })() : (
                  <p className="text-[13px] text-white/70 leading-relaxed">
                    Order at today&apos;s rate. As more people join, your rate improves — <span className="font-bold" style={{ color: "var(--emerald)" }}>bonus credit added to your wallet</span>.
                  </p>
                )}
              </div>
            )}

            {/* Delivery info */}
            {officeId && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-[12px]" style={{ background: "var(--sand)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Arriving by 12:00 PM at {collectionPoint || "reception"}</span>
              </div>
            )}

            {/* Collection code preview */}
            <div className="flex items-center gap-2 mt-2 p-3 rounded-[12px]" style={{ background: "var(--sand)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>You&apos;ll get a unique code to collect your food</span>
            </div>
          </section>

          {/* Error shown only in sticky footer — no duplicate */}
        </div>
      )}

      {/* Sticky bottom CTA */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-[52px] left-0 right-0 z-40 backdrop-blur-lg px-5 py-4 md:hidden" style={{ background: "rgba(250,247,242,0.95)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-[480px] mx-auto">
            {orderingClosed ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                  <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Pre-order saved!</span>
                </div>
                <p className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>Ready when orders open at 7:00 AM</p>
                <Link href="/discover" className="w-full h-12 rounded-[12px] text-[14px] font-bold flex items-center justify-center" style={{ background: "var(--sand)", color: "var(--text)" }}>
                  Back to menu
                </Link>
              </div>
            ) : (
              <>
                {error && <div className="text-[12px] font-semibold p-2 rounded-[10px] mb-2 text-center" style={{ background: "#FEF2F2", color: "var(--coral)" }}>{error}</div>}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Total</span>
                  <span className="text-[22px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(orderTotal)}</span>
                </div>
                <button type="button"
                  onClick={() => {
                    if (isAuthenticated === false) { window.location.href = "/auth?returnTo=/cart"; return; }
                    if (fulfillment === "office" && !officeId && !isFirstOrder) {
                      setError("Choose a delivery method — enter your group code for free delivery, or switch to Express");
                      document.querySelector('[data-delivery-section]')?.scrollIntoView({ behavior: "smooth", block: "center" });
                      return;
                    }
                    handlePay();
                  }}
                  disabled={loading}
                  className="w-full h-14 rounded-[12px] text-[16px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: isAuthenticated === false ? "var(--dark)" : "var(--coral)" }}>
                  {loading ? "Processing..." : isAuthenticated === false ? "Log in to pay" : "Continue to payment →"}
                </button>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Money-back guarantee</span>
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--border)" }}>·</span>
                  <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Paystack secured</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
