"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  quantity = 1,
}: {
  product: Product;
  quantity?: number;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function add() {
    if (product.stock_quantity < 1) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button className="button button-dark" type="button" onClick={add} disabled={product.stock_quantity < 1}>
      {product.stock_quantity < 1 ? "Sold out" : added ? "Added to bag" : "Add to bag"}
    </button>
  );
}
