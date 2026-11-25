import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { formatBDT } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isSupabaseConfigured()) return { title: "Product" };
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? `${product.name}, selected by AND Shop.`,
    openGraph: { title: product.name, images: product.product_images[0]?.image_url ? [product.product_images[0].image_url] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  if (!isSupabaseConfigured()) return <main className="page-main"><p className="setup-inline">Product details are unavailable until Supabase is configured.</p></main>;
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const { products: related } = await getProducts({
    category: product.categories?.slug,
    pageSize: 4,
  });
  const otherProducts = related.filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <main className="page-main">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/shop">Shop</a><span>/</span><span>{product.name}</span></nav>
      <section className="product-detail">
        <div className="product-gallery">
          {product.product_images.map((image, index) => (
            <div className={`gallery-image ${index === 0 ? "gallery-primary" : ""}`} key={image.image_url}>
              <Image src={image.image_url} alt={image.alt_text ?? product.name} fill sizes="(max-width: 640px) 100vw, 60vw" />
            </div>
          ))}
          {!product.product_images.length && <div className="gallery-image gallery-placeholder">Image coming soon</div>}
        </div>
        <div className="product-info">
          <p className="eyebrow">{product.categories?.name ?? "AND Shop"}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatBDT(product.price)}</p>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && <p className="compare-price">{formatBDT(product.compare_at_price)}</p>}
          <div className="product-description">{product.description?.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <p className="stock-status">{product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Currently sold out"}</p>
          <AddToCartButton product={product} />
          <p className="detail-note">Thoughtfully packed in Dhaka. Delivery across Bangladesh.</p>
        </div>
      </section>
      {otherProducts.length > 0 && (
        <section className="section">
          <div className="section-heading"><div><p className="eyebrow">You may also like</p><h2>More good things</h2></div></div>
          <div className="product-grid">{otherProducts.map((item) => <ProductCard product={item} key={item.id} />)}</div>
        </section>
      )}
    </main>
  );
}
