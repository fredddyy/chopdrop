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
  restaurantAddress: string; startTime: string; endTime: string; remaining: number;
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

export function MenuContent({ slots, defaultSlotId }: MenuContentProps) {
  const [activeSlot, setActiveSlot] = useState(defaultSlotId);
  const [toast, setToast] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const cart = useCart();

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) setOfficeName(profile.officeName || "");
    const dismissed = localStorage.getItem("chopdrop-banner-dismissed");
    setBannerDismissed(!!dismissed);
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
                <span className="text-[12px] text-[#9ca3af] leading-tight">Ikeja, Lagos</span>
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
            <div className="text-[10px] font-bold text-[#6ee7b7] uppercase tracking-[0.06em] mb-2.5">How ChopDrop works</div>
            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">1</div>
              <div>
                <div className="text-[12px] font-semibold text-white">Pick & pay before cutoff</div>
                <div className="text-[10px] text-white/50 mt-0.5">Everyone orders individually online</div>
              </div>
            </div>
            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">2</div>
              <div>
                <div className="text-[12px] font-semibold text-white">Food arrives at your office</div>
                <div className="text-[10px] text-white/50 mt-0.5">All meals batched in one delivery</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">3</div>
              <div>
                <div className="text-[12px] font-semibold text-white">Collect with your code — free delivery</div>
                <div className="text-[10px] text-white/50 mt-0.5">No cash, no wrong orders, no wahala</div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="mt-3 w-full bg-white/10 text-white text-[11px] font-semibold py-2 rounded-lg active:scale-[0.98] transition-transform"
            >
              Got it, let me order
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
            <div className="mx-5 mt-3 bg-gradient-to-br from-[#0f4030] via-[#0d3528] to-[#0a2e20] text-white rounded-2xl px-4 py-3.5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/[0.03] rounded-full" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-[16px] leading-none tracking-[-0.02em]">
                    {getSlotShortName(slot.label)} Drop
                  </h2>
                  <p className="text-[10px] text-white/40 mt-1">
                    Arrives {getSlotDropTime(slot.label) || slot.startTime} · Prepaid
                  </p>
                </div>
                <CountdownTimer cutoffTime={slot.cutoffTime} compact />
              </div>
            </div>
            {/* FIX #3: Social proof as separate pill */}
            <div className="mx-5 mt-2 flex items-center gap-2 text-[11px] text-[#6b7280]">
              {totalOrdered > 0 ? (
                <>
                  <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                  <span>{totalOrdered} order{totalOrdered !== 1 ? "s" : ""} placed for this drop</span>
                </>
              ) : officeName ? (
                <span>Be the first from {officeName} to join today&apos;s drop</span>
              ) : (
                <span>Be the first to join today&apos;s {getSlotShortName(slot.label).toLowerCase()} drop</span>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Content ── */}
      {allExpired ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 bg-[#f5f5f3] rounded-full flex items-center justify-center mx-auto mb-4 text-[28px]">😴</div>
          <h2 className="font-display font-bold text-[20px] text-[#1a1a1a] mb-2">Today&apos;s orders are closed</h2>
          <p className="text-[#9ca3af] text-[13px] mb-6">Come back tomorrow for fresh meals.</p>
          <Link href="/orders" className="inline-flex items-center gap-2 text-[#0f4030] text-[13px] font-bold hover:underline">
            Check order status <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
      ) : slot && slot.expired ? (
        <div className="text-center py-16 px-6">
          <div className="text-[40px] mb-3">{getSlotIcon(slot.label)}</div>
          <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-2">{getSlotShortName(slot.label)} is closed</h2>
          <p className="text-[#9ca3af] text-[13px]">
            {slots.find((s) => !s.expired) ? (
              <>Switch to <button type="button" onClick={() => setActiveSlot(slots.find((s) => !s.expired)!.id)} className="text-[#0f4030] font-bold underline underline-offset-2">{getSlotShortName(slots.find((s) => !s.expired)!.label)}</button></>
            ) : "Come back tomorrow."}
          </p>
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
                  const originalPrice = deal.originalPrice || Math.round(deal.price * 1.25);
                  const savings = originalPrice - deal.price;
                  const maxSpots = deal.maxDeals || 20;
                  const realClaimed = maxSpots - deal.remaining;
                  const claimed = Math.min(maxSpots - 1, realClaimed + (deal.claimedPad || 0));
                  const pctClaimed = Math.min(100, Math.round((claimed / maxSpots) * 100));
                  const cartQty = cart.items.find((i) => i.dailyMenuId === deal.id)?.quantity || 0;

                  return (
                    <div key={deal.id} className="flex-shrink-0 w-[220px] bg-white rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]">
                      <div className="relative h-[120px]">
                        {deal.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#fef3f0] to-[#fdf6ed] flex items-center justify-center text-[32px]">🍽️</div>
                        )}
                        <div className="absolute top-2 left-2 bg-white text-[#0f4030] text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          Save {formatPrice(savings)}
                        </div>
                        <div className="absolute bottom-2 right-2">
                          {cartQty > 0 ? (
                            <div className="flex items-center bg-[#f05f4b] rounded-full shadow-lg">
                              <button type="button" onClick={() => cart.changeQuantity(deal.id, -1)} className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                              </button>
                              <span className="text-white text-[12px] font-bold min-w-[16px] text-center">{cartQty}</span>
                              <button type="button" onClick={() => handleAddFixed(deal)} className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => handleAddFixed(deal)} className="w-8 h-8 rounded-full bg-white text-[#1a1a1a] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] active:scale-90 transition-transform ring-1 ring-black/[0.08]">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-[13px] text-[#1a1a1a] leading-tight">{deal.name}</h3>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">{deal.restaurantName}</p>
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="font-display font-bold text-[16px] text-[#1a1a1a]">{formatPrice(deal.price)}</span>
                          <span className="text-[12px] text-[#d1d5db] line-through">{formatPrice(originalPrice)}</span>
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
                      {(r.previewImage || r.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(r.previewImage || r.imageUrl)!}
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

      <BottomNav />

      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px) scale(0.95); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
      `}</style>
    </main>
  );
}
