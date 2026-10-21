"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/customer";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

type FulfillmentMode = "office" | "building" | "delivery";
type InlineAuthTab = "signin" | "signup";

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
  const [captainTip, setCaptainTip] = useState(10000);
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [customTipValue, setCustomTipValue] = useState("");
  const [editContact, setEditContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderingClosed, setOrderingClosed] = useState(false);

  // Building Drop state
  const [buildingSearch, setBuildingSearch] = useState("");
  const [buildingResults, setBuildingResults] = useState<Array<{ id: string; name: string; address: string; todayOrders: number; isFreeDelivery: boolean }>>([]);
  const [selectedDropPoint, setSelectedDropPoint] = useState<{ id: string; name: string; address: string; todayOrders: number; isFreeDelivery: boolean } | null>(null);
  const [buildingSearching, setBuildingSearching] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingAddress, setNewBuildingAddress] = useState("");
  const [showNewBuilding, setShowNewBuilding] = useState(false);
  const [activeDrops, setActiveDrops] = useState<Array<{ id: string; name: string; address: string; todayOrders: number; isFreeDelivery: boolean }>>([]);
  const [activeDropsLoaded, setActiveDropsLoaded] = useState(false);

  // First-order state
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authTab, setAuthTab] = useState<InlineAuthTab>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  useEffect(() => {
    // Only load office/delivery prefs from localStorage — contact comes from auth check
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

    // Check if ordering is closed
    fetch("/api/menu/status")
      .then((r) => r.json())
      .then((d) => { if (d.allExpired) setOrderingClosed(true); })
      .catch(() => {});

    // Check auth status from server (cookie is httpOnly, can't check client-side)
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setIsAuthenticated(!!d.success);
        if (d.success && d.data) {
          const u = d.data;
          if (u.firstName) setCustomerName(`${u.firstName} ${u.lastName || ""}`);
          if (u.phone) setCustomerPhone(u.phone);
          // Also set office from server if available
          if (u.office?.id) {
            setOfficeId(u.office.id);
            setOfficeName(u.office.name || "");
            setCollectionPoint(u.office.collectionPoint || "");
            setFulfillment("office");
          }
        } else {
          // Not authenticated — clear contact fields loaded from stale localStorage
          setCustomerName("");
          setCustomerPhone("");
        }
        if (d.success) {
          fetch("/api/orders/mine")
            .then((r) => r.json())
            .then((od) => {
              if (od.success && (!od.data || od.data.length === 0)) {
                setIsFirstOrder(true);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  async function handleInlineSignIn() {
    if (!authEmail.trim() || !authPassword) { setAuthError("Email and password are required"); return; }
    setAuthError(""); setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: authEmail.trim(), password: authPassword }) });
      const data = await res.json();
      if (!data.success) { setAuthError(data.error || "Sign in failed"); setAuthLoading(false); return; }
      saveCustomerProfile({ name: `${data.data.firstName} ${data.data.lastName}`, phone: data.data.phone, email: data.data.email, deliveryAddress: "", preferredFulfillment: "PICKUP", officeId: data.data.office?.id, officeName: data.data.office?.name, officeCode: data.data.office?.code, collectionPoint: data.data.office?.collectionPoint });
      setCustomerName(`${data.data.firstName} ${data.data.lastName}`);
      setCustomerPhone(data.data.phone || "");
      if (data.data.office?.id) {
        setOfficeId(data.data.office.id);
        setOfficeName(data.data.office.name || "");
        setCollectionPoint(data.data.office.collectionPoint || "");
        setFulfillment("office");
      }
      setIsAuthenticated(true);
      setAuthLoading(false);
    } catch { setAuthError("Network error. Try again."); setAuthLoading(false); }
  }

  async function handleInlineSignUp() {
    const nameParts = authName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;
    if (!firstName || !authPhone.trim() || !authEmail.trim() || !authPassword) { setAuthError("All fields are required"); return; }
    if (authPassword.length < 6) { setAuthError("Password must be at least 6 characters"); return; }
    setAuthError(""); setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, email: authEmail.trim(), phone: authPhone.trim(), password: authPassword }) });
      const data = await res.json();
      if (!data.success) { setAuthError(data.error || "Sign up failed"); setAuthLoading(false); return; }
      saveCustomerProfile({ name: `${data.data.firstName} ${data.data.lastName}`, phone: data.data.phone, email: data.data.email, deliveryAddress: "", preferredFulfillment: "PICKUP" });
      setCustomerName(`${data.data.firstName} ${data.data.lastName}`);
      setCustomerPhone(data.data.phone || authPhone.trim());
      setIsAuthenticated(true);
      setAuthLoading(false);
    } catch { setAuthError("Network error. Try again."); setAuthLoading(false); }
  }

  const EXPRESS_FEE = 120000;
  const SERVICE_FEE = Math.min(50000, Math.max(10000, Math.round(cart.subtotal * 0.05))); // 5%, min ₦100, max ₦500
  const deliveryFee = isFirstOrder ? 0 :
    fulfillment === "delivery" ? EXPRESS_FEE :
    (fulfillment === "building" && selectedDropPoint && !selectedDropPoint.isFreeDelivery) ? EXPRESS_FEE : 0;
  const effectiveTip = (fulfillment === "office" && officeId) ? captainTip : 0;
  const orderTotal = cart.subtotal + deliveryFee + SERVICE_FEE + effectiveTip;
  const belowMinimum = false; // No minimum order — drop model handles unit economics
  const portionCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const hasContact = customerName.trim() && customerPhone.trim();

  // Load active drop points when building fulfillment is selected
  useEffect(() => {
    if (fulfillment === "building" && !activeDropsLoaded) {
      fetch("/api/drop-points/active")
        .then((r) => r.json())
        .then((d) => { if (d.success) setActiveDrops(d.data); setActiveDropsLoaded(true); })
        .catch(() => setActiveDropsLoaded(true));
    }
  }, [fulfillment, activeDropsLoaded]);

  async function searchBuildings(query: string) {
    setBuildingSearch(query);
    if (query.length < 2) { setBuildingResults([]); return; }
    setBuildingSearching(true);
    try {
      const res = await fetch(`/api/drop-points/lookup?q=${encodeURIComponent(query)}`);
      const data = await res.json() as { success: boolean; data: Array<{ id: string; name: string; address: string; todayOrders: number; isFreeDelivery: boolean }> };
      if (data.success) setBuildingResults(data.data);
    } catch { /* ignore */ }
    setBuildingSearching(false);
  }

  async function createNewBuilding() {
    if (!newBuildingName.trim() || !newBuildingAddress.trim()) return;
    try {
      const res = await fetch("/api/drop-points/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBuildingName.trim(), address: newBuildingAddress.trim() }),
      });
      const data = await res.json() as { success: boolean; data: { id: string; name: string; address: string } };
      if (data.success) {
        setSelectedDropPoint({ ...data.data, todayOrders: 0, isFreeDelivery: false });
        setShowNewBuilding(false);
        setNewBuildingName("");
        setNewBuildingAddress("");
      }
    } catch { /* ignore */ }
  }

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
    if (!customerName.trim() || !customerPhone.trim()) { setError("Name and phone are required"); setEditContact(true); return; }
    if (cart.items.length === 0) return;
    if (fulfillment === "office" && !officeId && !isFirstOrder) { setError("Enter your office code for free delivery, or switch to Express Delivery"); return; }
    if (fulfillment === "office" && !officeId && isFirstOrder && !deliveryAddress.trim()) { setError("Enter your delivery address so we know where to bring your food"); return; }
    if (fulfillment === "delivery" && !deliveryAddress.trim()) { setError("Enter your delivery address"); return; }
    if (fulfillment === "building" && !selectedDropPoint) { setError("Select your building to continue"); return; }

    setError(null); setLoading(true);
    saveCustomerProfile({ name: customerName.trim(), phone: customerPhone.trim(), email: "", deliveryAddress: deliveryAddress.trim(), preferredFulfillment: "DELIVERY", officeId, officeName, collectionPoint });

    // Find the real dailyMenuId — combo items store it directly, individual items have it in realDailyMenuId
    const primaryItem = cart.items[0];
    const realDailyMenuId = primaryItem.realDailyMenuId || primaryItem.dailyMenuId;

    const totalQuantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const allCustomItems = cart.items.filter((i) => i.customItems?.length).flatMap((i) => i.customItems || []);

    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dailyMenuId: realDailyMenuId, officeId: fulfillment === "office" ? officeId : undefined, dropPointId: fulfillment === "building" ? selectedDropPoint?.id : undefined, customerName: customerName.trim(), customerPhone: customerPhone.trim(), customerEmail: "", fulfillmentType: fulfillment === "delivery" ? "DELIVERY" : "PICKUP", deliveryAddress: fulfillment === "delivery" ? deliveryAddress.trim() : undefined, quantity: totalQuantity, subtotal: cart.subtotal, captainTip: effectiveTip, serviceFee: SERVICE_FEE, items: allCustomItems.length > 0 ? allCustomItems : undefined }) });
      const data = await res.json();
      if (!data.success) { if (data.error === "Menu item not found") { setError("Cart expired. Please re-add from menu."); cart.clearCart(); } else { setError(data.error || "Something went wrong"); } setLoading(false); return; }
      // Clear cart only after successful redirect — store the URL first
      const redirectUrl = data.data.authorizationUrl;
      if (redirectUrl) {
        // Clear localStorage directly — don't update React state (causes flash of empty cart)
        localStorage.removeItem("chopdrop-cart");
        window.location.href = redirectUrl;
      } else {
        setError("Payment initialization failed. Please try again.");
        setLoading(false);
      }
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <main className="flex-1 max-w-[480px] lg:max-w-[640px] mx-auto w-full pb-48 lg:pb-8 bg-[#fafaf8]">
      {/* ── FIX #1: Compact header — no progress stepper ── */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em]">Checkout</h1>
          <p className="text-[#9ca3af] text-[11px] mt-0.5">{portionCount} item{portionCount !== 1 ? "s" : ""} · {formatNaira(cart.subtotal)}</p>
        </div>
        <Link href="/menu" className="text-[#0f4030] text-[12px] font-semibold hover:underline">+ Add more</Link>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-6">
          <div className="w-16 h-16 bg-[#f5f5f3] rounded-full flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </div>
          <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">Your cart is empty</h2>
          <p className="text-[#9ca3af] text-[13px] mb-5">Browse meals and add something tasty</p>
          <Link href="/menu" className="bg-[#f05f4b] text-white text-[13px] font-bold px-6 py-2.5 rounded-full shadow-[0_2px_10px_rgba(240,95,75,0.3)]">Browse meals</Link>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {/* ── FIX #2: Meals — tighter padding ── */}
          <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {cart.items.map((item, idx) => (
              <div key={item.dailyMenuId} className={`flex items-center gap-3 py-3 ${idx > 0 ? "border-t border-[#f0efeb]" : ""}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f5f5f3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[14px]">🍽️</div>}
                  </div>
                  <span className="absolute -top-1.5 -left-1.5 text-[9px] font-bold text-white bg-[#0f4030] w-5 h-5 rounded-md flex items-center justify-center">{item.quantity}x</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-[#1a1a1a] leading-tight truncate">{item.name}</h3>
                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{item.restaurantName}</p>
                </div>
                <span className="font-display font-bold text-[14px] text-[#1a1a1a] flex-shrink-0">{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-[#f0efeb]">
              <Link href="/menu" className="text-[11px] font-semibold text-[#f05f4b] active:opacity-70">Edit items</Link>
            </div>
          </section>

          {/* ── Inline Auth — right after meals, before everything else ── */}
          {isAuthenticated === false && cart.items.length > 0 && (
            <section id="auth-section" className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden border-2 border-[#f05f4b]/20">
              <div className="px-4 pt-4 pb-1">
                <h2 className="font-display font-bold text-[14px] text-[#1a1a1a]">Sign in to checkout</h2>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">Create an account or sign in to complete your order</p>
              </div>
              <div className="flex mx-4 mt-3 gap-1 bg-[#f5f5f3] rounded-xl p-1">
                <button type="button" onClick={() => { setAuthTab("signin"); setAuthError(""); }} className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${authTab === "signin" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#9ca3af]"}`}>Sign in</button>
                <button type="button" onClick={() => { setAuthTab("signup"); setAuthError(""); }} className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${authTab === "signup" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#9ca3af]"}`}>Create account</button>
              </div>
              <div className="px-4 pb-4 mt-3 space-y-2.5">
                {authError && (
                  <div className="bg-[#fef2f2] text-[#f05f4b] text-[11px] font-semibold p-2.5 rounded-lg flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>
                    {authError}
                  </div>
                )}
                {authTab === "signup" && (
                  <>
                    <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20" />
                    <input type="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="Phone number" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20" />
                  </>
                )}
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email address" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20" />
                <div className="relative">
                  <input type={showAuthPassword ? "text" : "password"} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0f4030]/20 pr-10" onKeyDown={(e) => { if (e.key === "Enter") { authTab === "signin" ? handleInlineSignIn() : handleInlineSignUp(); } }} />
                  <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {showAuthPassword ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M1 1l22 22" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                <button type="button" onClick={authTab === "signin" ? handleInlineSignIn : handleInlineSignUp} disabled={authLoading} className="w-full bg-[#0f4030] text-white font-bold py-3 rounded-xl text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
                  {authLoading ? (authTab === "signin" ? "Signing in..." : "Creating account...") : (authTab === "signin" ? "Sign in" : "Create account")}
                </button>
              </div>
            </section>
          )}

          {/* ── Fulfillment — only show when authenticated ── */}
          {isAuthenticated && (
          <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="font-display font-bold text-[14px] text-[#1a1a1a] mb-3">Delivery</h2>
            <div className="space-y-2">
              {/* Office Drop */}
              <button type="button" onClick={() => setFulfillment("office")} className={`w-full text-left p-3 rounded-xl border-[1.5px] transition-all ${fulfillment === "office" ? "border-[#0f4030] bg-[#0f4030]/[0.03]" : "border-[#f0efeb] hover:border-[#d1d5db]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${fulfillment === "office" ? "border-[#0f4030]" : "border-[#d1d5db]"}`}>
                    {fulfillment === "office" && <div className="w-2 h-2 bg-[#0f4030] rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#1a1a1a]">Office Drop</span>
                      <span className="bg-[#0f4030]/10 text-[#0f4030] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Free</span>
                    </div>
                    {officeId ? (
                      <p className="text-[10px] text-[#6b7280] mt-0.5">{officeName} · {collectionPoint}</p>
                    ) : (
                      <p className="text-[10px] text-[#9ca3af] mt-0.5">Arrives on or before 12:00 PM</p>
                    )}
                  </div>
                  <span className="text-[13px] font-bold text-[#22c55e] flex-shrink-0">FREE</span>
                </div>
                {/* Office code input — required for free delivery */}
                {fulfillment === "office" && !officeId && (
                  <div className="mt-2.5">
                    <div className="flex gap-2">
                      <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Office code e.g. NORTH-241" className="flex-1 px-3 py-2 bg-[#f5f5f3] rounded-lg text-[11px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30 uppercase" onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
                      <button type="button" onClick={handleConnectOffice} disabled={codeLoading} className="bg-[#0f4030] text-white font-bold px-4 py-2 rounded-lg text-[11px] disabled:opacity-50 active:scale-95 transition-transform">{codeLoading ? "..." : "Join"}</button>
                    </div>
                    {isFirstOrder ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#22c55e] font-semibold">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>
                          First order — delivery is free!
                        </div>
                        <div>
                          <label className="text-[10px] text-[#6b7280] font-medium block mb-1">Where should we deliver?</label>
                          <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="e.g. Sterling Towers, 15 Allen Avenue, Ikeja" className="w-full px-3 py-2 bg-[#f5f5f3] rounded-lg text-[11px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] text-[#9ca3af] mt-1.5">Office code required for free delivery.</p>
                        <div className="mt-3 pt-3 border-t border-[#f0efeb]">
                          <p className="text-[10px] font-bold text-[#6b7280] mb-1.5">Don&apos;t have a code?</p>
                          <a
                            href="https://wa.me/2349120532827?text=Hi!%20I%20need%20an%20office%20code%20for%20ChopDrop.%20My%20office%20is%20at%20"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl px-3.5 py-3 active:scale-[0.98] transition-transform"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-[12px] font-bold text-[#1a1a1a]">Get one via WhatsApp</div>
                              <div className="text-[10px] text-[#6b7280]">Takes 2 minutes</div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {fulfillment === "office" && officeId && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#22c55e] font-semibold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>
                    Connected — free delivery
                  </div>
                )}
                {codeError && <p className="text-[#f05f4b] text-[10px] mt-1 ml-7">{codeError}</p>}
              </button>

              {/* Building Drop — hidden for launch, re-enable when 10+ offices */}

              {/* Express */}
              <button type="button" onClick={() => setFulfillment("delivery")} className={`w-full text-left p-3 rounded-xl border-[1.5px] transition-all ${fulfillment === "delivery" ? "border-[#0f4030] bg-[#0f4030]/[0.03]" : "border-[#f0efeb] hover:border-[#d1d5db]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${fulfillment === "delivery" ? "border-[#0f4030]" : "border-[#d1d5db]"}`}>
                    {fulfillment === "delivery" && <div className="w-2 h-2 bg-[#0f4030] rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">Express Delivery</span>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">Delivered within 45 min to your address</p>
                  </div>
                  <span className="text-[13px] font-bold flex-shrink-0">
                    {isFirstOrder ? (
                      <><span className="text-[#22c55e]">FREE</span> <span className="text-[10px] text-[#d1d5db] line-through">{formatNaira(EXPRESS_FEE)}</span></>
                    ) : (
                      <span className="text-[#f05f4b]">{formatNaira(EXPRESS_FEE)}</span>
                    )}
                  </span>
                </div>
                {fulfillment === "delivery" && (
                  <div className="mt-2.5">
                    <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter delivery address" className="w-full px-3 py-2 bg-[#f5f5f3] rounded-lg text-[11px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
                  </div>
                )}
              </button>
            </div>
          </section>
          )}

          {/* ── Tip — only show when office is connected ── */}
          {isAuthenticated && fulfillment === "office" && officeId && (
            <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="font-display font-bold text-[14px] text-[#1a1a1a]">ChopDropper tip</h2>
                <span className="text-[10px] text-[#9ca3af]">100% to your assistant</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[0, 10000, 20000, 50000, 100000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => { setCaptainTip(amount); setShowCustomTip(false); setCustomTipValue(""); }}
                    className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-95 ${
                      captainTip === amount && !showCustomTip
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-[#f5f5f3] text-[#1a1a1a] hover:bg-[#eeedea]"
                    }`}
                  >
                    {formatNaira(amount)}
                  </button>
                ))}
                {showCustomTip ? (
                  <div className="flex items-center bg-[#1a1a1a] rounded-lg px-3 py-1.5">
                    <span className="text-[12px] text-white/60 mr-1">₦</span>
                    <input
                      type="number"
                      autoFocus
                      value={customTipValue}
                      onChange={(e) => {
                        setCustomTipValue(e.target.value);
                        const val = Math.max(100, parseInt(e.target.value) || 100);
                        setCaptainTip(val * 100);
                      }}
                      onBlur={() => { if (!customTipValue) setShowCustomTip(false); }}
                      placeholder="Amount"
                      className="w-16 bg-transparent text-[12px] font-semibold text-white outline-none placeholder:text-white/40"
                      min="100"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomTip(true)}
                    className="px-3.5 py-2 rounded-lg text-[12px] font-semibold bg-[#f5f5f3] text-[#1a1a1a] hover:bg-[#eeedea] transition-all active:scale-95"
                  >
                    Custom
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── Contact — only show after auth check completes ── */}
          {isAuthenticated !== null && (
            <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-[14px] text-[#1a1a1a]">Contact</h2>
                {isAuthenticated && hasContact && !editContact ? (
                  <button type="button" onClick={() => setEditContact(true)} className="text-[11px] text-[#0f4030] font-semibold">Edit</button>
                ) : isAuthenticated && hasContact && editContact ? (
                  <button type="button" onClick={() => setEditContact(false)} className="text-[11px] text-[#22c55e] font-semibold">Done</button>
                ) : null}
              </div>
              {isAuthenticated && hasContact && !editContact ? (
                <div className="flex items-center gap-2 mt-2 text-[12px] text-[#6b7280]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[#22c55e] flex-shrink-0"><path d="m5 12 4 4L19 6" /></svg>
                  <span className="text-[#1a1a1a] font-medium">{customerName}</span>
                  <span>·</span>
                  <span>{customerPhone}</span>
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
                </div>
              )}
            </section>
          )}

          {/* ── Order summary ── */}
          <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="font-display font-bold text-[14px] text-[#1a1a1a] mb-3">Summary</h2>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-[#6b7280]">Subtotal ({portionCount} item{portionCount !== 1 ? "s" : ""})</span><span className="font-semibold text-[#1a1a1a]">{formatNaira(cart.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#6b7280]">Delivery</span><span className={`font-semibold ${deliveryFee === 0 ? "text-[#22c55e]" : "text-[#1a1a1a]"}`}>{deliveryFee === 0 ? "FREE" : formatNaira(deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-[#6b7280]">Service fee (5%)</span><span className="font-semibold text-[#1a1a1a]">{formatNaira(SERVICE_FEE)}</span></div>
              {effectiveTip > 0 && <div className="flex justify-between"><span className="text-[#6b7280]">ChopDropper tip</span><span className="font-semibold text-[#1a1a1a]">{formatNaira(effectiveTip)}</span></div>}
              <div className="flex justify-between items-center border-t border-[#f0efeb] pt-3 mt-1">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">Total</span>
                <span className="font-display font-bold text-[20px] text-[#1a1a1a] tracking-[-0.02em]">{formatNaira(orderTotal)}</span>
              </div>
            </div>
            {(fulfillment === "office" || (fulfillment === "building" && selectedDropPoint?.isFreeDelivery)) && (
              <div className="flex items-center gap-1.5 bg-[#0f4030]/[0.06] rounded-lg px-3 py-2 mt-3 text-[#0f4030] text-[10px] font-semibold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>
                You&apos;re saving {formatNaira(EXPRESS_FEE)} on delivery
              </div>
            )}
          </section>


          {/* Error */}
          {error && (
            <div className="bg-[#fef2f2] text-[#f05f4b] text-[11px] font-semibold p-3 rounded-xl flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── FIX #6 & #7: Sticky bottom — clean total + full-width button ── */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-[52px] left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-black/[0.06] px-5 py-3 md:hidden">
          <div className="max-w-[480px] mx-auto">
            {orderingClosed ? (
              <>
                {/* Pre-order saved confirmation — no payment */}
                <div className="flex items-center gap-3 bg-[#0f4030] rounded-xl p-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-white">Pre-order saved!</div>
                    <div className="text-[10px] text-white/60">Your {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} ({formatNaira(cart.subtotal)}) will be ready at <span className="text-[#f5c565] font-bold">7:00 AM</span></div>
                  </div>
                </div>
                <Link
                  href="/menu"
                  className="w-full font-bold py-3 rounded-xl text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#f5f5f3] text-[#1a1a1a]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                  Back to menu
                </Link>
              </>
            ) : (
              <>
                {error && (
                  <div className="bg-[#fef2f2] text-[#f05f4b] text-[11px] font-semibold p-2 rounded-lg mb-2 text-center">{error}</div>
                )}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6b7280]">Total</span>
                  <span className="font-display font-bold text-[20px] text-[#1a1a1a] tracking-[-0.02em]">{formatNaira(orderTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated === false) {
                      document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      return;
                    }
                    handlePay();
                  }}
                  disabled={loading || belowMinimum || (fulfillment === "building" && !selectedDropPoint) || (fulfillment === "office" && !officeId && !isFirstOrder)}
                  className={`w-full font-bold py-3.5 rounded-xl text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isAuthenticated === false
                      ? "bg-[#1a1a1a] text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                      : "bg-[#f05f4b] text-white shadow-[0_4px_16px_rgba(240,95,75,0.3)] hover:bg-[#e0503d]"
                  }`}
                >
                  {loading ? "Processing..." : isAuthenticated === false ? "Sign in to pay ↑" : fulfillment === "office" && !officeId && !isFirstOrder ? "Enter office code to continue" : fulfillment === "building" && !selectedDropPoint ? "Select your building" : "Continue to payment"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                </button>
                <p className="text-[9px] text-[#9ca3af] text-center mt-2 flex items-center justify-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#22c55e]"><path d="m5 12 4 4L19 6" /></svg>
                  Secure prepaid checkout · Powered by Paystack
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
