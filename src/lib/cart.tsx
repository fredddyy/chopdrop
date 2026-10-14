"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  dailyMenuId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  restaurantName: string;
  price: number; // kobo
  quantity: number;
  customItems?: { menuItemId: string; quantity: number }[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (dailyMenuId: string) => void;
  changeQuantity: (dailyMenuId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "chopdrop-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function addItem(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
    setItems((prev) => {
      const existing = prev.find((i) => i.dailyMenuId === item.dailyMenuId);
      if (existing) {
        return prev.map((i) =>
          i.dailyMenuId === item.dailyMenuId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }

  function removeItem(dailyMenuId: string) {
    setItems((prev) => prev.filter((i) => i.dailyMenuId !== dailyMenuId));
  }

  function changeQuantity(dailyMenuId: string, delta: number) {
    setItems((prev) => {
      const updated = prev.map((i) => {
        if (i.dailyMenuId !== dailyMenuId) return i;
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }).filter((i) => i.quantity > 0);
      return updated;
    });
  }

  function clearCart() { setItems([]); }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, changeQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
