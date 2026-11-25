import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts, getStoreSettings } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="setup-notice">
        <p className="eyebrow">Store setup required</p>
        <h1>A more considered kind of everyday.</h1>
        <p>Connect this store to Supabase to load its catalogue and published store settings.</p>
        <Link className="button button-dark" href="/shop">Explore the shop</Link>
      </main>
    );
  }

  const [settings, categories, { products }] = await Promise.all([
    getStoreSettings(),
    getCategories(),
    getProducts({ featured: true, pageSize: 4 }),
  ]);

  return (
    <main>
      <section className={`hero ${settings?.hero_image ? "hero-with-image" : ""}`}>
        {settings?.hero_image && (
          <Image className="hero-image" src={settings.hero_image} alt="" fill sizes="100vw" priority />
        )}
        <div className="hero-content">
          <p className="eyebrow">{settings?.tagline ?? "Objects for living well"}</p>
          <h1>Keep the things<br />that make a day.</h1>
          <p className="hero-copy">A small collection of useful, beautiful things. Chosen slowly, made to be part of your everyday.</p>
          <Link className="button button-light" href="/shop">Discover the collection <span aria-hidden="true">↗</span></Link>
        </div>
        <span className="hero-index">01 — AND SHOP / DHAKA</span>
      </section>

      <section className="section collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your everyday</p>
            <h2>Shop by collection</h2>
          </div>
          <Link className="text-link" href="/shop">View all products <span aria-hidden="true">↗</span></Link>
        </div>
        {categories.length ? (
          <div className="collection-grid">
            {categories.slice(0, 4).map((category, index) => (
              <Link className={`collection-tile collection-tone-${index + 1}`} href={`/shop?category=${encodeURIComponent(category.slug)}`} key={category.id}>
                {category.image_url && (
                  <Image className="collection-image" src={category.image_url} alt="" fill sizes="(max-width: 640px) 48vw, 25vw" />
                )}
                <span className="eyebrow">0{index + 1} / Collection</span>
                <span className="collection-name">{category.name}</span>
                <span className="collection-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-note">Collections will appear here as they are published.</p>
        )}
      </section>

      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A few good things</p>
            <h2>Worth keeping</h2>
          </div>
          <Link className="text-link" href="/shop">Shop the edit <span aria-hidden="true">↗</span></Link>
        </div>
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="empty-note">New pieces are on their way. Check back soon.</p>
        )}
      </section>

      <section className="story-section" id="our-story">
        <p className="eyebrow">A note from AND</p>
        <h2>Less, but more<br />meaningful.</h2>
        <p>{settings?.about_text ?? "We believe the best things earn their place — made with care, chosen with intention, and used every day."}</p>
        <Link className="text-link" href="/shop">A little more about us <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="message-section">
        <div>
          <p className="eyebrow">Need a hand?</p>
          <h2>Good things are<br />better shared.</h2>
        </div>
        <div>
          <p>Questions about a piece or placing an order? We’re happy to help, one message at a time.</p>
          {settings?.whatsapp_number ? (
            <a className="button button-outline" href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Message us on WhatsApp ↗</a>
          ) : settings?.support_email ? (
            <a className="button button-outline" href={`mailto:${settings.support_email}`}>Send us an email ↗</a>
          ) : <span className="empty-note">Contact details coming soon.</span>}
        </div>
      </section>
    </main>
  );
}
