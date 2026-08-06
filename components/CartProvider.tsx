"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartDTO } from "@/lib/types/commerce";

type CartContextValue = {
  cart: CartDTO;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
};

const emptyCart: CartDTO = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  currency: "INR",
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDTO>(emptyCart);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { cart: CartDTO };
      setCart(data.cart);
    } catch {
      /* keep current cart */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      setCart(data.cart);
    },
    [],
  );

  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update cart");
    setCart(data.cart);
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to remove item");
    setCart(data.cart);
  }, []);

  const value = useMemo(
    () => ({ cart, loading, refresh, addItem, setQuantity, removeItem }),
    [cart, loading, refresh, addItem, setQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
