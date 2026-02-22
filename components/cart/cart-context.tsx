"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { CartItem } from "./cart-types";

type CartState = { items: CartItem[] };
type Action =
  | { type: "ADD"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "REMOVE"; slug: string }
  | { type: "SET_QTY"; slug: string; qty: number }
  | { type: "CLEAR" };

const CartContext = createContext<{
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
} | null>(null);

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const qty = Math.max(1, action.qty ?? 1);
      const existing = state.items.find((i) => i.slug === action.item.slug);
      if (existing) {
        return { items: state.items.map((i) => (i.slug === action.item.slug ? { ...i, qty: i.qty + qty } : i)) };
      }
      return { items: [...state.items, { ...action.item, qty }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.slug !== action.slug) };
    case "SET_QTY":
      return { items: state.items.map((i) => (i.slug === action.slug ? { ...i, qty: Math.max(1, action.qty) } : i)) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

const STORAGE_KEY = "blingbeauty_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (parsed?.items?.length) {
          dispatch({ type: "CLEAR" });
          for (const it of parsed.items) {
            dispatch({ type: "ADD", item: { id: it.id, slug: it.slug, name: it.name, price_gbp: it.price_gbp, stripe_price_id: it.stripe_price_id, image: it.image }, qty: it.qty });
          }
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const api = useMemo(() => {
    const subtotal = state.items.reduce((acc, it) => acc + it.price_gbp * it.qty, 0);
    const count = state.items.reduce((acc, it) => acc + it.qty, 0);
    return {
      items: state.items,
      add: (item: Omit<CartItem, "qty">, qty?: number) => dispatch({ type: "ADD", item, qty }),
      remove: (slug: string) => dispatch({ type: "REMOVE", slug }),
      setQty: (slug: string, qty: number) => dispatch({ type: "SET_QTY", slug, qty }),
      clear: () => dispatch({ type: "CLEAR" }),
      subtotal,
      count,
    };
  }, [state.items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
