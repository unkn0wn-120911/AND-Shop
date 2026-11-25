import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Shop",
  description: "Explore the considered collection of everyday goods from AND Shop.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isSupabaseConfigured()) {
    return <main className="page-main"><div className="page-title"><p className="eyebrow">The collection</p><h1>Shop all</h1></div><p className="setup-inline">Catalogue unavailable. Connect Supabase to browse published products.</p></main>;
  }
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const available = params.available === "true";
  const page = Math.max(1, Number(params.page) || 1);
  const [{ products, count }, categories] = await Promise.all([
    getProducts({ query: q, category, sort, available, page }),
    getCategories(),
  ]);
  const pageCount = Math.ceil(count / 12);

  return (
    <main className="page-main">
      <div className="page-title">
        <p className="eyebrow">AND Shop / The collection</p>
        <h1>Shop all</h1>
        <p>Useful, beautiful things for the everyday.</p>
      </div>
      <form className="shop-filters" action="/shop">
        <label>
          <span className="visually-hidden">Search products</span>
          <input name="q" defaultValue={q} placeholder="Search the collection" />
        </label>
        <label>
          <span className="visually-hidden">Filter by collection</span>
          <select name="category" defaultValue={category}>
            <option value="">All collections</option>
            {categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span className="visually-hidden">Sort products</span>
          <select name="sort" defaultValue={sort}>
            <option value="newest">Recently added</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label className="available-filter">
          <input type="checkbox" name="available" value="true" defaultChecked={available} />
          In stock
        </label>
        <button className="button button-dark" type="submit">Apply</button>
      </form>

      <p className="result-count">{count} {count === 1 ? "piece" : "pieces"}</p>
      {products.length ? (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="empty-state"><p className="eyebrow">Nothing here just yet</p><h2>Try another search.</h2><Link className="text-link" href="/shop">Clear filters ↗</Link></div>
      )}
      {pageCount > 1 && (
        <nav className="pagination" aria-label="Pagination">
          {page > 1 && <Link href={shopUrl(params, page - 1)}>← Previous</Link>}
          <span>Page {page} of {pageCount}</span>
          {page < pageCount && <Link href={shopUrl(params, page + 1)}>Next →</Link>}
        </nav>
      )}
    </main>
  );
}

function shopUrl(params: Record<string, string | string[] | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/shop?${query.toString()}`;
}
