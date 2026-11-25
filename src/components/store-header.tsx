"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export function StoreHeader({
  storeName,
  announcement,
}: {
  storeName: string;
  announcement: string | null;
}) {
  const { itemCount } = useCart();
  return (
    <>
      <div className="announcement">
        {announcement ?? <>Thoughtful things, chosen slowly <span aria-hidden="true">—</span> made to be kept</>}
      </div>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label={`${storeName} home`}>
          {storeName}<span>.</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/#our-story">Our story</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        <div className="header-actions">
          <form className="header-search" action="/shop">
            <label className="visually-hidden" htmlFor="header-search">Search products</label>
            <input id="header-search" name="q" placeholder="Search" />
            <button type="submit" aria-label="Submit search">⌕</button>
          </form>
          <ThemeToggle />
          <Link className="cart-link" href="/cart" aria-label={`Cart, ${itemCount} items`}>
            Bag <span>({itemCount})</span>
          </Link>
        </div>
      </header>
    </>
  );
}
