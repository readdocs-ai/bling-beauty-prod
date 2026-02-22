"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

export function AddToCartButton({ item }: { item: { id: string; slug: string; name: string; price_gbp: number; stripe_price_id: string; image: string } }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      onClick={() => {
        add(item, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? "Added ✓" : "Add to cart"}
    </Button>
  );
}
