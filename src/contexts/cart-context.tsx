"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/types";

const CART_STORAGE_KEY = "foodhub-cart";

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

type CartContextValue = {
  items: CartItem[];
  addItem: (
    mealId: string,
    quantity: number,
    meta?: {
      name?: string;
      price?: number;
      image?: string | null;
      providerProfileId?: string;
    }
  ) => void;
  updateQuantity: (mealId: string, quantity: number) => void;
  removeItem: (mealId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = useCallback(
    (
      mealId: string,
      quantity: number,
      meta?: {
        name?: string;
        price?: number;
        image?: string | null;
        providerProfileId?: string;
      }
    ) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.mealId === mealId);
        const newQty = (existing?.quantity ?? 0) + quantity;
        if (newQty <= 0) {
          return prev.filter((i) => i.mealId !== mealId);
        }
        const next = prev.filter((i) => i.mealId !== mealId);
        next.push({
          mealId,
          quantity: newQty,
          name: meta?.name ?? existing?.name,
          price: meta?.price ?? existing?.price,
          image: meta?.image ?? existing?.image,
          providerProfileId: meta?.providerProfileId ?? existing?.providerProfileId,
        });
        return next;
      });
    },
    []
  );

  const updateQuantity = useCallback((mealId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.mealId !== mealId);
      return prev.map((i) =>
        i.mealId === mealId ? { ...i, quantity } : i
      );
    });
  }, []);

  const removeItem = useCallback((mealId: string) => {
    setItems((prev) => prev.filter((i) => i.mealId !== mealId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () =>
      items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
    }),
    [
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
    ]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
