"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { BottomNav } from "./bottom-nav";

interface ComboMeal {
  dailyMenuId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tag: string;
  remaining: number;
  expired: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface RestaurantMenuProps {
  restaurant: { id: string; name: string; address: string };
  combos: ComboMeal[];
  categories: Category[];
  buildPlateDailyMenuId: string | null;
  cutoffTime: string;
  allExpired: boolean;
}

export function RestaurantMenu({
  restaurant,
  combos,
  categories,
  buildPlateDailyMenuId,
  cutoffTime,
  allExpired,
}: RestaurantMenuProps) {
  const tabs: { id: string; label: string; count: number }[] = [];
  if (combos.length > 0) tabs.push({ id: "combos", label: "Combos", count: combos.length });
  categories.forEach((cat) => tabs.push({ id: cat.id, label: cat.name, count: cat.items.length }));

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "combos");
  const [toast, setToast] = useState("");
  const cart = useCart();

  function addComboToCart(combo: ComboMeal) {
    cart.addItem({
      dailyMenuId: combo.dailyMenuId,
      name: combo.name,
      description: combo.description || "",
      imageUrl: combo.imageUrl,
      restaurantName: restaurant.name,
      price: combo.price,
    });
    showToast(combo.name);
  }

  function addItemToCart(item: MenuItem) {
    if (!buildPlateDailyMenuId) return;
    cart.addItem({
      dailyMenuId: `${buildPlateDailyMenuId}-${item.id}`,
      name: item.name,
      description: "",
      imageUrl: null,
      restaurantName: restaurant.name,
      price: item.price,
      customItems: [{ menuItemId: item.id, quantity: 1 }],
    });
    showToast(item.name);
  }

  function showToast(name: string) {
    setToast(`${name} added`);
    setTimeout(() => setToast(""), 1500);
  }

  const activeCategory = categories.find((c) => c.id === activeTab);
  const initials = restaurant.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Link href="/menu" className="w-9 h-9 rounded-full bg-cream flex items-center justify-center hover:bg-line transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="w-9 h-9 rounded-[10px] bg-green-soft text-green flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-[16px] leading-tight truncate">{restaurant.name}</h1>
            <p className="text-ink-soft text-[10px] truncate">{restaurant.address}</p>
          </div>
          {cart.totalItems > 0 && (
            <Link href="/cart" className="relative flex items-center gap-1.5 bg-coral text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              {cart.totalItems}
            </Link>
          )}
        </div>

        {/* Category tabs */}
        {tabs.length > 0 && (
          <div className="flex overflow-x-auto hide-scrollbar px-4 gap-1.5 py-2.5 border-b border-line">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-green text-white"
                    : "bg-paper border border-line text-ink-soft hover:border-ink-soft/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 pt-3 pb-4">
        {allExpired ? (
          <div className="text-center py-12 text-ink-soft text-sm">Orders are closed for today.</div>
        ) : (
          <>
            {/* Combos tab */}
            {activeTab === "combos" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-[15px]">Combo deals</h2>
                  <span className="text-ink-soft text-[10px]">{combos.length} available</span>
                </div>
                <div className="space-y-2">
                  {combos.map((combo) => {
                    const disabled = combo.expired || combo.remaining <= 0;
                    return (
                      <div key={combo.dailyMenuId} className="bg-paper border border-line rounded-[13px] flex items-center gap-3 p-2.5 hover:border-green/30 transition-colors">
                        <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-cream flex-shrink-0">
                          {combo.imageUrl ? (
                            <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[13px] leading-tight truncate">{combo.name}</h3>
                          {combo.description && <p className="text-ink-soft text-[10px] mt-0.5 line-clamp-1">{combo.description}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <strong className="font-display font-bold text-[14px]">{formatNaira(combo.price)}</strong>
                            {combo.tag === "DEAL" && <span className="bg-coral/10 text-coral text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">Deal</span>}
                            {!disabled && <span className="text-ink-soft text-[9px]">{combo.remaining} left</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => !disabled && addComboToCart(combo)}
                          disabled={disabled}
                          className={`px-3 py-2 rounded-[10px] text-[11px] font-bold flex-shrink-0 transition-all ${
                            disabled ? "bg-line text-ink-soft opacity-50" : "bg-coral text-white hover:bg-[#d95038] shadow-sm"
                          }`}
                        >
                          Add +
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual items tab */}
            {activeCategory && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-[15px]">{activeCategory.name}</h2>
                  <span className="text-ink-soft text-[10px]">{activeCategory.items.length} items</span>
                </div>
                <div className="bg-paper border border-line rounded-[13px] overflow-hidden divide-y divide-line">
                  {activeCategory.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-cream/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[13px]">{item.name}</h3>
                        <strong className="font-display font-bold text-[13px] mt-0.5 block">{formatNaira(item.price)}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => addItemToCart(item)}
                        disabled={!buildPlateDailyMenuId}
                        className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold bg-coral text-white hover:bg-[#d95038] shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
                      >
                        Add +
                      </button>
                    </div>
                  ))}
                  {activeCategory.items.length === 0 && (
                    <div className="text-center py-8 text-ink-soft text-sm">No items available.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating cart bar */}
      {cart.totalItems > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-4 pb-2 md:hidden">
          <Link href="/cart" className="max-w-2xl mx-auto bg-ink rounded-[14px] px-4 py-3 flex items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.2)] block">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-coral rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              </div>
              <span className="text-white text-[12px] font-bold">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong className="text-white font-display text-[14px]">{formatNaira(cart.subtotal)}</strong>
              <span className="bg-coral text-white text-[10px] font-bold px-3 py-1.5 rounded-full">View cart →</span>
            </div>
          </Link>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed z-[100] left-1/2 bottom-24 -translate-x-1/2 bg-ink text-white rounded-[10px] shadow-[0_12px_30px_rgba(0,0,0,0.25)] px-4 py-2.5 flex items-center gap-2 text-[11px] font-bold" style={{ animation: "slideDown 0.2s ease" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lime"><path d="m5 12 4 4L19 6" /></svg>
          {toast}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
