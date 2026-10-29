"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

function generatePackId(): string {
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function RestaurantMenu({ restaurant, combos, categories, buildPlateDailyMenuId, allExpired }: RestaurantMenuProps) {
  const packagingCats = categories.filter(c => c.isPackaging);
  const foodCats = categories.filter(c => !c.isPackaging);
  const hasPackaging = packagingCats.length > 0;

  // Build sections: combos first, then food categories
  const sections: { id: string; label: string; type: "combos" | "category"; category?: Category }[] = [];
  if (combos.length > 0) sections.push({ id: "combos", label: "Combos", type: "combos" });
  foodCats.forEach(cat => sections.push({ id: cat.id, label: cat.name, type: "category", category: cat }));

  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [toast, setToast] = useState("");
  const [currentPackId, setCurrentPackId] = useState(() => generatePackId());
  const [userScrolling, setUserScrolling] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabBarRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

  // Current pack data
  const currentPackItems = cart.items.filter(i => i.packId === currentPackId && !i.isPackItem);
  const currentPackContainer = cart.items.find(i => i.packId === currentPackId && i.isPackItem);
  const currentPackTotal = currentPackItems.reduce((s, i) => s + i.price * i.quantity, 0) + (currentPackContainer ? currentPackContainer.price : 0);
  const packIds = [...new Set(cart.items.filter(i => i.packId).map(i => i.packId!))];

  // Auto-highlight tab on scroll
  useEffect(() => {
    function handleScroll() {
      if (userScrolling) return;
      const scrollY = window.scrollY + 120;
      let current = sections[0]?.id || "";
      for (const section of sections) {
        const el = sectionRefs.current[section.id];
        if (el && el.offsetTop <= scrollY) current = section.id;
      }
      if (current !== activeSection) {
        setActiveSection(current);
        // Auto-scroll tab into view
        const tabEl = document.getElementById(`tab-${current}`);
        tabEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection, sections, userScrolling]);

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId);
    setUserScrolling(true);
    const el = sectionRefs.current[sectionId];
    if (el) {
      const top = el.offsetTop - 110;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setTimeout(() => setUserScrolling(false), 800);
  }

  function addComboToCart(combo: ComboMeal) {
    cart.addItem({ dailyMenuId: combo.dailyMenuId, name: combo.name, description: combo.description || "", imageUrl: combo.imageUrl, restaurantName: restaurant.name, price: combo.price });
    showToast(cleanName(combo.name));
  }

  const addItemToPack = useCallback((item: MenuItem) => {
    if (!buildPlateDailyMenuId) return;
    cart.addItem({
      dailyMenuId: `${buildPlateDailyMenuId}-${item.id}-${currentPackId}`,
      realDailyMenuId: buildPlateDailyMenuId,
      name: item.name, description: item.description || "", imageUrl: item.imageUrl || null,
      restaurantName: restaurant.name, price: item.price,
      customItems: [{ menuItemId: item.id, quantity: 1 }],
      packId: currentPackId,
    });
    showToast(cleanName(item.name));
  }, [buildPlateDailyMenuId, currentPackId, cart, restaurant.name]);

  function selectPackSize(packItem: MenuItem) {
    if (!buildPlateDailyMenuId) return;
    if (currentPackContainer) cart.removeItem(currentPackContainer.dailyMenuId);
    cart.addItem({
      dailyMenuId: `${buildPlateDailyMenuId}-pack-${packItem.id}-${currentPackId}`,
      realDailyMenuId: buildPlateDailyMenuId,
      name: packItem.name, description: "", imageUrl: packItem.imageUrl || null,
      restaurantName: restaurant.name, price: packItem.price,
      customItems: [{ menuItemId: packItem.id, quantity: 1 }],
      packId: currentPackId, isPackItem: true,
    });
    showToast(packItem.name);
  }

  function startNewPack() { setCurrentPackId(generatePackId()); }
  function showToast(name: string) { setToast(name); setTimeout(() => setToast(""), 1500); }
  function getCartId(item: MenuItem): string { return buildPlateDailyMenuId ? `${buildPlateDailyMenuId}-${item.id}-${currentPackId}` : item.id; }
  function getQty(cartId: string): number { return cart.items.find(i => i.dailyMenuId === cartId)?.quantity || 0; }
  function getComboQty(id: string): number { return cart.items.find(i => i.dailyMenuId === id)?.quantity || 0; }

  // Unified item row — Chowdeck style: text left, photo right
  function ItemRow({ item, cartId, qty, onAdd, onMinus }: { item: { name: string; description?: string | null; imageUrl?: string | null; price: number }; cartId: string; qty: number; onAdd: () => void; onMinus: () => void }) {
    return (
      <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold leading-snug" style={{ color: "var(--text)" }}>{cleanName(item.name)}</h3>
          {item.description && (
            <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
          )}
          <div className="text-[15px] font-extrabold mt-1 tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(item.price)}</div>
        </div>
        <div className="relative shrink-0">
          {item.imageUrl ? (
            <div className="w-[90px] h-[90px] rounded-[14px] overflow-hidden" style={{ background: "var(--sand)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={cleanName(item.name)} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div className="w-[90px] h-[90px] rounded-[14px] flex items-center justify-center" style={{ background: "var(--sand)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
            </div>
          )}
          {/* Add button overlaid on bottom-right of image */}
          <div className="absolute -bottom-2 -right-1">
            {qty > 0 ? (
              <div className="flex items-center rounded-[10px] h-8" style={{ background: "var(--coral)" }}>
                <button type="button" onClick={onMinus} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                </button>
                <span className="text-white text-[13px] font-bold min-w-[16px] text-center">{qty}</span>
                <button type="button" onClick={onAdd} className="w-8 h-8 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
            ) : (
              <button type="button" onClick={onAdd}
                className="h-8 px-3 rounded-[10px] flex items-center justify-center gap-1 text-[13px] font-bold cursor-pointer active:scale-90 transition-transform"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)", color: "var(--text)" }}>
                Add <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] lg:max-w-2xl mx-auto w-full pb-20" style={{ background: "var(--bg)" }}>
      {/* Sticky header */}
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

        {/* Sticky tab bar — auto-highlights on scroll */}
        <div ref={tabBarRef} className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          {sections.map(s => (
            <button key={s.id} id={`tab-${s.id}`} type="button" onClick={() => scrollToSection(s.id)}
              className="h-9 px-4 rounded-full text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={{ background: activeSection === s.id ? "var(--dark)" : "transparent", color: activeSection === s.id ? "white" : "var(--text-secondary)" }}>
              {s.label}
            </button>
          ))}
        </div>
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

      {/* ═══════════════════════════════════════════════ */}
      {/* ALL SECTIONS — continuous scroll                 */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="px-5 pt-2 pb-4">
        {sections.map(section => (
          <div key={section.id} ref={el => { sectionRefs.current[section.id] = el; }}>
            {/* Section header */}
            <h2 className="text-[18px] font-extrabold mt-6 mb-1" style={{ color: "var(--text)" }}>{section.label}</h2>

            {/* Combos section */}
            {section.type === "combos" && combos.map(combo => {
              const qty = getComboQty(combo.dailyMenuId);
              const disabled = combo.expired || combo.remaining <= 0;
              return (
                <ItemRow
                  key={combo.dailyMenuId}
                  item={{ name: combo.name, description: combo.description, imageUrl: combo.imageUrl, price: combo.price }}
                  cartId={combo.dailyMenuId}
                  qty={qty}
                  onAdd={() => !disabled && addComboToCart(combo)}
                  onMinus={() => cart.changeQuantity(combo.dailyMenuId, -1)}
                />
              );
            })}

            {/* Category section */}
            {section.type === "category" && section.category && section.category.items.map(item => {
              const cartId = getCartId(item);
              const qty = getQty(cartId);
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  cartId={cartId}
                  qty={qty}
                  onAdd={() => addItemToPack(item)}
                  onMinus={() => cart.changeQuantity(cartId, -1)}
                />
              );
            })}
          </div>
        ))}

        {allExpired && (
          <Link href="/menu" className="w-full h-12 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2 mt-6 cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--dark)" }}>
            Back to menu
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* PACK SUMMARY BAR                                 */}
      {/* ═══════════════════════════════════════════════ */}
      {currentPackItems.length > 0 && hasPackaging && (
        <div className="fixed bottom-28 left-0 right-0 z-40 px-4 md:hidden">
          <div className="max-w-[480px] mx-auto rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Pack {packIds.indexOf(currentPackId) + 1}</span>
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>· {currentPackItems.length} item{currentPackItems.length !== 1 ? "s" : ""}</span>
              </div>
              <span className="text-[14px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(currentPackTotal)}</span>
            </div>
            <div className="px-4 py-2.5 flex items-center gap-2">
              <span className="text-[12px] font-bold shrink-0" style={{ color: currentPackContainer ? "var(--emerald)" : "var(--coral)" }}>
                {currentPackContainer ? "✓" : ""} Pack:
              </span>
              <div className="flex gap-2 flex-1 overflow-x-auto hide-scrollbar">
                {packagingCats.flatMap(cat => cat.items).map(pack => {
                  const isSelected = currentPackContainer?.dailyMenuId.includes(pack.id);
                  return (
                    <button key={pack.id} type="button" onClick={() => selectPackSize(pack)}
                      className="h-8 px-3 rounded-full text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
                      style={{ background: isSelected ? "var(--emerald)" : "var(--sand)", color: isSelected ? "white" : "var(--text-secondary)" }}>
                      {pack.name} +{formatNaira(pack.price)}
                    </button>
                  );
                })}
              </div>
            </div>
            {currentPackContainer && (
              <button type="button" onClick={startNewPack}
                className="w-full px-4 py-2.5 text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-transform"
                style={{ borderTop: "1px solid var(--border)", color: "var(--coral)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Start new pack
              </button>
            )}
          </div>
        </div>
      )}

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
    </main>
  );
}
