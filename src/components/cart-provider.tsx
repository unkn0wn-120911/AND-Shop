"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { z } from "zod";
import type { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "and-shop-cart";
const emptyCart: CartItem[] = [];
let cartSnapshot: CartItem[] | null = null;
const listeners = new Set<() => void>();
const cartSchema = z.array(z.object({
  id: z.uuid(),
  name: z.string().max(200),
  slug: z.string().max(200),
  price: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  imageUrl: z.url().nullable(),
  quantity: z.number().int().min(1).max(99),
  stockQuantity: z.number().int().min(0),
})).max(50);

function getCartSnapshot() {
  if (typeof window === "undefined") return emptyCart;
  if (cartSnapshot) return cartSnapshot;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = cartSchema.safeParse(JSON.parse(saved));
      if (parsed.success) {
        cartSnapshot = parsed.data;
        return cartSnapshot;
      }
      console.error("Saved cart data is invalid and has been ignored.", parsed.error);
    }
  } catch (error) {
    console.error("Could not restore the saved cart.", error);
  }
  cartSnapshot = emptyCart;
  return cartSnapshot;
}

function subscribeToCart(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateCart(change: (items: CartItem[]) => CartItem[]) {
  cartSnapshot = change(getCartSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartSnapshot));
  } catch (error) {
    console.error("Could not persist the updated cart.", error);
  }
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => emptyCart);

  const addItem = useCallback((product: Product, quantity = 1) => {
    updateCart((current) => {
      if (product.stock_quantity < 1) return current;
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.stock_quantity, 99),
                stockQuantity: product.stock_quantity,
                price: String(product.price),
              }
            : item,
        );
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: String(product.price),
          imageUrl: product.product_images[0]?.image_url ?? null,
          quantity: Math.min(quantity, product.stock_quantity, 99),
          stockQuantity: product.stock_quantity,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      updateCart((current) => current.filter((item) => item.id !== id));
      return;
    }
    updateCart((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.stockQuantity > 0
                ? Math.min(quantity, item.stockQuantity, 99)
                : item.quantity,
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback(
    (id: string) => updateCart((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const clearCart = useCallback(() => updateCart(() => []), []);
  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within a CartProvider.");
  return value;
}
