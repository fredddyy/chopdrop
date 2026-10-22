"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { BottomNav } from "./bottom-nav";

interface ComboMeal {
  dailyMenuId: string; name: string; description: string | null;
  imageUrl: string | null; price: number; tag: string; remaining: number; expired: boolean;
}
interface MenuItem { id: string; name: string; price: number; description?: string | null; imageUrl?: string | null; }
interface Category { id: string; name: string; items: MenuItem[]; }
interface RestaurantMenuProps {
  restaurant: { id: string; name: string; address: string; imageUrl?: string | null };
  combos: ComboMeal[]; categories: Category[];
  buildPlateDailyMenuId: string | null; cutoffTime: string; allExpired: boolean;
}

function cleanName(name: string): string {
  return name
    .replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "")
    .replace(/\bF\/rice\b/gi, "Fried Rice")
    .replace(/\bJ\/rice\b/gi, "Jollof Rice")
    .replace(/\bChick\b/gi, "Chicken")
    .trim();
}

export function RestaurantMenu({ restaurant, combos, categories, buildPlateDailyMenuId, allExpired }: RestaurantMenuProps) {
  const tabs: { id: string; label: string }[] = [];
  if (combos.length > 0) tabs.push({ id: "combos", label: "Combos" });
  categories.forEach((cat) => tabs.push({ id: cat.id, label: cat.name }));

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "combos");
  const [toast, setToast] = useState("");
  const cart = useCart();

  function addComboToCart(combo: ComboMeal) {
    cart.addItem({ dailyMenuId: combo.dailyMenuId, name: combo.name, description: combo.description || "", imageUrl: combo.imageUrl, restaurantName: restaurant.name, price: combo.price });
    showToast(cleanName(combo.name));
  }

  function addItemToCart(item: MenuItem) {
    if (!buildPlateDailyMenuId) return;
    cart.addItem({ dailyMenuId: `${buildPlateDailyMenuId}-${item.id}`, realDailyMenuId: buildPlateDailyMenuId, name: item.name, description: item.description || "", imageUrl: item.imageUrl || null, restaurantName: restaurant.name, price: item.price, customItems: [{ menuItemId: item.id, quantity: 1 }] });
    showToast(cleanName(item.name));
  }

  function showToast(name: string) { setToast(name); setTimeout(() => setToast(""), 1500); }

  const activeCategory = categories.find((c) => c.id === activeTab);
  function getCartId(item: MenuItem): string { return buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}` : item.id; }
  function getQty(cartId: string): number { return cart.items.find((i) => i.dailyMenuId === cartId)?.quantity || 0; }

  return (
    <main className="flex-1 max-w-[480px] lg:max-w-2xl mx-auto w-full pb-20" style={{ background: "var(--bg)" }}>
      {/* Compact header — no giant hero */}
      <div className="sticky top-0 z-50" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3 px-5 h-14">
          <Link href="/menu" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-[10px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
              {restaurant.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{restaurant.name.charAt(0)}</div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-extrabold truncate" style={{ color: "var(--text)" }}>{restaurant.name}</h1>
              <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>{restaurant.address}</p>
            </div>
          </div>
          {cart.totalItems > 0 && (
            <Link href="/cart" className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: "var(--coral)" }}>{cart.totalItems}</span>
            </Link>
          )}
        </div>

        {/* Category tabs — pill style */}
        {tabs.length > 0 && (
          <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className="h-9 px-4 rounded-full text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
                style={{ background: activeTab === tab.id ? "var(--dark)" : "var(--sand)", color: activeTab === tab.id ? "white" : "var(--text-secondary)" }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Closed banner */}
      {allExpired && (
        <div className="mx-5 mt-3 p-3.5 rounded-[14px] flex items-center gap-3" style={{ background: "var(--dark)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/></svg>
          <div>
            <span className="text-[13px] font-bold text-white">Preview only</span>
            <span className="text-[12px] text-white/50 ml-2">Orders open at 7:00 AM</span>
          </div>
        </div>
      )}

      <div className="px-5 pt-3 pb-4">
        {/* Combos tab */}
        {activeTab === "combos" && combos.length > 0 && (
          <div className="space-y-3">
            {combos.map((combo) => {
              const qty = getQty(combo.dailyMenuId);
              const disabled = combo.expired || combo.remaining <= 0;
              return (
                <div key={combo.dailyMenuId} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: qty > 0 ? "2px solid var(--coral)" : "1px solid var(--border)" }}>
                  {combo.imageUrl && (
                    <div className="h-[140px] overflow-hidden" style={{ background: "var(--sand)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={combo.imageUrl} alt={cleanName(combo.name)} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-bold leading-tight" style={{ color: "var(--text)" }}>{cleanName(combo.name)}</h3>
                      {combo.description && <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{combo.description}</p>}
                      <div className="text-[17px] font-extrabold mt-2 tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(combo.price)}</div>
                    </div>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {qty > 0 ? (
                        <div className="flex items-center rounded-full h-9" style={{ background: "var(--coral)" }}>
                          <button type="button" onClick={() => cart.changeQuantity(combo.dailyMenuId, -1)} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg></button>
                          <span className="text-white text-[14px] font-bold min-w-[20px] text-center">{qty}</span>
                          <button type="button" onClick={() => !disabled && addComboToCart(combo)} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => !disabled && addComboToCart(combo)} disabled={disabled}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform disabled:opacity-40"
                          style={{ background: "var(--coral)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Individual items — clean list with jargon stripped */}
        {activeCategory && (
          <div>
            {activeCategory.items.map((item, idx) => {
              const cartId = getCartId(item);
              const qty = getQty(cartId);
              return (
                <div key={item.id} className="flex items-center gap-4 py-4" style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}>
                  {item.imageUrl && (
                    <div className="w-16 h-16 rounded-[12px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={cleanName(item.name)} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold leading-tight" style={{ color: "var(--text)" }}>{cleanName(item.name)}</h3>
                    {item.description && <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>}
                    <div className="text-[16px] font-extrabold mt-1 tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(item.price)}</div>
                  </div>
                  <div className="shrink-0">
                    {qty > 0 ? (
                      <div className="flex items-center rounded-full h-9" style={{ background: "var(--coral)" }}>
                        <button type="button" onClick={() => cart.changeQuantity(cartId, -1)} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg></button>
                        <span className="text-white text-[14px] font-bold min-w-[20px] text-center">{qty}</span>
                        <button type="button" onClick={() => addItemToCart(item)} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => addItemToCart(item)} disabled={!buildPlateDailyMenuId && !allExpired}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform disabled:opacity-40"
                        style={{ background: "var(--coral)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {activeCategory.items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>No items available</p>
              </div>
            )}
          </div>
        )}

        {/* Back to menu */}
        {allExpired && (
          <Link href="/menu" className="w-full h-12 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--dark)" }}>
            Back to menu
          </Link>
        )}
      </div>

      {/* Floating cart bar */}
      {cart.totalItems > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-4 pb-2 md:hidden">
          <Link href="/cart" className="max-w-[480px] mx-auto rounded-full px-5 h-14 flex items-center justify-between text-white block active:scale-[0.98] transition-transform" style={{ background: "var(--coral)" }}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              <span className="text-[14px] font-bold">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-extrabold tabular-nums">{formatNaira(cart.subtotal)}</span>
              <span className="text-[12px] font-bold bg-white/20 px-3 py-1 rounded-full">View cart</span>
            </div>
          </Link>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed z-[100] left-1/2 bottom-24 -translate-x-1/2 rounded-full pl-3 pr-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold text-white" style={{ background: "var(--dark)", animation: "toastIn 0.3s ease" }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          {toast} added
        </div>
      )}

      <BottomNav />
    </main>
  );
}
