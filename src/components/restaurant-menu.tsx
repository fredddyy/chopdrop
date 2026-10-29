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
interface Category { id: string; name: string; selectionRule: string; isPackaging: boolean; isAddon: boolean; items: MenuItem[]; }
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
  // Separate categories by type
  const packagingCats = categories.filter(c => c.isPackaging);
  const addonCats = categories.filter(c => c.isAddon);
  const mealCats = categories.filter(c => !c.isPackaging && !c.isAddon);

  // Build tabs: combos first, then meal categories, then add-on categories
  const tabs: { id: string; label: string }[] = [];
  if (combos.length > 0) tabs.push({ id: "combos", label: "Combos" });
  mealCats.forEach(cat => tabs.push({ id: cat.id, label: cat.name }));
  addonCats.forEach(cat => tabs.push({ id: cat.id, label: cat.name }));
  // Packaging tabs are hidden — they only appear inside the meal modal

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "combos");
  const [toast, setToast] = useState("");
  const [modalItem, setModalItem] = useState<{ item: MenuItem; category: Category } | null>(null);
  const [modalPackId, setModalPackId] = useState<string>("");
  const cart = useCart();

  const hasPackaging = packagingCats.length > 0;

  function addComboToCart(combo: ComboMeal) {
    cart.addItem({ dailyMenuId: combo.dailyMenuId, name: combo.name, description: combo.description || "", imageUrl: combo.imageUrl, restaurantName: restaurant.name, price: combo.price });
    showToast(cleanName(combo.name));
  }

  function addItemDirectly(item: MenuItem) {
    if (!buildPlateDailyMenuId) return;
    cart.addItem({ dailyMenuId: `${buildPlateDailyMenuId}-${item.id}`, realDailyMenuId: buildPlateDailyMenuId, name: item.name, description: item.description || "", imageUrl: item.imageUrl || null, restaurantName: restaurant.name, price: item.price, customItems: [{ menuItemId: item.id, quantity: 1 }] });
    showToast(cleanName(item.name));
  }

  function openMealModal(item: MenuItem, category: Category) {
    if (!hasPackaging) {
      // No packaging categories exist — add directly
      addItemDirectly(item);
      return;
    }
    setModalItem({ item, category });
    setModalPackId("");
  }

  function confirmMealModal() {
    if (!modalItem || !buildPlateDailyMenuId) return;
    const { item } = modalItem;
    const packItem = packagingCats.flatMap(c => c.items).find(p => p.id === modalPackId);
    const totalPrice = item.price + (packItem?.price || 0);
    const packLabel = packItem ? ` · ${packItem.name}` : "";
    const customItems = [{ menuItemId: item.id, quantity: 1 }];
    if (packItem) customItems.push({ menuItemId: packItem.id, quantity: 1 });

    cart.addItem({
      dailyMenuId: `${buildPlateDailyMenuId}-${item.id}-${modalPackId || "nopack"}`,
      realDailyMenuId: buildPlateDailyMenuId,
      name: `${item.name}${packLabel}`,
      description: item.description || "",
      imageUrl: item.imageUrl || null,
      restaurantName: restaurant.name,
      price: totalPrice,
      customItems,
    });

    showToast(cleanName(item.name));
    setModalItem(null);
    setModalPackId("");
  }

  function showToast(name: string) { setToast(name); setTimeout(() => setToast(""), 1500); }

  function getCartId(item: MenuItem): string { return buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}` : item.id; }
  function getQty(cartId: string): number { return cart.items.find(i => i.dailyMenuId === cartId)?.quantity || 0; }
  // For meal items with packaging, count all cart items that start with the base ID
  function getMealQty(item: MenuItem): number {
    const prefix = buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}` : item.id;
    return cart.items.filter(i => i.dailyMenuId.startsWith(prefix)).reduce((sum, i) => sum + i.quantity, 0);
  }

  const activeCategory = categories.find(c => c.id === activeTab);
  const isActiveMealCat = activeCategory && !activeCategory.isPackaging && !activeCategory.isAddon;
  const isActiveAddonCat = activeCategory?.isAddon;

  return (
    <main className="flex-1 max-w-[480px] lg:max-w-2xl mx-auto w-full pb-20" style={{ background: "var(--bg)" }}>
      {/* Header */}
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

        {/* Category tabs — packaging tabs hidden */}
        {tabs.length > 0 && (
          <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
            {tabs.map(tab => (
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
            {combos.map(combo => {
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
                    <div className="shrink-0">
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

        {/* Meal categories — tap opens packaging modal */}
        {activeCategory && isActiveMealCat && (
          <div>
            {activeCategory.items.map((item, idx) => {
              const qty = getMealQty(item);
              return (
                <div key={item.id} className="flex items-center gap-4 py-4 cursor-pointer active:bg-[var(--sand)] transition-colors rounded-[12px] -mx-2 px-2"
                  onClick={() => openMealModal(item, activeCategory)}
                  style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}>
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
                      <div className="flex items-center rounded-full h-9" style={{ background: "var(--coral)" }} onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => {
                          const prefix = buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}` : item.id;
                          const cartItem = cart.items.find(i => i.dailyMenuId.startsWith(prefix));
                          if (cartItem) cart.changeQuantity(cartItem.dailyMenuId, -1);
                        }} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                        </button>
                        <span className="text-white text-[14px] font-bold min-w-[20px] text-center">{qty}</span>
                        <button type="button" onClick={() => {
                          const prefix = buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}` : item.id;
                          const cartItem = cart.items.find(i => i.dailyMenuId.startsWith(prefix));
                          if (cartItem) cart.changeQuantity(cartItem.dailyMenuId, 1);
                        }} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--coral)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add-on categories — direct +/- add, no modal */}
        {activeCategory && isActiveAddonCat && (
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
                        <button type="button" onClick={() => addItemDirectly(item)} className="w-9 h-9 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => addItemDirectly(item)} disabled={!buildPlateDailyMenuId && !allExpired}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform disabled:opacity-40"
                        style={{ background: "var(--coral)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeCategory && activeCategory.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>No items available</p>
          </div>
        )}

        {allExpired && (
          <Link href="/menu" className="w-full h-12 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--dark)" }}>
            Back to menu
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PACKAGING MODAL — Glovo style                       */}
      {/* ═══════════════════════════════════════════════════ */}
      {modalItem && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-end justify-center" onMouseDown={() => setModalItem(null)}
          style={{ animation: "fadeIn 0.15s ease" }}>
          <div className="bg-white w-full max-w-[480px] max-h-[85vh] rounded-t-[24px] overflow-hidden flex flex-col"
            onMouseDown={e => e.stopPropagation()} style={{ animation: "modalIn 0.25s ease" }}>

            {/* Meal photo */}
            {modalItem.item.imageUrl && (
              <div className="h-[200px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={modalItem.item.imageUrl} alt={cleanName(modalItem.item.name)} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setModalItem(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center cursor-pointer"
                  style={{ position: "relative", marginTop: -200 + 12, marginLeft: "auto", marginRight: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
              {/* Meal info */}
              <h2 className="text-[22px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{cleanName(modalItem.item.name)}</h2>
              <div className="text-[18px] font-extrabold mt-1 tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(modalItem.item.price)}</div>
              {modalItem.item.description && (
                <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{modalItem.item.description}</p>
              )}

              {/* Packaging selection — required */}
              {packagingCats.map(cat => (
                <div key={cat.id} className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>{cat.name}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: modalPackId ? "rgba(13,159,95,0.1)" : "rgba(232,96,76,0.1)", color: modalPackId ? "var(--emerald)" : "var(--coral)" }}>
                      {modalPackId ? "Selected" : "Required"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cat.items.map(pack => {
                      const selected = modalPackId === pack.id;
                      return (
                        <button key={pack.id} type="button" onClick={() => setModalPackId(selected ? "" : pack.id)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-[14px] text-left cursor-pointer transition-all"
                          style={{ background: selected ? "rgba(13,159,95,0.06)" : "var(--sand)", border: selected ? "2px solid var(--emerald)" : "2px solid transparent" }}>
                          {pack.imageUrl && (
                            <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0" style={{ background: "var(--card)" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={pack.imageUrl} alt={pack.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{pack.name}</span>
                          </div>
                          <span className="text-[14px] font-bold tabular-nums" style={{ color: "var(--text-secondary)" }}>+{formatNaira(pack.price)}</span>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: selected ? "none" : "2px solid var(--border)", background: selected ? "var(--emerald)" : "transparent" }}>
                            {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add button — sticky bottom */}
            <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button type="button" onClick={confirmMealModal}
                disabled={hasPackaging && !modalPackId}
                className="w-full h-14 rounded-full text-[16px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--coral)" }}>
                Add 1 for {formatNaira(modalItem.item.price + (packagingCats.flatMap(c => c.items).find(p => p.id === modalPackId)?.price || 0))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating cart bar */}
      {cart.totalItems > 0 && !modalItem && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-4 pb-2 md:hidden">
          <Link href="/cart" className="max-w-[480px] mx-auto rounded-full px-5 h-14 flex items-center justify-between text-white block active:scale-[0.98] transition-transform" style={{ background: "var(--coral)" }}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
              <span className="text-[14px] font-bold">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-extrabold tabular-nums">{formatNaira(cart.subtotal)}</span>
              <span className="text-[12px] font-bold bg-white/20 px-3 py-1 rounded-full">Go to cart</span>
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

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </main>
  );
}
