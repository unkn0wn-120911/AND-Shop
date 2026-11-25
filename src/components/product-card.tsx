import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { formatBDT } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const image = product.product_images[0];
  return (
    <article className="product-card">
      <Link className="product-image" href={`/product/${product.slug}`}>
        {image ? (
          <Image
            src={image.image_url}
            alt={image.alt_text ?? product.name}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 900px) 48vw, 25vw"
          />
        ) : (
          <span className="image-unavailable">Image coming soon</span>
        )}
        {product.featured && <span className="product-tag">Selected</span>}
        {product.stock_quantity < 1 && <span className="product-tag sold-out">Sold out</span>}
      </Link>
      <div className="product-meta">
        <div>
          <p className="eyebrow">{product.categories?.name ?? "AND Shop"}</p>
          <Link className="product-name" href={`/product/${product.slug}`}>{product.name}</Link>
        </div>
        <p className="product-price">{formatBDT(product.price)}</p>
      </div>
      {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
        <p className="compare-price">{formatBDT(product.compare_at_price)}</p>
      )}
    </article>
  );
}
