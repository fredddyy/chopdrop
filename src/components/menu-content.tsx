"use client";

import React, { useState, useEffect } from "react";
import { CountdownTimer } from "./countdown-timer";
import { BottomNav } from "./bottom-nav";
import { useCart } from "@/lib/cart";
import { getCustomerProfile } from "@/lib/customer";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { CartSidebar } from "./cart-sidebar";

interface CategoryItem { id: string; name: string; price: number; }
interface Category { id: string; name: string; selectionRule: string; items: CategoryItem[]; }
interface MenuItem {
  id: string; name: string; description: string | null; imageUrl: string | null;
  price: number; originalPrice: number | null; maxDeals: number; claimedPad: number;
  tag: string; type: string; restaurantId: string; restaurantName: string;
  restaurantAddress: string; restaurantImageUrl: string | null; startTime: string; endTime: string; remaining: number;
  expired: boolean; categories?: Category[];
}
interface RestaurantInfo { id: string; name: string; imageUrl: string | null; address: string; mealCount: number; previewImage: string | null; }
interface SlotInfo { id: string; label: string; startTime: string; cutoffTime: string; expired: boolean; restaurants: RestaurantInfo[]; items: MenuItem[]; }
interface MenuContentProps { slots: SlotInfo[]; defaultSlotId: string; }

interface ActivePromo {
  id: string; name: string; type: string; rewardAmount: number; rewardType: string;
  minOrders: number; cutoffTime: string | null; description: string | null;
  imageUrl: string | null; officeOnly: boolean;
  progress: { officeOrderCount: number; weeklyOrderCount: number; };
}

function getSlotShortName(label: string): string {
  if (label.toLowerCase().includes("breakfast")) return "Breakfast";
  if (label.toLowerCase().includes("lunch")) return "Lunch";
  return label.split("(")[0].trim();
}

function getSlotDropTime(label: string): string {
  const match = label.match(/\((.+)\)/);
  return match ? match[1] : "";
}

function formatPrice(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

function formatPromoReward(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

/* ════════════════════════════════════════════ */
export function MenuContent({ slots, defaultSlotId }: MenuContentProps) {
  const [activeSlot, setActiveSlot] = useState(defaultSlotId);
  const [toast, setToast] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [reminderSet, setReminderSet] = useState(false);
  const [preorderToast, setPreorderToast] = useState("");
  const [activePromo, setActivePromo] = useState<ActivePromo | null>(null);
  const [poolData, setPoolData] = useState<{ officeOrderCount: number; meals: Record<string, { poolPrice: number; basePrice: number; savings: number; nextTier: { min: number; price: number } | null; tiers: { min: number; price: number }[] }> }>({ officeOrderCount: 0, meals: {} });
  const [userOfficeId, setUserOfficeId] = useState("");
  const [lastOrder, setLastOrder] = useState<{ name: string; price: number; imageUrl: string | null; restaurantName: string; dailyMenuId: string } | null>(null);
  const cart = useCart();

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) setOfficeName(profile.officeName || "");
    const dismissed = localStorage.getItem("chopdrop-banner-dismissed");
    setBannerDismissed(!!dismissed);
    const savedReminder = localStorage.getItem("chopdrop-reminder-set");
    if (savedReminder === "true") setReminderSet(true);

    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.success && d.data?.office) {
        if (d.data.office.name) setOfficeName(d.data.office.name);
        if (d.data.office.assistantName) setCaptainName(d.data.office.assistantName);
        const officeId = d.data.office.id || "";
        setUserOfficeId(officeId);
        fetch("/api/orders/mine").then((r3) => r3.json()).then((o) => {
          if (o.success && o.data?.length > 0) {
            const last = o.data[0];
            setLastOrder({ name: last.dailyMenu.meal.name, price: last.totalAmount / last.quantity, imageUrl: last.dailyMenu.meal.imageUrl, restaurantName: last.dailyMenu.meal.restaurant.name, dailyMenuId: last.dailyMenuId });
          }
        }).catch(() => {});
        const userId = d.data.id || "";
        fetch(`/api/promos/active?officeId=${officeId}&userId=${userId}`).then((r2) => r2.json()).then((p) => { if (p.success && p.data) setActivePromo(p.data); }).catch(() => {});
      } else {
        fetch("/api/promos/active").then((r2) => r2.json()).then((p) => { if (p.success && p.data) setActivePromo(p.data); }).catch(() => {});
      }
    }).catch(() => {
      fetch("/api/promos/active").then((r2) => r2.json()).then((p) => { if (p.success && p.data) setActivePromo(p.data); }).catch(() => {});
    });
  }, []);

  function dismissBanner() { localStorage.setItem("chopdrop-banner-dismissed", "1"); setBannerDismissed(true); }

  useEffect(() => {
    if (!userOfficeId || !activeSlot) return;
    fetch(`/api/pool-price?officeId=${userOfficeId}&timeSlotId=${activeSlot}`).then((r) => r.json()).then((d) => { if (d.success && d.data) setPoolData(d.data); }).catch(() => {});
  }, [userOfficeId, activeSlot]);

  useEffect(() => {
    function handleScroll() { setShowStickyBar(window.scrollY > 140); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const slot = slots.find((s) => s.id === activeSlot) || slots[0];
  const allExpired = slots.every((s) => s.expired);

  function getEffectivePrice(mealId: string, basePrice: number): number {
    const pool = poolData.meals[mealId];
    return pool ? pool.poolPrice : basePrice;
  }

  function handleAddFixed(meal: MenuItem) {
    cart.addItem({ dailyMenuId: meal.id, name: meal.name, description: meal.description || "", imageUrl: meal.imageUrl, restaurantName: meal.restaurantName, price: getEffectivePrice(meal.id, meal.price) });
    setToast(meal.name);
    setTimeout(() => setToast(""), 2000);
  }

  function handleSetReminder() {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(7, 0, 0, 0);
    localStorage.setItem("chopdrop-reminder-set", "true"); localStorage.setItem("chopdrop-reminder-time", tomorrow.toISOString());
    setReminderSet(true);
  }

  function handlePreorderAdd(item: MenuItem) {
    cart.addItem({ dailyMenuId: item.id, name: item.name, description: item.description || "", imageUrl: item.imageUrl, restaurantName: item.restaurantName, price: getEffectivePrice(item.id, item.price) });
    setPreorderToast(item.name);
    setTimeout(() => setPreorderToast(""), 2200);
  }

  // Compute pool progress
  const totalOrdered = slot && !slot.expired ? slot.items.reduce((sum, i) => { const maxO = i.tag === "DEAL" ? 20 : 50; return sum + Math.max(0, maxO - i.remaining); }, 0) : 0;
  const poolPct = Math.min(100, (poolData.officeOrderCount / 15) * 100);
  const nextDiscount = poolData.officeOrderCount >= 15 ? 30 : poolData.officeOrderCount >= 10 ? 20 : poolData.officeOrderCount >= 5 ? 10 : 0;
  const nextTierTarget = nextDiscount >= 30 ? 0 : nextDiscount >= 20 ? 20 : nextDiscount >= 10 ? 15 : 5;
  const moreForNextTier = nextTierTarget > 0 ? Math.max(0, nextTierTarget - poolData.officeOrderCount) : 0;

  /* ═══════════════════════════════════════════════════════ */
  /* RENDER                                                  */
  /* ═══════════════════════════════════════════════════════ */
  return (
    <main className="flex-1 max-w-[480px] lg:max-w-[1120px] mx-auto w-full pb-24 lg:pb-8" style={{ background: "var(--bg)" }}>

      {/* ── URGENCY HEADER — always visible, dark, dominant ── */}
      <header className="sticky top-0 z-40" style={{ background: "var(--dark)" }}>
        <div className="px-5 py-3 lg:max-w-[1120px] lg:mx-auto">
          {/* Row 1: Office name + timer + cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-[15px] font-bold text-white truncate">{officeName || "ChopDrop"}</h1>
              {slot && !slot.expired && totalOrdered > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--emerald)" }} />
                  <span className="text-[12px] font-medium text-white/50">{totalOrdered} ordering</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {slot && !slot.expired && <CountdownTimer cutoffTime={slot.cutoffTime} compact />}
              <Link href="/cart" className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center lg:hidden">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                {cart.totalItems > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>{cart.totalItems}</span>}
              </Link>
            </div>
          </div>

          {/* Row 2: Slot tabs — segmented control */}
          {slots.length > 1 && (
            <div className="flex mt-2.5 rounded-full p-[3px]" style={{ background: "rgba(255,255,255,0.08)" }}>
              {slots.map((s) => {
                const isActive = s.id === activeSlot;
                const itemCount = s.items.filter(i => i.type !== "BUILD_YOUR_PLATE").length;
                return (
                  <button key={s.id} type="button" onClick={() => setActiveSlot(s.id)}
                    className={`flex-1 h-9 rounded-full text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${isActive ? "bg-white text-[var(--dark)]" : "text-white/60 hover:text-white/80"}`}>
                    {getSlotShortName(s.label)}
                    {s.expired ? (
                      <span className="text-[10px] font-medium opacity-50">Closed</span>
                    ) : (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-[var(--coral)] text-white" : "bg-white/15 text-white/60"}`}>{itemCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── Desktop layout ── */}
      <div className="lg:flex lg:gap-8 lg:px-5 lg:pt-5">
      <div className="flex-1 min-w-0">

      {/* ── SOCIAL PROOF: Live activity bar ── */}
      {slot && !slot.expired && totalOrdered > 0 && (
        <div className="mx-5 mt-4 flex items-center gap-3 p-3 rounded-[14px]" style={{ background: "var(--emerald)", color: "white" }}>
          {/* Avatar stack */}
          <div className="flex -space-x-2 shrink-0">
            {["T", "B", "A", "E", "K"].slice(0, Math.min(totalOrdered, 5)).map((initial, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ borderColor: "var(--emerald)", background: ["#E8604C", "#D4A24E", "#141413", "#0D9F5F", "#71706E"][i % 5], zIndex: 5 - i }}>
                {initial}
              </div>
            ))}
            {totalOrdered > 5 && (
              <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold bg-white/20" style={{ borderColor: "var(--emerald)" }}>
                +{totalOrdered - 5}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight">
              {totalOrdered} colleague{totalOrdered !== 1 ? "s" : ""} ordering right now
            </p>
            <p className="text-[11px] text-white/60">
              {officeName ? `from ${officeName}` : "Join the pool to save together"}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
        </div>
      )}

      {/* ── PRICE TIER LADDER — makes pool pricing crystal clear ── */}
      {slot && !slot.expired && (() => {
        const tiers = [
          { min: 0, pct: 0, label: "Full price" },
          { min: 5, pct: 10, label: "10% off" },
          { min: 10, pct: 20, label: "20% off" },
          { min: 15, pct: 30, label: "30% off" },
        ];
        const orders = poolData.officeOrderCount;
        const currentTierIdx = orders >= 15 ? 3 : orders >= 10 ? 2 : orders >= 5 ? 1 : 0;
        // Example meal price for context (use cheapest available)
        const examplePrice = slot.items.filter(i => i.type !== "BUILD_YOUR_PLATE" && i.price > 0).sort((a, b) => a.price - b.price)[0]?.price || 200000;

        return (
          <div className="mx-5 mt-3 rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>Pool pricing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--emerald)" }} />
                <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--emerald)" }}>{orders} orders now</span>
              </div>
            </div>

            {/* Tier steps */}
            <div className="px-4 pb-4">
              <div className="flex gap-1.5">
                {tiers.map((tier, i) => {
                  const isActive = i === currentTierIdx;
                  const isUnlocked = i <= currentTierIdx;
                  const isNext = i === currentTierIdx + 1;
                  const moreNeeded = isNext ? tier.min - orders : 0;
                  const tierPrice = Math.round(examplePrice * (1 - tier.pct / 100));

                  return (
                    <div key={i} className="flex-1">
                      {/* Bar segment */}
                      <div className="h-2 rounded-full mb-2" style={{
                        background: isUnlocked
                          ? (i === 3 ? "var(--emerald)" : i === 2 ? "var(--emerald)" : i === 1 ? "var(--gold)" : "var(--coral)")
                          : "var(--sand)",
                        opacity: isUnlocked ? 1 : 0.5,
                      }} />
                      {/* Label */}
                      <div className={`rounded-[10px] p-2 text-center transition-all ${isActive ? "ring-2 ring-[var(--coral)]" : ""}`} style={{
                        background: isActive ? (i >= 2 ? "var(--emerald)" : i === 1 ? "var(--gold)" : "var(--sand)") : "var(--sand)",
                        opacity: isUnlocked || isNext ? 1 : 0.5,
                      }}>
                        <div className="text-[11px] font-extrabold" style={{ color: isActive && i >= 1 ? "white" : "var(--text)" }}>
                          {tier.pct === 0 ? "0%" : `${tier.pct}%`}
                        </div>
                        <div className="text-[10px] font-bold tabular-nums mt-0.5" style={{ color: isActive && i >= 1 ? "white/80" : "var(--text-secondary)" }}>
                          {formatPrice(tierPrice)}
                        </div>
                        <div className="text-[9px] mt-0.5" style={{ color: isActive && i >= 1 ? "white/60" : "var(--text-muted)" }}>
                          {tier.min === 0 ? "1-4" : `${tier.min}+`}
                        </div>
                      </div>
                      {/* "Next" indicator */}
                      {isNext && moreNeeded > 0 && (
                        <div className="text-center mt-1.5">
                          <span className="text-[10px] font-bold" style={{ color: "var(--coral)" }}>{moreNeeded} more</span>
                        </div>
                      )}
                      {isActive && (
                        <div className="text-center mt-1.5">
                          <span className="text-[10px] font-bold" style={{ color: "var(--emerald)" }}>You&apos;re here</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How it works explanation */}
            <div className="px-4 pb-4 -mt-1">
              <div className="flex items-start gap-2.5 p-3 rounded-[12px]" style={{ background: "var(--sand)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {orders === 0
                    ? "Order now at full price. As colleagues join, you get the difference as credit for your next meal."
                    : orders >= 15
                    ? "Best tier reached! Everyone who ordered today gets credits for the discount."
                    : "You pay now. When the pool closes, you get credit for any price drop."
                  }
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── How it works — first-time ONLY, compact ── */}
      {!bannerDismissed && (
        <div className="mx-5 mt-4 rounded-[16px] p-4" style={{ background: "var(--dark)" }}>
          <div className="space-y-2 mb-3">
            {[
              { t: "Pick your meal, pay on your phone", d: "Browse vendors and build your plate" },
              { t: "Fresh food delivered to your office", d: "₦0 delivery when you order together" },
              { t: "Collect with your code", d: "No cash, no wrong orders" },
            ].map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">{s.t}</div>
                  <div className="text-[12px] text-white/40">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={dismissBanner} className="w-full h-10 rounded-full text-[14px] font-bold text-white cursor-pointer" style={{ background: "var(--coral)" }}>
            Show me food
          </button>
        </div>
      )}

      {/* ── Quick reorder — FIRST thing returning users see ── */}
      {lastOrder && !allExpired && slot && !slot.expired && (
        <div className="mx-5 mt-4">
          <div
            className="rounded-[16px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={() => {
              const match = slot.items.find((i) => i.name === lastOrder.name);
              if (match) { handleAddFixed(match); } else {
                cart.addItem({ dailyMenuId: lastOrder.dailyMenuId, name: lastOrder.name, description: "", imageUrl: lastOrder.imageUrl, restaurantName: lastOrder.restaurantName, price: lastOrder.price });
                setToast(lastOrder.name); setTimeout(() => setToast(""), 2000);
              }
            }}
          >
            <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
              {lastOrder.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lastOrder.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>Reorder</div>
              <div className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{lastOrder.name}</div>
              <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{lastOrder.restaurantName} · {formatPrice(lastOrder.price)}</div>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
          </div>
        </div>
      )}

      {/* ── Promo banner (simplified — show one line, not a giant card) ── */}
      {activePromo && (() => {
        const p = activePromo;
        const reward = formatPromoReward(p.rewardAmount);
        if (p.type === "GROUP_CASHBACK") {
          const current = p.progress.officeOrderCount;
          const target = p.minOrders;
          const remaining = Math.max(0, target - current);
          const unlocked = remaining === 0;
          return (
            <div className="mx-5 mt-3 rounded-[12px] p-3 flex items-center gap-3" style={{ background: unlocked ? "var(--emerald)" : "var(--sand)", border: unlocked ? "none" : "1px solid var(--border)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={unlocked ? "white" : "var(--gold)"} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              <span className="text-[13px] font-semibold flex-1" style={{ color: unlocked ? "white" : "var(--text)" }}>
                {unlocked ? `${reward} cashback unlocked!` : `${remaining} more orders for ${reward} cashback`}
              </span>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: unlocked ? "white/70" : "var(--text-muted)" }}>{current}/{target}</span>
            </div>
          );
        }
        if (p.type === "EARLY_BIRD") {
          return (
            <div className="mx-5 mt-3 rounded-[12px] p-3 flex items-center gap-3" style={{ background: "var(--sand)", border: "1px solid var(--border)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Order before <span style={{ color: "var(--coral)" }}>{p.cutoffTime || "8:00 AM"}</span> — save {reward}</span>
            </div>
          );
        }
        if (p.type === "FIRST_ORDER") {
          return (
            <div className="mx-5 mt-3 rounded-[12px] p-3 flex items-center gap-3" style={{ background: "var(--coral)", border: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
              <span className="text-[13px] font-semibold text-white">{p.rewardType === "FREE_DELIVERY" ? "Free delivery on your first order!" : `${reward} off your first order`}</span>
            </div>
          );
        }
        return null;
      })()}

      {/* ═══════════════════════════════════════════════ */}
      {/*  ACTIVE SLOT — Food-first meal cards             */}
      {/* ═══════════════════════════════════════════════ */}
      {slot && !slot.expired && !allExpired && (
        <>
          {/* Section: Vendor restaurants with individual meals */}
          {(() => {
            const byRestaurant = new Map<string, { name: string; imageUrl: string | null; items: MenuItem[]; hasBuild: boolean; }>();
            for (const item of slot.items) {
              if (!byRestaurant.has(item.restaurantId)) byRestaurant.set(item.restaurantId, { name: item.restaurantName, imageUrl: item.restaurantImageUrl, items: [], hasBuild: false });
              const r = byRestaurant.get(item.restaurantId)!;
              if (item.type === "BUILD_YOUR_PLATE" || item.name.toLowerCase().includes("build")) { r.hasBuild = true; continue; }
              r.items.push(item);
            }

            return Array.from(byRestaurant.entries()).map(([rId, rData]) => (
              <section key={rId} className="mt-8 px-5">
                {/* Vendor header — bold with background */}
                <div className="flex items-center gap-3 mb-3 p-3 rounded-[14px]" style={{ background: "var(--sand)" }}>
                  <div className="w-11 h-11 rounded-[12px] overflow-hidden shrink-0 border-2 border-white">
                    {rData.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rData.imageUrl} alt={rData.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[13px] font-bold" style={{ background: "var(--card)", color: "var(--text-muted)" }}>{rData.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-extrabold truncate" style={{ color: "var(--text)" }}>{rData.name}</h2>
                    <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{rData.items.length} meals{rData.hasBuild ? " · custom plates" : ""}</p>
                  </div>
                  {rData.hasBuild && (
                    <Link href={`/restaurant/${rId}`} className="h-9 px-5 rounded-full text-[13px] font-bold flex items-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.97]" style={{ background: "var(--coral)", color: "white" }}>
                      Build Plate
                    </Link>
                  )}
                </div>

                {/* Meal cards — FOOD FIRST, large photos */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {rData.items.map((meal) => {
                    const cartQty = cart.items.find((i) => i.dailyMenuId === meal.id)?.quantity || 0;
                    const effectivePrice = getEffectivePrice(meal.id, meal.price);
                    const hasPoolDiscount = poolData.meals[meal.id] && poolData.meals[meal.id].savings > 0;
                    const maxOrders = meal.tag === "DEAL" ? 20 : 50;
                    const mealOrders = Math.max(0, maxOrders - meal.remaining);
                    const isPopular = mealOrders >= 3;

                    return (
                      <div key={meal.id} className="rounded-[16px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: cartQty > 0 ? "2px solid var(--coral)" : "1px solid var(--border)" }} onClick={() => handleAddFixed(meal)}>
                        {/* Large food photo */}
                        <div className="relative h-[130px] lg:h-[160px]" style={{ background: "var(--sand)" }}>
                          {meal.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                            </div>
                          )}
                          {/* Add/quantity button */}
                          <div className="absolute bottom-2 right-2" onClick={(e) => e.stopPropagation()}>
                            {cartQty > 0 ? (
                              <div className="flex items-center rounded-full h-8" style={{ background: "var(--coral)" }}>
                                <button type="button" onClick={() => cart.changeQuantity(meal.id, -1)} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                                </button>
                                <span className="text-white text-[13px] font-bold min-w-[18px] text-center tabular-nums">{cartQty}</span>
                                <button type="button" onClick={() => handleAddFixed(meal)} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => handleAddFixed(meal)} className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform" style={{ background: "var(--coral)" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            )}
                          </div>
                          {/* Pool discount badge */}
                          {hasPoolDiscount && (
                            <div className="absolute top-2 left-2 h-6 px-2 rounded-full flex items-center text-[11px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                              {Math.round((poolData.meals[meal.id].savings / poolData.meals[meal.id].basePrice) * 100)}% off
                            </div>
                          )}
                          {/* Popularity indicator */}
                          {isPopular && !hasPoolDiscount && (
                            <div className="absolute top-2 left-2 h-6 px-2 rounded-full flex items-center gap-1 text-[11px] font-bold" style={{ background: "var(--card)", color: "var(--coral)" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--coral)" stroke="none"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                              {mealOrders} ordered
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <h3 className="text-[14px] font-bold leading-snug" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {meal.name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "")}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(effectivePrice)}</span>
                            {hasPoolDiscount && <span className="text-[12px] line-through" style={{ color: "var(--text-muted)" }}>{formatPrice(poolData.meals[meal.id].basePrice)}</span>}
                            {meal.originalPrice && meal.originalPrice > meal.price && !hasPoolDiscount && (
                              <span className="text-[12px] line-through" style={{ color: "var(--text-muted)" }}>{formatPrice(meal.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ));
          })()}

          {/* ── INVITE NUDGE — selfish incentive to share ── */}
          {slot && !slot.expired && moreForNextTier > 0 && moreForNextTier <= 5 && officeName && (
            <div className="mx-5 mt-5 rounded-[20px] p-5 relative overflow-hidden" style={{ background: "var(--dark)" }}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--gold)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold text-white">
                      {moreForNextTier === 1 ? "1 more person" : `${moreForNextTier} more people`} for {nextDiscount >= 10 ? (nextDiscount + 10) : 10}% off
                    </p>
                    <p className="text-[12px] text-white/50">Everyone in {officeName} saves on every meal</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hey! We're ${moreForNextTier} people away from ${nextDiscount >= 10 ? (nextDiscount + 10) : 10}% off lunch at ${officeName}. Order on ChopDrop before the pool closes!\n\n${typeof window !== "undefined" ? window.location.origin : ""}/menu`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 w-full h-11 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold text-white active:scale-[0.97] transition-transform cursor-pointer"
                  style={{ background: "#25d366" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  Nudge a colleague on WhatsApp
                </a>
              </div>
              {/* Decorative */}
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full border border-white/[0.04]" />
              <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full border border-white/[0.04]" />
            </div>
          )}

          {/* Combo deals — visually distinct section */}
          {slot.items.some((i) => i.tag === "DEAL") && (
            <section className="mt-8 pb-4 pt-5 mx-5 rounded-[20px]" style={{ background: "var(--dark)" }}>
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="text-[18px] font-extrabold text-white">Today&apos;s deals</h2>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "var(--coral)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-[10px] font-bold text-white">Limited</span>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pl-5 pr-3 pb-5 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-5">
                {slot.items.filter((i) => i.tag === "DEAL").map((deal) => {
                  const cartQty = cart.items.find((i) => i.dailyMenuId === deal.id)?.quantity || 0;
                  const maxSpots = deal.maxDeals || 20;
                  const realClaimed = maxSpots - deal.remaining;
                  const claimed = Math.min(maxSpots - 1, realClaimed + (deal.claimedPad || 0));
                  const pctClaimed = Math.min(100, Math.round((claimed / maxSpots) * 100));
                  const hasDiscount = deal.originalPrice && deal.originalPrice > deal.price;

                  return (
                    <div key={deal.id} className="flex-shrink-0 w-[220px] lg:w-auto rounded-[16px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={() => handleAddFixed(deal)}>
                      <div className="relative h-[120px]" style={{ background: "var(--sand)" }}>
                        {deal.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                          </div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 h-6 px-2 rounded-full flex items-center text-[11px] font-bold text-white" style={{ background: "var(--emerald)" }}>
                            Save {formatPrice((deal.originalPrice || 0) - deal.price)}
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2" onClick={(e) => e.stopPropagation()}>
                          {cartQty > 0 ? (
                            <div className="flex items-center rounded-full h-8" style={{ background: "var(--coral)" }}>
                              <button type="button" onClick={() => cart.changeQuantity(deal.id, -1)} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg></button>
                              <span className="text-white text-[12px] font-bold min-w-[16px] text-center">{cartQty}</span>
                              <button type="button" onClick={() => handleAddFixed(deal)} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => handleAddFixed(deal)} className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform" style={{ background: "var(--coral)" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-[14px] font-bold leading-snug" style={{ color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {deal.name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "")}
                        </h3>
                        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{deal.restaurantName}</div>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(getEffectivePrice(deal.id, deal.price))}</span>
                          {deal.originalPrice && deal.originalPrice > deal.price && (
                            <span className="text-[12px] line-through" style={{ color: "var(--text-muted)" }}>{formatPrice(deal.originalPrice)}</span>
                          )}
                        </div>
                        {/* Claimed bar + urgency */}
                        <div className="mt-2.5">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pctClaimed, 5)}%`, background: pctClaimed > 80 ? "var(--coral)" : "var(--gold)" }} />
                          </div>
                          <div className="text-[11px] font-semibold mt-1" style={{ color: deal.remaining <= 3 ? "var(--coral)" : "var(--text-muted)" }}>
                            {deal.remaining <= 0 ? "Sold out" : deal.remaining <= 3 ? `Only ${deal.remaining} left!` : deal.remaining <= 5 ? `${deal.remaining} spots left` : `${maxSpots - claimed} spots open`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/*  ALL EXPIRED — tomorrow's preview                */}
      {/* ═══════════════════════════════════════════════ */}
      {allExpired && (
        <div className="px-5 pt-6 pb-4">
          <div className="rounded-[16px] p-5 mb-4" style={{ background: "var(--dark)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-white">Tomorrow&apos;s drop</h2>
                <p className="text-[14px] text-white/50 mt-1">Orders open at <span className="font-bold" style={{ color: "var(--gold)" }}>7:00 AM</span></p>
              </div>
              <Link href="/orders" className="h-9 px-4 rounded-full bg-white/10 text-white text-[13px] font-semibold flex items-center cursor-pointer">My orders</Link>
            </div>
          </div>

          {/* Reminder */}
          {reminderSet ? (
            <div className="flex items-center justify-center gap-2 rounded-[12px] p-3 mb-5" style={{ background: "var(--sand)", border: "1px solid var(--border)", animation: "reminderConfirm 0.4s ease" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Reminder set for 7:00 AM</span>
            </div>
          ) : (
            <button type="button" onClick={handleSetReminder} className="w-full h-12 rounded-full text-[14px] font-bold cursor-pointer active:scale-[0.98] transition-transform mb-5" style={{ background: "var(--gold)", color: "white" }}>
              Remind me when orders open
            </button>
          )}

          {/* Restaurant chips */}
          {slot && slot.restaurants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text)" }}>Kitchens</h3>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {slot.restaurants.map((r) => (
                  <Link key={r.id} href={`/restaurant/${r.id}`} className="flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 shrink-0 cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                      {(r.imageUrl || r.previewImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(r.imageUrl || r.previewImage)!} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{r.name.charAt(0)}</div>
                      )}
                    </div>
                    <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>{r.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Browsable menu preview */}
          {slot && slot.items.length > 0 && (
            <>
              <h3 className="text-[18px] font-bold mb-1" style={{ color: "var(--text)" }}>What&apos;s cooking</h3>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Tap + to pre-order. Ready when orders open.</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {slot.items.filter((i) => i.type !== "BUILD_YOUR_PLATE").slice(0, 6).map((item) => {
                  const cartQty = cart.items.find((i) => i.dailyMenuId === item.id)?.quantity || 0;
                  return (
                    <div key={item.id} className="rounded-[16px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={() => handlePreorderAdd(item)}>
                      <div className="relative h-[110px]" style={{ background: "var(--sand)" }}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2" onClick={(e) => e.stopPropagation()}>
                          {cartQty > 0 ? (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "var(--coral)" }}>{cartQty}</div>
                          ) : (
                            <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{item.name}</h3>
                        <div className="text-[14px] font-extrabold mt-0.5 tabular-nums" style={{ color: "var(--text)" }}>{formatPrice(item.price)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pre-order sticky bar */}
          {cart.totalItems > 0 && (
            <div className="fixed bottom-16 lg:bottom-8 left-0 right-0 z-50 lg:hidden" style={{ animation: "preorderBarIn 0.35s ease" }}>
              <div className="max-w-[480px] mx-auto px-4">
                <Link href="/cart" className="flex items-center justify-between rounded-full px-5 h-14 text-white active:scale-[0.98] transition-transform" style={{ background: "var(--dark)" }}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    <span className="text-[14px] font-bold">{cart.totalItems} pre-ordered</span>
                  </div>
                  <span className="text-[16px] font-bold tabular-nums">{formatPrice(cart.subtotal)}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Single slot expired — show other open slot ── */}
      {slot && slot.expired && !allExpired && (
        <div className="px-5 pt-8 pb-4 text-center">
          <h2 className="text-[20px] font-bold mb-2" style={{ color: "var(--text)" }}>{getSlotShortName(slot.label)} is closed</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>But there&apos;s more food waiting</p>
          {(() => {
            const openSlot = slots.find((s) => !s.expired);
            if (!openSlot) return null;
            return (
              <button type="button" onClick={() => setActiveSlot(openSlot.id)} className="h-12 px-8 rounded-full text-[15px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--coral)" }}>
                Show {getSlotShortName(openSlot.label)} menu
              </button>
            );
          })()}
        </div>
      )}

      {/* Cart floating bar — active slot */}
      {slot && !slot.expired && cart.totalItems > 0 && (
        <div className="fixed bottom-16 lg:bottom-8 left-0 right-0 z-50 lg:hidden" style={{ animation: "preorderBarIn 0.35s ease" }}>
          <div className="max-w-[480px] mx-auto px-4">
            <Link href="/cart" className="flex items-center justify-between rounded-full px-5 h-14 text-white active:scale-[0.98] transition-transform" style={{ background: "var(--coral)" }}>
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                <span className="text-[14px] font-bold">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
              </div>
              <span className="text-[16px] font-bold tabular-nums">{formatPrice(cart.subtotal)}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed z-[100] left-1/2 bottom-24 -translate-x-1/2 rounded-full pl-3 pr-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold text-white" style={{ background: "var(--dark)", animation: "toastIn 0.3s ease" }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          {toast} added
        </div>
      )}
      {preorderToast && (
        <div className="fixed z-[100] left-1/2 bottom-36 -translate-x-1/2 rounded-full pl-3 pr-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold text-white whitespace-nowrap" style={{ background: "var(--dark)", animation: "preorderToastIn 0.3s ease" }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          Pre-order saved
        </div>
      )}

      </div>{/* end left column */}
      <CartSidebar />
      </div>{/* end two-column layout */}

      <BottomNav />
    </main>
  );
}
