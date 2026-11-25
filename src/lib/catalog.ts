import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Product, StoreSettings } from "@/lib/types";

const productFields =
  "id,category_id,name,slug,description,price,compare_at_price,stock_quantity,sku,featured,categories(name,slug),product_images(image_url,alt_text,sort_order)" as const;

export async function getStoreSettings(): Promise<StoreSettings | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select(
      "store_name,tagline,announcement,whatsapp_number,support_email,phone,address,delivery_fee,free_shipping_threshold,hero_image,about_text",
    )
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to load store settings: ${error.message}`);
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_url")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`Unable to load categories: ${error.message}`);
  return data ?? [];
}

export async function getProducts({
  query,
  category,
  featured,
  available,
  sort,
  page = 1,
  pageSize = 12,
}: {
  query?: string;
  category?: string;
  featured?: boolean;
  available?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ products: Product[]; count: number }> {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("products")
    .select(productFields, { count: "exact" })
    .eq("is_active", true);

  if (query?.trim()) request = request.ilike("name", `%${query.trim()}%`);
  if (category) {
    const { data: selectedCategory, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`Unable to filter by category: ${error.message}`);
    if (!selectedCategory) return { products: [], count: 0 };
    request = request.eq("category_id", selectedCategory.id);
  }
  if (featured) request = request.eq("featured", true);
  if (available) request = request.gt("stock_quantity", 0);

  switch (sort) {
    case "price-asc":
      request = request.order("price", { ascending: true });
      break;
    case "price-desc":
      request = request.order("price", { ascending: false });
      break;
    case "name":
      request = request.order("name", { ascending: true });
      break;
    default:
      request = request.order("created_at", { ascending: false });
  }

  const from = (Math.max(1, page) - 1) * pageSize;
  const { data, error, count } = await request.range(from, from + pageSize - 1);
  if (error) throw new Error(`Unable to load products: ${error.message}`);

  return { products: data ?? [], count: count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(productFields)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Unable to load product: ${error.message}`);
  return data;
}
