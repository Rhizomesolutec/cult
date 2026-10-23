"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { priceCartLines, deliveryChargeForBooks, orderTotal } from "@/lib/pricing";
import type { CartDTO, CartItemDTO, ProductSize } from "@/lib/types/commerce";

export type CartSnapshot = {
  name: string;
  series: string;
  image: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  stock?: number;
  size?: ProductSize;
  specialEdition?: boolean;
};

export type AddItemInput = {
  productId?: string;
  slug?: string;
  quantity?: number;
  snapshot?: CartSnapshot;
};

type CartContextValue = {
  cart: CartDTO;
  loading: boolean;
  notice: string;
  refresh: () => Promise<void>;
  addItem: (input: AddItemInput) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
};

const emptyCart: CartDTO = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  currency: "INR",
  comboApplied: false,
  comboSavings: 0,
  comboEligibleCount: 0,
  comboMessage: "",
  deliveryCharge: 0,
  total: 0,
};

const CART_STORAGE_KEY = "cult-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartDTO | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartDTO;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredCart(cart: CartDTO) {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* storage can be unavailable */
  }
}

function priceItems(items: CartItemDTO[]): CartDTO {
  const priced = priceCartLines(
    items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.price,
      size: item.size,
      series: item.series,
      specialEdition: item.specialEdition,
    })),
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryCharge = deliveryChargeForBooks(itemCount);
  return {
    items,
    itemCount,
    subtotal: priced.subtotal,
    currency: items[0]?.currency ?? "INR",
    comboApplied: priced.comboApplied,
    comboSavings: priced.comboSavings,
    comboEligibleCount: priced.eligibleCount,
    comboMessage: priced.comboMessage,
    deliveryCharge,
    total: orderTotal(priced.subtotal, deliveryCharge),
  };
}

function applyAdd(cart: CartDTO, input: AddItemInput): CartDTO {
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const key = input.productId || input.slug || "";
  if (!key || !input.snapshot) return cart;

  const items = cart.items.map((item) => ({ ...item }));
  const index = items.findIndex(
    (item) =>
      item.productId === key ||
      (input.slug != null && item.productId === input.slug) ||
      (input.productId != null && item.productId === input.productId),
  );
  const stock = input.snapshot.stock;

  if (index >= 0) {
    const nextQty =
      stock == null
        ? items[index].quantity + quantity
        : Math.min(stock, items[index].quantity + quantity);
    if (nextQty < 1) return cart;
    items[index] = {
      ...items[index],
      quantity: nextQty,
      lineTotal: items[index].price * nextQty,
    };
    return priceItems(items);
  }

  const nextQty = stock == null ? quantity : Math.min(stock, quantity);
  if (nextQty < 1) return cart;
  items.push({
    productId: key,
    quantity: nextQty,
    name: input.snapshot.name,
    series: input.snapshot.series,
    image: input.snapshot.image,
    price: input.snapshot.price,
    compareAtPrice: input.snapshot.compareAtPrice,
    currency: input.snapshot.currency || "INR",
    stock: stock ?? nextQty,
    lineTotal: input.snapshot.price * nextQty,
    size: input.snapshot.size,
    specialEdition: input.snapshot.specialEdition,
  });
  return priceItems(items);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDTO>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const cartRef = useRef(cart);
  const revision = useRef(0);

  const commit = useCallback((next: CartDTO) => {
    revision.current += 1;
    cartRef.current = next;
    setCart(next);
    writeStoredCart(next);
  }, []);

  const refresh = useCallback(async () => {
    const seen = revision.current;
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok || revision.current !== seen) return;
      const data = (await res.json()) as { cart: CartDTO };
      if (revision.current !== seen) return;
      commit(data.cart);
    } catch {
      /* keep current cart */
    } finally {
      setLoading(false);
    }
  }, [commit]);

  useEffect(() => {
    const stored = readStoredCart();
    if (stored?.items?.length) {
      const priced = priceItems(stored.items);
      cartRef.current = priced;
      setCart(priced);
      setLoading(false);
    }
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (input: AddItemInput) => {
      const previous = cartRef.current;
      commit(applyAdd(previous, input));
      setNotice("");
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: input.productId,
            slug: input.slug,
            quantity: input.quantity ?? 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add item");
        commit(data.cart);
      } catch (error) {
        commit(previous);
        setNotice(error instanceof Error ? error.message : "Could not add to cart");
      }
    },
    [commit],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const previous = cartRef.current;
      const items = previous.items
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = Math.min(item.stock, quantity);
          return {
            ...item,
            quantity: nextQty,
            lineTotal: item.price * nextQty,
          };
        })
        .filter((item) => item.quantity > 0);
      commit(priceItems(items));
      setNotice("");
      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update cart");
        commit(data.cart);
      } catch (error) {
        commit(previous);
        setNotice(
          error instanceof Error ? error.message : "Could not update cart",
        );
      }
    },
    [commit],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const previous = cartRef.current;
      commit(
        priceItems(previous.items.filter((item) => item.productId !== productId)),
      );
      setNotice("");
      try {
        const res = await fetch(
          `/api/cart?productId=${encodeURIComponent(productId)}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to remove item");
        commit(data.cart);
      } catch (error) {
        commit(previous);
        setNotice(
          error instanceof Error ? error.message : "Could not remove item",
        );
      }
    },
    [commit],
  );

  const value = useMemo(
    () => ({ cart, loading, notice, refresh, addItem, setQuantity, removeItem }),
    [cart, loading, notice, refresh, addItem, setQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
