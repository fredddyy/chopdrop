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

export function MenuContent({ slots, defaultSlotId }: MenuContentProps) {
  const [activeSlot, setActiveSlot] = useState(defaultSlotId);
  const [toast, setToast] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const cart = useCart();

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) setOfficeName(profile.officeName || "");
    const dismissed = localStorage.getItem("chopdrop-banner-dismissed");
    setBannerDismissed(!!dismissed);

    // Load captain name from server if authenticated
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.office) {
          if (d.data.office.name) setOfficeName(d.data.office.name);
          if (d.data.office.assistantName) setCaptainName(d.data.office.assistantName);
        }
      })
      .catch(() => {});
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
            <div className="mx-5 mt-3 bg-gradient-to-br from-[#0f4030] via-[#0d3528] to-[#0a2e20] text-white rounded-2xl px-4 py-3.5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/[0.03] rounded-full" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-[16px] leading-none tracking-[-0.02em]">
                    {getSlotShortName(slot.label)} Drop
                  </h2>
                  <p className="text-[10px] text-white/40 mt-1">
                    Cooked fresh, arrives {getSlotDropTime(slot.label) || slot.startTime} · Prepaid
                  </p>
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

      {/* ── Content ── */}
      {allExpired ? (
        <div className="px-5 py-4">
          {/* Closed banner — compact, not a dead end */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fff8f0] border border-[#f5c565]/30 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#f5c565]/20 flex items-center justify-center flex-shrink-0 text-[18px]">🔔</div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-[#1a1a1a]">Orders open at 7:00 AM</div>
              <div className="text-[11px] text-[#9ca3af]">Browse tomorrow&apos;s menu below</div>
            </div>
            <Link href="/orders" className="text-[10px] font-bold text-[#0f4030] bg-[#0f4030]/[0.06] px-3 py-1.5 rounded-lg flex-shrink-0">
              My orders
            </Link>
          </div>

          {/* Tomorrow's restaurants */}
          {slot && slot.restaurants.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">Tomorrow&apos;s kitchens</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {slot.restaurants.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 bg-white rounded-xl p-3 border border-[#f0efeb] flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                      {(r.imageUrl || r.previewImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(r.imageUrl || r.previewImage)!} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#0f4030]/20 text-[14px] font-bold">
                          {r.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1a1a1a] whitespace-nowrap">{r.name}</div>
                      <div className="text-[10px] text-[#9ca3af]">{r.mealCount} meal{r.mealCount !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse the full menu — show all items even when closed */}
          {slot && slot.items.length > 0 && (
            <>
              <h3 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">Preview tomorrow&apos;s menu</h3>
              <p className="text-[11px] text-[#9ca3af] mb-4">See what&apos;s available. Ordering opens at 7:00 AM.</p>

              {/* Group by restaurant */}
              {(() => {
                const byRestaurant = new Map<string, { name: string; imageUrl: string | null; items: MenuItem[] }>();
                for (const item of slot.items) {
                  if (!byRestaurant.has(item.restaurantId)) {
                    byRestaurant.set(item.restaurantId, { name: item.restaurantName, imageUrl: item.restaurantImageUrl, items: [] });
                  }
                  byRestaurant.get(item.restaurantId)!.items.push(item);
                }
                return Array.from(byRestaurant.entries()).map(([rId, rData]) => (
                  <div key={rId} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                        {rData.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rData.imageUrl} alt={rData.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#0f4030]/30">
                            {rData.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <span className="text-[14px] font-bold text-[#1a1a1a]">{rData.name}</span>
                      <span className="text-[10px] text-[#9ca3af] ml-auto">{rData.items.length} items</span>
                    </div>
                    <div className="space-y-2">
                      {rData.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#f0efeb]">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[20px]">🍽️</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#1a1a1a]">{item.name}</div>
                            {item.description && <div className="text-[10px] text-[#9ca3af] truncate">{item.description}</div>}
                          </div>
                          <div className="text-[14px] font-bold text-[#0f4030] flex-shrink-0">{formatPrice(item.price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {/* CTA for new users */}
              <div className="mt-4 p-4 rounded-xl bg-[#0f4030] text-center">
                <p className="text-[14px] font-bold text-white mb-1">Want this for your office?</p>
                <p className="text-[11px] text-[#c0d2c8] mb-3">Free delivery. Everyone picks &amp; pays individually.</p>
                <a
                  href="https://wa.me/2349120532827?text=Hi!%20I%20want%20ChopDrop%20for%20my%20office"
                  className="inline-flex items-center gap-2 bg-[#f05f4b] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                  Get ChopDrop for your office
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                </a>
              </div>
            </>
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

      <BottomNav />

      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px) scale(0.95); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
      `}</style>
    </main>
  );
}
