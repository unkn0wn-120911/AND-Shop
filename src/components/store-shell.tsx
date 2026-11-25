import Link from "next/link";
import { CartProvider } from "@/components/cart-provider";
import { StoreHeader } from "@/components/store-header";
import type { StoreSettings } from "@/lib/types";

const defaultStoreName = "AND Shop";

export function StoreShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: StoreSettings | null;
}) {
  const name = settings?.store_name ?? defaultStoreName;
  return (
    <CartProvider>
      <StoreHeader storeName={name} announcement={settings?.announcement ?? null} />
      {children}
      <footer className="site-footer" id="contact">
        <div className="footer-main">
          <div>
            <Link className="wordmark footer-wordmark" href="/">{name}<span>.</span></Link>
            <p>{settings?.tagline ?? "Small things, thoughtfully made."}</p>
          </div>
          <div>
            <p className="eyebrow">Visit & say hello</p>
            <p>{settings?.address ?? "Dhaka, Bangladesh"}</p>
            {settings?.support_email && <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>}
            {settings?.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}
          </div>
          <div className="footer-links">
            <p className="eyebrow">Information</p>
            <Link href="/shop">Shop all</Link>
            <Link href="/track-order">Track an order</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {name}</span>
          <span>Made with care in Bangladesh</span>
        </div>
      </footer>
    </CartProvider>
  );
}
