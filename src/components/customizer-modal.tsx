"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/utils";

interface MenuItemData {
  id: string;
  name: string;
  price: number;
}

interface MenuCategoryData {
  id: string;
  name: string;
  selectionRule: string;
  items: MenuItemData[];
}

interface CustomizerProps {
  mealName: string;
  mealImage: string | null;
  mealDescription: string | null;
  restaurantName: string;
  categories: MenuCategoryData[];
  onClose: () => void;
  onConfirm: (selection: { items: { menuItemId: string; quantity: number }[]; total: number; detail: string }) => void;
}

export function CustomizerModal({
  mealName,
  mealImage,
  mealDescription,
  restaurantName,
  categories,
  onClose,
  onConfirm,
}: CustomizerProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

  function handleToggle(categoryId: string, itemId: string, rule: string) {
    setSelectedItems((prev) => {
      const current = prev[categoryId] || [];
      if (rule === "PICK_ONE") return { ...prev, [categoryId]: [itemId] };
      if (current.includes(itemId)) return { ...prev, [categoryId]: current.filter((id) => id !== itemId) };
      return { ...prev, [categoryId]: [...current, itemId] };
    });
  }

  function calculateTotal(): number {
    let total = 0;
    for (const category of categories) {
      const selected = selectedItems[category.id] || [];
      for (const itemId of selected) {
        const item = category.items.find((i) => i.id === itemId);
        if (item) total += item.price;
      }
    }
    return total;
  }

  function validate(): string | null {
    // All categories are now skippable — no forced sequence
    // Just require at least one item selected total
    const totalSelected = Object.values(selectedItems).flat().length;
    if (totalSelected === 0) return "Pick at least one item";
    return null;
  }

  function handleConfirm() {
    const err = validate();
    if (err) return;

    const allItems = Object.values(selectedItems).flat();
    const itemNames: string[] = [];
    for (const cat of categories) {
      for (const itemId of selectedItems[cat.id] || []) {
        const item = cat.items.find((i) => i.id === itemId);
        if (item) itemNames.push(item.name);
      }
    }

    onConfirm({
      items: allItems.map((id) => ({ menuItemId: id, quantity: 1 })),
      total: calculateTotal(),
      detail: itemNames.join(" · "),
    });
  }

  const total = calculateTotal();
  const isValid = validate() === null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-ink/60 backdrop-blur-[5px] flex items-end md:items-center justify-center"
      role="presentation"
      onMouseDown={onClose}
      style={{ animation: "fadeIn 0.18s ease" }}
    >
      <section
        className="bg-paper w-full md:w-[min(720px,100%)] max-h-[calc(100vh-60px)] md:max-h-[calc(100vh-90px)] rounded-t-[20px] md:rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.25s ease" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center gap-3.5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {mealImage && (
              <img src={mealImage} alt="" className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.08em]">
                {restaurantName}
              </div>
              <h2 className="font-display font-bold text-[20px] tracking-[-0.025em] mt-0.5 leading-tight">
                Build your {mealName.toLowerCase().includes("plate") ? "box" : mealName.toLowerCase() + " box"}
              </h2>
              {mealDescription && (
                <p className="text-ink-soft text-[10px] mt-0.5">{mealDescription}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream text-xl font-light transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {categories.map((category, idx) => (
            <div key={category.id} className={idx > 0 ? "mt-6 pt-5 border-t border-line" : ""}>
              {/* Step header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-[23px] h-[23px] bg-green rounded-full flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <strong className="font-display font-bold text-[14px]">
                    {category.selectionRule === "PICK_ANY"
                      ? `Add ${category.name.toLowerCase()}`
                      : `Choose your ${category.name.toLowerCase()}`}
                  </strong>
                </div>
                <span className="bg-cream text-ink-soft text-[9px] font-extrabold uppercase tracking-[0.07em] px-2 py-1 rounded-full">
                  {category.selectionRule === "PICK_ONE"
                    ? "Pick 1 · Skip OK"
                    : category.selectionRule === "PICK_ONE_OR_MORE"
                    ? "Pick 1+ · Skip OK"
                    : "Optional"}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {category.items.map((item) => {
                  const isSelected = (selectedItems[category.id] || []).includes(item.id);
                  const isRadio = category.selectionRule === "PICK_ONE";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggle(category.id, item.id, category.selectionRule)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[11px] border transition-all text-left ${
                        isSelected
                          ? "border-2 border-green bg-green-soft"
                          : "border border-line hover:border-ink-soft/30"
                      }`}
                    >
                      {/* Indicator */}
                      <div className={`w-[18px] h-[18px] border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                        isRadio ? "rounded-full" : "rounded-[5px]"
                      } ${isSelected ? "border-green" : "border-ink-soft/40"}`}>
                        {isSelected && (
                          isRadio ? (
                            <div className="w-[9px] h-[9px] bg-green rounded-full" />
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                              <path d="m5 12 4 4L19 6" />
                            </svg>
                          )
                        )}
                      </div>
                      <div className="flex-1"><strong className="text-[13px]">{item.name}</strong></div>
                      <b className="text-[12px] text-ink-soft">+{formatNaira(item.price)}</b>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Included note */}
          <div className="flex items-center gap-2 mt-5 px-3 py-2.5 bg-cream rounded-[9px] text-ink-soft text-[10px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green flex-shrink-0">
              <path d="m5 12 4 4L19 6" />
            </svg>
            <span><strong className="text-ink">Already included</strong> Base items come with every box.</span>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-line bg-white px-5 py-3.5 flex items-center justify-between shadow-[0_-8px_22px_rgba(25,52,45,0.05)]">
          <div>
            <span className="text-ink-soft text-[9px] font-semibold block">Total</span>
            <strong className="font-display font-[750] text-[20px] tracking-[-0.03em]">
              {formatNaira(total)}
            </strong>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || total === 0}
            className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm inline-flex items-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to box
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } }
      `}</style>
    </div>
  );
}
