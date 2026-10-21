"use client";

import { useState, useEffect } from "react";
import { CountdownTimer } from "./countdown-timer";
import { BottomNav } from "./bottom-nav";
import { useCart } from "@/lib/cart";
import { getCustomerProfile } from "@/lib/customer";
import Link from "next/link";
import { Logo } from "@/components/logo";

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

function getSlotIcon(label: string): string {
  if (label.toLowerCase().includes("breakfast")) return "☀️";
  if (label.toLowerCase().includes("lunch")) return "🍛";
  return "🍽️";
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatPrice(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

interface ActivePromo {
  id: string;
  name: string;
  type: string;
  rewardAmount: number;
  rewardType: string;
  minOrders: number;
  cutoffTime: string | null;
  description: string | null;
  imageUrl: string | null;
  officeOnly: boolean;
  progress: {
    officeOrderCount: number;
    weeklyOrderCount: number;
  };
}

function formatPromoReward(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

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
  const cart = useCart();

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) setOfficeName(profile.officeName || "");
    const dismissed = localStorage.getItem("chopdrop-banner-dismissed");
    setBannerDismissed(!!dismissed);

    // Check if reminder was already set
    const savedReminder = localStorage.getItem("chopdrop-reminder-set");
    if (savedReminder === "true") setReminderSet(true);

    // Load captain name from server if authenticated
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.office) {
          if (d.data.office.name) setOfficeName(d.data.office.name);
          if (d.data.office.assistantName) setCaptainName(d.data.office.assistantName);
          // Fetch active promo with office context
          const officeId = d.data.office.id || "";
          const userId = d.data.id || "";
          fetch(`/api/promos/active?officeId=${officeId}&userId=${userId}`)
            .then((r2) => r2.json())
            .then((p) => { if (p.success && p.data) setActivePromo(p.data); })
            .catch(() => {});
        } else {
          // Fetch active promo without office context
          fetch("/api/promos/active")
            .then((r2) => r2.json())
            .then((p) => { if (p.success && p.data) setActivePromo(p.data); })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Fetch active promo even if auth fails
        fetch("/api/promos/active")
          .then((r2) => r2.json())
          .then((p) => { if (p.success && p.data) setActivePromo(p.data); })
          .catch(() => {});
      });
  }, []);

  function dismissBanner() {
    localStorage.setItem("chopdrop-banner-dismissed", "1");
    setBannerDismissed(true);
  }

  useEffect(() => {
    function handleScroll() { setShowStickyBar(window.scrollY > 180); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const slot = slots.find((s) => s.id === activeSlot) || slots[0];
  const allExpired = slots.every((s) => s.expired);

  function handleAddFixed(meal: MenuItem) {
    cart.addItem({
      dailyMenuId: meal.id, name: meal.name, description: meal.description || "",
      imageUrl: meal.imageUrl, restaurantName: meal.restaurantName, price: meal.price,
    });
    setToast(meal.name);
    setTimeout(() => setToast(""), 2000);
  }

  function handleSetReminder() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    localStorage.setItem("chopdrop-reminder-set", "true");
    localStorage.setItem("chopdrop-reminder-time", tomorrow.toISOString());
    setReminderSet(true);
  }

  function handlePreorderAdd(item: MenuItem) {
    cart.addItem({
      dailyMenuId: item.id, name: item.name, description: item.description || "",
      imageUrl: item.imageUrl, restaurantName: item.restaurantName, price: item.price,
    });
    setPreorderToast(item.name);
    setTimeout(() => setPreorderToast(""), 2200);
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <div className="h-4 w-px bg-black/[0.08]" />
            <div>
              <span className="text-[10px] text-[#9ca3af] font-medium block leading-none">{getGreeting()}</span>
              {officeName ? (
                <span className="text-[12px] font-semibold text-[#1a1a1a] leading-tight">{officeName}</span>
              ) : (
                <span className="text-[11px] text-[#9ca3af] leading-tight flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#22c55e] flex-shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
                  Serving Ikeja, Lagos
                </span>
              )}
            </div>
          </div>
          <Link href="/cart" className="relative w-9 h-9 rounded-full bg-[#f5f5f3] flex items-center justify-center hover:bg-[#eeedea] transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a1a1a]">
              <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            {cart.totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-[#f05f4b] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 shadow-[0_2px_8px_rgba(240,95,75,0.35)]">
                {cart.totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Sticky bar ── */}
      {showStickyBar && slot && !slot.expired && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a2e20]/95 backdrop-blur-lg text-white" style={{ animation: "slideDown 0.25s ease" }}>
          <div className="max-w-[480px] mx-auto flex items-center justify-between px-5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6ee7b7]">{getSlotShortName(slot.label)} drop</span>
            <div className="flex items-center gap-3">
              <CountdownTimer cutoffTime={slot.cutoffTime} compact />
              {cart.totalItems > 0 && (
                <Link href="/cart" className="flex items-center gap-1.5 bg-[#f05f4b] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(240,95,75,0.4)]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                  {cart.totalItems}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── How it works — first-time users ── */}
      {!bannerDismissed && (
        <div className="mx-5 mt-3 bg-[#0f4030] rounded-2xl px-4 py-4 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/[0.03] rounded-full" />
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-[#6ee7b7] uppercase tracking-[0.06em] mb-2.5">How ChopDrop works · Ikeja offices</div>
            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">1</div>
              <div>
                <div className="text-[12px] font-semibold text-white">Pick what you&apos;re eating today</div>
                <div className="text-[10px] text-white/50 mt-0.5">Choose your meal, pay on your phone</div>
              </div>
            </div>
            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">2</div>
              <div>
                <div className="text-[12px] font-semibold text-white">Cooked fresh, delivered to your office</div>
                <div className="text-[10px] text-white/50 mt-0.5">Fresh food at your desk, ₦0 delivery</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">3</div>
              <div>
                <div className="text-[12px] font-semibold text-white">Collect with your code — you paid ₦0 delivery</div>
                <div className="text-[10px] text-white/50 mt-0.5">No cash, no wrong orders, no delivery fee</div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="mt-3 w-full bg-white/10 text-white text-[11px] font-semibold py-2 rounded-lg active:scale-[0.98] transition-transform"
            >
              Got it, show me food
            </button>
          </div>
        </div>
      )}

      {/* ── FIX #1: Tabs — solid dark active, no borders ── */}
      {slots.length > 1 && (
        <div className="flex mx-5 mt-3 gap-2">
          {slots.map((s) => {
            const isActive = s.id === activeSlot;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlot(s.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-[#f5f5f3] text-[#9ca3af] hover:text-[#6b7280]"
                }`}
              >
                <span className="text-[14px]">{getSlotIcon(s.label)}</span>
                <span>{getSlotShortName(s.label)}</span>
                {s.expired && <span className="text-[8px] font-bold text-[#f05f4b] bg-[#f05f4b]/10 px-1.5 py-0.5 rounded-full ml-0.5">Closed</span>}
                {!s.expired && !isActive && <span className="text-[10px] font-normal">{getSlotDropTime(s.label)}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── FIX #2 & #3: Hero card — no emoji, social proof as pill below ── */}
      {slot && !slot.expired && (() => {
        const totalOrdered = slot.items.reduce((sum, i) => {
          const maxO = i.tag === "DEAL" ? 20 : 50;
          return sum + Math.max(0, maxO - i.remaining);
        }, 0);
        return (
          <>
            {/* ── Countdown — light card, not dark ── */}
            <div className="mx-5 mt-3 bg-white rounded-2xl border border-[#f0efeb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0f4030] flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#1a1a1a]">Time left to order</div>
                    <div className="text-[10px] text-[#9ca3af]">Food arrives {getSlotDropTime(slot.label) || `by ${slot.startTime}`}</div>
                  </div>
                </div>
                <CountdownTimer cutoffTime={slot.cutoffTime} compact />
              </div>
            </div>
            {/* FIX #3: Social proof as separate pill */}
            <div className="mx-5 mt-2 flex items-center justify-between text-[11px] text-[#6b7280]">
              <div className="flex items-center gap-2">
                {totalOrdered > 0 ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                    <span>{totalOrdered} {totalOrdered !== 1 ? "people" : "person"} ordered so far</span>
                  </>
                ) : officeName ? (
                  <span>Be the first from {officeName} to order today</span>
                ) : (
                  <span>Be the first to order today</span>
                )}
              </div>
              {captainName && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#0f4030] text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                    {captainName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] text-[#0f4030] font-medium">{captainName}</span>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Promo Banner ── */}
      {activePromo && (() => {
        const p = activePromo;
        const reward = formatPromoReward(p.rewardAmount);
        const rewardLabel = p.rewardType === "FREE_DELIVERY" ? "free delivery" : p.rewardType.toLowerCase();

        if (p.type === "GROUP_CASHBACK") {
          const current = p.progress.officeOrderCount;
          const target = p.minOrders;
          const remaining = Math.max(0, target - current);
          const pct = Math.min(100, Math.round((current / target) * 100));
          const unlocked = remaining === 0;
          const hasImage = !!p.imageUrl;
          // Dot indicators for each order slot
          const dots = Array.from({ length: target }, (_, i) => i < current);
          return (
            <div className="mx-5 mt-2.5 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              {hasImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl!} alt={p.name} className="w-full object-cover" style={{ maxHeight: 180 }} />
                  <div className="px-4 py-3" style={{ background: "#1a1a1a" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-white/90" style={{ fontFamily: "DM Sans, sans-serif" }}>
                        {unlocked ? "Cashback unlocked! Order to claim." : <>{remaining} more to unlock <span className="text-[#f5c565] font-bold">{reward} cashback</span></>}
                      </span>
                      <span className="text-[10px] font-bold text-white/40">{current}/{target}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {dots.map((filled, i) => (
                        <div
                          key={i}
                          className="h-[5px] rounded-full flex-1 transition-all duration-500"
                          style={{ background: filled ? (unlocked ? "#0f4030" : "#f05f4b") : "rgba(255,255,255,0.12)" }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-4 py-3.5" style={{ backgroundColor: "#fffbf0", border: "1px solid rgba(245,197,101,0.25)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#f5c565] flex items-center justify-center flex-shrink-0">
                      <span className="text-[12px]">&#x1F3AF;</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#92702a]">Office Group Deal</span>
                  </div>
                  <p className="text-[13px] font-bold leading-snug text-[#1a1a1a] mb-2.5" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {unlocked
                      ? <>You unlocked <span className="text-[#f05f4b]">{reward} {rewardLabel}</span>!</>
                      : <><span className="text-[#f05f4b]">{current}/{target}</span> orders &mdash; {remaining} more for <span className="text-[#0f4030]">{reward} {rewardLabel}</span></>
                    }
                  </p>
                  <div className="flex items-center gap-1.5">
                    {dots.map((filled, i) => (
                      <div
                        key={i}
                        className="h-[5px] rounded-full flex-1 transition-all duration-500"
                        style={{ background: filled ? (unlocked ? "#0f4030" : "#f05f4b") : "rgba(245,197,101,0.25)" }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (p.type === "EARLY_BIRD") {
          return (
            <div className="mx-5 mt-3 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #0F4030 0%, #0d3528 100%)" }}>
              <div className="relative px-4 py-3.5">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.04]" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-[22px]">&#x2615;</span>
                  <div>
                    <p className="text-white text-[14px] font-bold leading-snug" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Order before <span style={{ color: "#F5C565" }}>{p.cutoffTime || "8:00 AM"}</span> and save <span style={{ color: "#F05F4B" }}>{reward}</span>!
                    </p>
                    {p.description && <p className="text-white/50 text-[11px] mt-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>{p.description}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (p.type === "FIRST_ORDER") {
          return (
            <div className="mx-5 mt-3 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #0F4030 0%, #0d3528 100%)" }}>
              <div className="relative px-4 py-3.5">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.04]" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-[22px]">&#x1F389;</span>
                  <div>
                    <p className="text-white text-[14px] font-bold leading-snug" style={{ fontFamily: "Manrope, sans-serif" }}>
                      First order? Get <span style={{ color: "#F5C565" }}>{p.rewardType === "FREE_DELIVERY" ? "free delivery" : reward + " off"}</span>!
                    </p>
                    <p className="text-white/50 text-[11px] mt-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>{p.description || "Welcome to ChopDrop"}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (p.type === "REFER") {
          return (
            <div className="mx-5 mt-3 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #0F4030 0%, #0d3528 100%)" }}>
              <div className="relative px-4 py-3.5">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.04]" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-[22px]">&#x1F91D;</span>
                  <div>
                    <p className="text-white text-[14px] font-bold leading-snug" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Share your office code &mdash; both get <span style={{ color: "#F5C565" }}>{reward} off</span>!
                    </p>
                    <p className="text-white/50 text-[11px] mt-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>{p.description || "Invite colleagues and save together"}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (p.type === "WEEKLY_LOYALTY") {
          const weekOrders = p.progress.weeklyOrderCount;
          const target = p.minOrders;
          const remaining = Math.max(0, target - weekOrders);
          const pct = Math.min(100, Math.round((weekOrders / target) * 100));
          return (
            <div className="mx-5 mt-3 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #0F4030 0%, #0d3528 100%)" }}>
              <div className="relative px-4 py-3.5">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.04]" />
                <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-white/[0.03]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[16px]">&#x1F525;</span>
                    <span className="text-[10px] font-bold text-[#6ee7b7] uppercase tracking-[0.08em]">Weekly Loyalty</span>
                  </div>
                  <p className="text-white text-[14px] font-bold leading-snug" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {remaining === 0
                      ? <>You earned <span style={{ color: "#F5C565" }}>{reward} off</span> your next order!</>
                      : <><span style={{ color: "#F05F4B" }}>{weekOrders}</span> orders this week = <span style={{ color: "#F5C565" }}>{reward} off</span> next order!</>
                    }
                  </p>
                  <div className="mt-2.5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: "#F05F4B" }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/40 text-[10px]" style={{ fontFamily: "DM Sans, sans-serif" }}>{weekOrders} of {target} orders</span>
                    {remaining > 0 && <span className="text-[#F5C565] text-[10px] font-bold">{remaining} to go</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* ── Content ── */}
      {allExpired ? (
        <div className="px-5 py-4">
          {/* ── Premium closed banner with gradient + reminder ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f4030] to-[#0a2e20] p-4 mb-3">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#f5c565]/10" />
            <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-[#f05f4b]/10" />
            <div className="relative flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c565" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-white">Tomorrow&apos;s Drop</div>
                <div className="text-[11px] text-white/60 mt-0.5">Orders open at <span className="text-[#f5c565] font-bold">7:00 AM</span></div>
              </div>
              <Link href="/orders" className="text-[11px] font-bold text-white bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl flex-shrink-0 active:scale-95 transition-transform">
                My orders
              </Link>
            </div>
          </div>

          {/* ── Reminder button ── */}
          <div className="mb-5">
            {reminderSet ? (
              <div className="flex items-center justify-center gap-2 bg-[#f5c565]/10 border border-[#f5c565]/20 rounded-xl px-4 py-2.5" style={{ animation: "reminderConfirm 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <div className="w-5 h-5 rounded-full bg-[#f5c565] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                </div>
                <span className="text-[12px] font-semibold text-[#92702a]">You&apos;ll be reminded at 7:00 AM</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSetReminder}
                className="w-full flex items-center justify-center gap-2.5 bg-[#f5c565] rounded-xl px-4 py-3 active:scale-[0.97] transition-all duration-200 shadow-[0_2px_8px_rgba(245,197,101,0.3)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a3e00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="text-[13px] font-bold text-[#5a3e00]">Remind me when orders open</span>
              </button>
            )}
          </div>

          {/* ── Restaurant chips — horizontal scroll ── */}
          {slot && slot.restaurants.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.08em]">Kitchens</h3>
                <span className="text-[10px] text-[#9ca3af]">{slot.restaurants.length} available</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                {slot.restaurants.map((r) => (
                  <Link key={r.id} href={`/restaurant/${r.id}`} className="flex items-center gap-2.5 bg-white rounded-2xl py-2.5 pl-3 pr-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#f0efeb]/80 flex-shrink-0 active:scale-[0.97] transition-transform">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#f5f5f3] to-[#eceae4] flex-shrink-0">
                      {(r.imageUrl || r.previewImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(r.imageUrl || r.previewImage)!} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#0f4030]/25 text-[13px] font-bold">
                          {r.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1a1a1a] whitespace-nowrap">{r.name}</div>
                      <div className="text-[10px] text-[#0f4030] font-medium">{r.mealCount} meal{r.mealCount !== 1 ? "s" : ""}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 ml-1"><path d="m9 18 6-6-6-6" /></svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Full browsable menu with pre-order ── */}
          {slot && slot.items.length > 0 && (
            <>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-[20px] text-[#1a1a1a] tracking-[-0.03em]">What&apos;s cooking</h3>
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">Tap + to pre-order. Ready when orders open.</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#f05f4b] bg-[#f05f4b]/[0.08] px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f05f4b] animate-pulse" />
                  Preview
                </div>
              </div>

              {/* Group by restaurant */}
              {(() => {
                const byRestaurant = new Map<string, { name: string; imageUrl: string | null; items: MenuItem[]; hasBuildMenu: boolean; buildItemCount: number; cheapestPrice: number }>();
                for (const item of slot.items) {
                  if (!byRestaurant.has(item.restaurantId)) {
                    byRestaurant.set(item.restaurantId, { name: item.restaurantName, imageUrl: item.restaurantImageUrl, items: [], hasBuildMenu: false, buildItemCount: 0, cheapestPrice: Infinity });
                  }
                  const rEntry = byRestaurant.get(item.restaurantId)!;
                  // Track BUILD items but don't show them as cards
                  if (item.type === "BUILD" || item.name.toLowerCase().includes("full menu")) {
                    rEntry.hasBuildMenu = true;
                    if (item.categories) {
                      for (const cat of item.categories) rEntry.buildItemCount += cat.items.length;
                      for (const cat of item.categories) for (const ci of cat.items) { if (ci.price < rEntry.cheapestPrice) rEntry.cheapestPrice = ci.price; }
                    }
                    continue;
                  }
                  rEntry.items.push(item);
                }
                return Array.from(byRestaurant.entries()).map(([rId, rData]) => (
                  <div key={rId} className="mb-7">
                    {/* Restaurant header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#f5f5f3] to-[#eceae4] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                        {rData.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rData.imageUrl} alt={rData.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#0f4030]/30">
                            {rData.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-[15px] font-bold text-[#1a1a1a] tracking-[-0.01em]">{rData.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-[#9ca3af] bg-[#f5f5f3] px-2 py-0.5 rounded-md">{rData.items.length} items</span>
                    </div>

                    {/* Menu items with pre-order buttons */}
                    <div className="space-y-2">
                      {rData.items.map((item) => {
                        const cartQty = cart.items.find((i) => i.dailyMenuId === item.id)?.quantity || 0;
                        const isInCart = cartQty > 0;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3.5 bg-white rounded-2xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border transition-all duration-200 ${
                              isInCart
                                ? "border-l-[3px] border-l-[#f05f4b] border-t-[#f05f4b]/15 border-r-[#f05f4b]/15 border-b-[#f05f4b]/15 shadow-[0_1px_6px_rgba(240,95,75,0.08)]"
                                : "border-[#f0efeb]/60"
                            }`}
                          >
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#f5f5f3] to-[#eceae4] flex-shrink-0">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[32px]">🍽️</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-semibold text-[#1a1a1a] leading-tight">{item.name}</div>
                              {item.description && <div className="text-[11px] text-[#9ca3af] mt-0.5 truncate">{item.description}</div>}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[14px] font-bold text-[#0f4030] tracking-[-0.02em]">{formatPrice(item.price)}</span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-[11px] text-[#d1d5db] line-through">{formatPrice(item.originalPrice)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {isInCart ? (
                                <div className="flex items-center bg-[#f05f4b] rounded-full shadow-[0_2px_8px_rgba(240,95,75,0.3)]">
                                  <button
                                    type="button"
                                    onClick={() => cart.changeQuantity(item.id, -1)}
                                    className="w-[30px] h-[30px] flex items-center justify-center text-white active:scale-90 transition-transform"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                                  </button>
                                  <span className="text-white text-[12px] font-bold min-w-[16px] text-center">{cartQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handlePreorderAdd(item)}
                                    className="w-[30px] h-[30px] flex items-center justify-center text-white active:scale-90 transition-transform"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePreorderAdd(item)}
                                  className="w-9 h-9 rounded-full bg-[#f05f4b] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(240,95,75,0.3)] active:scale-95 transition-transform"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Build Your Own Plate — removed, kitchen chips are now tappable */}
                  </div>
                ));
              })()}

              {/* ── Premium CTA card ── */}
              <div className="relative overflow-hidden mt-6 mb-2 rounded-2xl bg-gradient-to-br from-[#0f4030] to-[#0a2e20] p-5 text-center">
                <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-[#f05f4b]/10" />
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#f5c565]/10" />
                <div className="relative">
                  <p className="text-[16px] font-bold text-white mb-1">Want this for your office?</p>
                  <p className="text-[12px] text-white/60 mb-4">₦0 delivery. Everyone picks &amp; pays individually.</p>
                  <a
                    href="https://wa.me/2349120532827?text=Hi!%20I%20want%20ChopDrop%20for%20my%20office"
                    className="inline-flex items-center gap-2.5 bg-[#f05f4b] text-white font-bold text-[14px] px-6 py-3 rounded-xl shadow-[0_4px_16px_rgba(240,95,75,0.3)] active:scale-95 transition-transform"
                  >
                    Get ChopDrop for your office
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                  </a>
                </div>
              </div>
            </>
          )}

          {/* ── Pre-order sticky bottom bar ── */}
          {cart.totalItems > 0 && (
            <div className="fixed bottom-16 left-0 right-0 z-50" style={{ animation: "preorderBarIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <div className="max-w-[480px] mx-auto px-4">
                <Link
                  href="/cart"
                  className="flex items-center justify-between bg-[#0f4030] text-white rounded-2xl px-4 py-3.5 shadow-[0_4px_20px_rgba(15,64,48,0.35)] active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} pre-ordered</div>
                      <div className="text-[10px] text-white/50">Ready when orders open</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{formatPrice(cart.subtotal)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/60"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : slot && slot.expired ? (
        <div className="px-5 pt-8 pb-4">
          {/* Closed header */}
          <div className="text-center mb-6">
            <div className="text-[36px] mb-2">{getSlotIcon(slot.label)}</div>
            <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">{getSlotShortName(slot.label)} is closed</h2>
            <p className="text-[#9ca3af] text-[13px]">
              {slots.find((s) => !s.expired) ? "But there's more food waiting..." : "Come back tomorrow."}
            </p>
          </div>

          {/* Preview of the open slot */}
          {(() => {
            const openSlot = slots.find((s) => !s.expired);
            if (!openSlot) return null;
            const openDeals = openSlot.items.filter((i) => i.tag === "DEAL").slice(0, 3);
            const openRestaurants = openSlot.restaurants.slice(0, 2);
            return (
              <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setActiveSlot(openSlot.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#0f4030] to-[#0d3528] text-white active:opacity-90 transition-opacity"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[18px]">{getSlotIcon(openSlot.label)}</span>
                    <div className="text-left">
                      <div className="text-[14px] font-bold">{getSlotShortName(openSlot.label)} is open</div>
                      <div className="text-[10px] text-white/50">{openRestaurants.length} kitchen{openRestaurants.length !== 1 ? "s" : ""}{openDeals.length > 0 ? ` · ${openDeals.length} deal${openDeals.length !== 1 ? "s" : ""}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-[11px] font-semibold">
                    Show {getSlotShortName(openSlot.label).toLowerCase()}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                  </div>
                </button>

                {/* Deal previews */}
                {openDeals.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    {openDeals.map((deal) => (
                      <div key={deal.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                          {deal.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[14px]">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-[#1a1a1a] truncate">{deal.name}</div>
                          <div className="text-[10px] text-[#9ca3af]">{deal.restaurantName}</div>
                        </div>
                        <span className="font-display font-bold text-[13px] text-[#1a1a1a] flex-shrink-0">{formatPrice(deal.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Restaurant previews */}
                {openRestaurants.length > 0 && openDeals.length === 0 && (
                  <div className="px-4 py-3 space-y-2">
                    {openRestaurants.map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                          {(r.imageUrl || r.previewImage) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(r.imageUrl || r.previewImage)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#e8f5e9] flex items-center justify-center text-[10px] font-bold text-[#0f4030]/30">{r.name.charAt(0)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-[#1a1a1a] truncate">{r.name}</div>
                          <div className="text-[10px] text-[#9ca3af]">{r.mealCount} meals · {r.address}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : slot && (
        <>
          {/* ── FIX #4 & #5: Drop combos on tinted bg, narrower cards ── */}
          {slot.items.some((i) => i.tag === "DEAL") && (
            <section className="mt-5 bg-[#faf9f7] py-5">
              <div className="px-5 flex items-center gap-2 mb-3">
                <h2 className="font-display font-bold text-[16px] text-[#1a1a1a] tracking-[-0.02em]">{getSlotShortName(slot.label)} drop combos</h2>
              </div>
              {/* FIX #4: 220px cards so 1.4 visible */}
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pl-5 pr-3 pb-1">
                {slot.items.filter((i) => i.tag === "DEAL").map((deal) => {
                  const originalPrice = deal.originalPrice;
                  const savings = originalPrice ? originalPrice - deal.price : 0;
                  const hasDiscount = originalPrice && originalPrice > deal.price;
                  const maxSpots = deal.maxDeals || 20;
                  const realClaimed = maxSpots - deal.remaining;
                  const claimed = Math.min(maxSpots - 1, realClaimed + (deal.claimedPad || 0));
                  const pctClaimed = Math.min(100, Math.round((claimed / maxSpots) * 100));
                  const cartQty = cart.items.find((i) => i.dailyMenuId === deal.id)?.quantity || 0;

                  return (
                    <div key={deal.id} onClick={() => handleAddFixed(deal)} className="flex-shrink-0 w-[220px] bg-white rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer active:scale-[0.98] transition-transform">
                      <div className="relative h-[120px]">
                        {deal.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#fef3f0] to-[#fdf6ed] flex items-center justify-center text-[32px]">🍽️</div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-white text-[#0f4030] text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            Save {formatPrice(savings)}
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2">
                          {cartQty > 0 ? (
                            <div className="flex items-center bg-[#f05f4b] rounded-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                              <button type="button" onClick={() => cart.changeQuantity(deal.id, -1)} className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                              </button>
                              <span className="text-white text-[12px] font-bold min-w-[16px] text-center">{cartQty}</span>
                              <button type="button" onClick={() => handleAddFixed(deal)} className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-white text-[#1a1a1a] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] active:scale-90 transition-transform ring-1 ring-black/[0.08]">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-[13px] text-[#1a1a1a] leading-tight">{deal.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {deal.restaurantImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={deal.restaurantImageUrl} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-[#f0efeb] text-[#9ca3af] flex items-center justify-center text-[7px] font-bold flex-shrink-0">
                              {deal.restaurantName.charAt(0)}
                            </div>
                          )}
                          <span className="text-[10px] text-[#9ca3af]">{deal.restaurantName}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="font-display font-bold text-[16px] text-[#1a1a1a]">{formatPrice(deal.price)}</span>
                          {hasDiscount && <span className="text-[12px] text-[#d1d5db] line-through">{formatPrice(originalPrice)}</span>}
                        </div>
                        {/* FIX #7: Smart progress text */}
                        <div className="mt-2.5">
                          <div className="h-[4px] bg-[#f0efeb] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#f05f4b] to-[#f5c565] rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.max(pctClaimed, 5)}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] mt-1">
                            <span className="font-medium text-[#6b7280]">
                              {claimed > 0 ? `${claimed}/${maxSpots} claimed` : `${maxSpots} discount spots available`}
                            </span>
                            {claimed > 0 && <span className="text-[#9ca3af]">{deal.remaining > 0 ? `${deal.remaining} left` : "Full price now"}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="mx-5 mt-5 h-px bg-black/[0.06]" />

          {/* Restaurants */}
          <section className="mt-5 px-5 pb-4">
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="font-display font-bold text-[16px] text-[#1a1a1a] tracking-[-0.02em]">
                Pick your {getSlotShortName(slot.label).toLowerCase()}
              </h2>
              <span className="text-[11px] text-[#9ca3af]">
                {slot.restaurants.length} kitchen{slot.restaurants.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {slot.restaurants.map((r) => {
                const initials = r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <Link
                    key={r.id}
                    href={`/restaurant/${r.id}`}
                    className="group block rounded-2xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300"
                  >
                    {/* FIX #6: Shorter image so card is fully visible */}
                    <div className="relative h-[150px] overflow-hidden">
                      {(r.imageUrl || r.previewImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(r.imageUrl || r.previewImage)!}
                          alt={r.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#e8f5e9] to-[#f5f5f3] flex items-center justify-center">
                          <span className="text-[#0f4030]/15 text-[48px] font-display font-extrabold">{initials}</span>
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                      {/* Meal count on image */}
                      <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[#1a1a1a] text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {r.mealCount} meal{r.mealCount !== 1 ? "s" : ""}
                      </div>
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#1a1a1a]"><path d="m9 18 6-6-6-6" /></svg>
                      </div>
                    </div>
                    <div className="px-3.5 py-3">
                      <h3 className="font-display font-bold text-[14px] text-[#1a1a1a] tracking-[-0.01em]">{r.name}</h3>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5">{r.address}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed z-[100] left-1/2 bottom-24 -translate-x-1/2 bg-[#1a1a1a] text-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)] pl-3 pr-4 py-2.5 flex items-center gap-2 text-[12px] font-semibold" style={{ animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div className="w-5 h-5 bg-[#6ee7b7] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          {toast} added
        </div>
      )}

      {/* ── Pre-order toast ── */}
      {preorderToast && (
        <div className="fixed z-[100] left-1/2 bottom-36 -translate-x-1/2 bg-[#0f4030] text-white rounded-full shadow-[0_4px_20px_rgba(15,64,48,0.35)] pl-3 pr-4 py-2.5 flex items-center gap-2 text-[12px] font-semibold whitespace-nowrap" style={{ animation: "preorderToastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div className="w-5 h-5 bg-[#f05f4b] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          Pre-order saved
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px) scale(0.95); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes reminderConfirm { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes preorderBarIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes preorderToastIn { from { opacity: 0; transform: translate(-50%, 8px) scale(0.92); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
      `}</style>
    </main>
  );
}
