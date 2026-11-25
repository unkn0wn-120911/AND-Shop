"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-provider";
import { formatBDT } from "@/lib/format";
import { decimalToMinorUnits } from "@/lib/money";

export default function CartPage() {
  const { items, setQuantity, removeItem } = useCart();
  const estimatedTotal = items.reduce(
    (total, item) => total + decimalToMinorUnits(item.price) * item.quantity,
    0,
  );

  return (
    <main className="page-main">
      <div className="page-title"><p className="eyebrow">Your selection</p><h1>Your bag</h1></div>
      {items.length === 0 ? (
        <div className="empty-state"><p className="eyebrow">Nothing in your bag</p><h2>Find something to keep.</h2><Link className="button button-dark" href="/shop">Explore the collection</Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((item) => (
              <article className="cart-line" key={item.id}>
                <Link className="cart-thumb" href={`/product/${item.slug}`}>
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" fill sizes="92px" />
                  ) : <span aria-hidden="true">AND</span>}
                </Link>
                <div className="cart-line-info">
                  <p className="eyebrow">AND Shop</p>
                  <Link className="product-name" href={`/product/${item.slug}`}>{item.name}</Link>
                  <span>{formatBDT(item.price)}</span>
                  <button className="remove-link" type="button" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
                <label className="quantity-control">
                  <span className="visually-hidden">Quantity for {item.name}</span>
                  <input type="number" min="1" max={Math.min(item.stockQuantity, 99)} value={item.quantity} onChange={(event) => setQuantity(item.id, Number(event.target.value))} />
                </label>
                <p className="line-total">{formatBDT(decimalToMinorUnits(item.price) * item.quantity / 100)}</p>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <p className="eyebrow">Order summary</p>
            <div className="summary-row"><span>Estimated subtotal</span><span>{formatBDT(estimatedTotal / 100)}</span></div>
            <p className="summary-note">Delivery and final product prices are confirmed securely at checkout.</p>
            <Link className="button button-dark button-full" href="/checkout">Continue to checkout</Link>
            <Link className="text-link continue-shopping" href="/shop">Continue shopping ↗</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
