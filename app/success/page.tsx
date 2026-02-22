"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";

export default function SuccessPage() {
  const { clear } = useCart();

  useEffect(() => {
    clear(); // clear cart after successful return
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl">Thank you ✨</h1>
      <p className="mt-4 text-sm text-soft-black/70">
        Your payment was successful and your order is confirmed.
      </p>
    </div>
  );
}