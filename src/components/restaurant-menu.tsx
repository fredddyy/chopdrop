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
  description?: string | null;
  imageUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface RestaurantMenuProps {
  restaurant: { id: string; name: string; address: string; imageUrl?: string | null; phone?: string };
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
  const tabs: { id: string; label: string }[] = [];
  if (combos.length > 0) tabs.push({ id: "combos", label: "Combos" });
  categories.forEach((cat) => tabs.push({ id: cat.id, label: cat.name }));

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "combos");
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
      realDailyMenuId: buildPlateDailyMenuId,
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl || null,
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

  function getCartId(item: MenuItem): string {
    return buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}` : item.id;
  }

  function getQty(cartId: string): number {
    return cart.items.find((i) => i.dailyMenuId === cartId)?.quantity || 0;
  }

  // Filter items by search
  function filterItems(items: MenuItem[]) {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-20 bg-paper">
      {/* Back button — floating */}
      <Link href="/menu" className="fixed top-4 left-4 z-50 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center hover:bg-white transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
      </Link>

      {/* Hero image */}
      <div className="relative h-[200px] bg-cream overflow-hidden">
        {restaurant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-soft via-cream to-amber-soft flex items-center justify-center">
            <span className="text-green text-[72px] font-display font-extrabold opacity-15">{initials}</span>
          </div>
        )}
        {/* Cart button */}
        {cart.totalItems > 0 && (
          <Link href="/cart" className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur text-ink text-[11px] font-bold px-3 py-2 rounded-full shadow-md">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            {cart.totalItems}
          </Link>
        )}
      </div>

      {/* Restaurant info */}
      <div className="px-4 pt-4 pb-3 text-center border-b border-line">
        <h1 className="font-display font-bold text-[22px] tracking-[-0.03em]">{restaurant.name}</h1>
        <p className="text-ink-soft text-[12px] mt-1">{restaurant.address}</p>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-cream border border-line rounded-[12px] px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${restaurant.name}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 outline-0 text-[13px] w-full placeholder:text-ink-soft/60"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-ink-soft hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category tabs — underline style */}
      {tabs.length > 0 && (
        <div className="sticky top-0 z-40 bg-paper border-b border-line">
          <div className="flex overflow-x-auto hide-scrollbar px-4 gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors relative flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-green"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-green rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-2 pb-4">
        {allExpired ? (
          <>
            {/* Closed banner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#0f4030] to-[#0d3528] mb-4 mt-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5c565" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-bold text-white">Preview only</div>
                <div className="text-[10px] text-white/60">Ordering opens at <span className="text-[#f5c565] font-bold">7:00 AM</span></div>
              </div>
            </div>

            {/* Use the SAME tab system as live mode — show only the active tab's items */}
            {activeTab === "combos" && combos.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-[16px] mt-2 mb-3">Combo deals</h2>
                <div className="space-y-3">
                  {combos.map((combo) => (
                    <div key={combo.dailyMenuId} className="bg-white rounded-2xl overflow-hidden border border-[#f0efeb] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                      {/* Large food image */}
                      <div className="w-full h-[160px] bg-[#f5f5f3] overflow-hidden">
                        {combo.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[48px]">🍽️</div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-bold text-[#1a1a1a]">{combo.name}</div>
                            {combo.description && <div className="text-[12px] text-[#6b7280] mt-1 leading-relaxed">{combo.description}</div>}
                          </div>
                          <span className="text-[16px] font-bold text-[#0f4030] flex-shrink-0">{formatNaira(combo.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category tabs — show whichever tab is active */}
            {categories.map((cat) => (
              activeTab === cat.id ? (
                <div key={cat.id}>
                  <h2 className="font-display font-bold text-[16px] mt-2 mb-3">{cat.name}</h2>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-[#f0efeb] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        {item.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[#1a1a1a]">{item.name}</div>
                          {item.description && <div className="text-[11px] text-[#6b7280] mt-0.5 leading-relaxed">{item.description}</div>}
                        </div>
                        <span className="text-[15px] font-bold text-[#0f4030] flex-shrink-0">{formatNaira(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            ))}

            {/* Back to menu CTA */}
            <Link href="/menu" className="w-full flex items-center justify-center gap-2 bg-[#0f4030] text-white font-bold py-3 rounded-xl text-[13px] active:scale-[0.98] transition-transform mt-4">
              Back to menu
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
            </Link>
          </>
        ) : (
          <>
            {/* Combos tab */}
            {activeTab === "combos" && (
              <div>
                <h2 className="font-display font-bold text-[18px] mt-3 mb-3">Combo deals</h2>
                <div className="space-y-0 divide-y divide-line">
                  {filterItems(combos.map((c) => ({ id: c.dailyMenuId, name: c.name, price: c.price, description: c.description, imageUrl: c.imageUrl }))).map((combo) => {
                    const original = combos.find((c) => c.dailyMenuId === combo.id)!;
                    const disabled = original.expired || original.remaining <= 0;
                    const qty = getQty(combo.id);
                    return (
                      <div key={combo.id} className="flex gap-3 py-4">
                        <div className="w-[100px] h-[100px] rounded-[12px] overflow-hidden bg-cream flex-shrink-0">
                          {combo.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-[14px] leading-tight">{combo.name}</h3>
                            {combo.description && (
                              <p className="text-ink-soft text-[12px] mt-1 line-clamp-2 leading-relaxed">{combo.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <strong className="font-display font-bold text-[14px]">{formatNaira(combo.price)}</strong>
                            {qty > 0 ? (
                              <div className="flex items-center gap-0 bg-coral rounded-full">
                                <button type="button" onClick={() => cart.changeQuantity(combo.id, -1)} className="w-8 h-8 flex items-center justify-center text-white">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                                </button>
                                <span className="text-white text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
                                <button type="button" onClick={() => !disabled && addComboToCart(original)} className="w-8 h-8 flex items-center justify-center text-white">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => !disabled && addComboToCart(original)}
                                disabled={disabled}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  disabled ? "bg-line text-ink-soft opacity-50" : "bg-coral text-white hover:bg-[#d95038] shadow-sm"
                                }`}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual items tab */}
            {activeCategory && (
              <div>
                <h2 className="font-display font-bold text-[18px] mt-3 mb-3">{activeCategory.name}</h2>
                <div className="space-y-0 divide-y divide-line">
                  {filterItems(activeCategory.items).map((item) => {
                    const cartId = getCartId(item);
                    const qty = getQty(cartId);
                    return (
                      <div key={item.id} className="flex gap-3 py-4">
                        {item.imageUrl ? (
                          <div className="w-[100px] h-[100px] rounded-[12px] overflow-hidden bg-cream flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-[14px] leading-tight">{item.name}</h3>
                            {item.description && (
                              <p className="text-ink-soft text-[12px] mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <strong className="font-display font-bold text-[14px]">{formatNaira(item.price)}</strong>
                            {qty > 0 ? (
                              <div className="flex items-center gap-0 bg-coral rounded-full">
                                <button type="button" onClick={() => cart.changeQuantity(cartId, -1)} className="w-8 h-8 flex items-center justify-center text-white">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                                </button>
                                <span className="text-white text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
                                <button type="button" onClick={() => addItemToCart(item)} className="w-8 h-8 flex items-center justify-center text-white">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addItemToCart(item)}
                                disabled={!buildPlateDailyMenuId}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-coral text-white hover:bg-[#d95038] shadow-sm transition-all disabled:opacity-50"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filterItems(activeCategory.items).length === 0 && (
                    <div className="text-center py-8 text-ink-soft text-sm">
                      {searchQuery ? "No items match your search." : "No items available."}
                    </div>
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
