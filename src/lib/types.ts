export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export type ProductImage = {
  image_url: string;
  alt_text: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sku: string | null;
  featured: boolean;
  categories: Pick<Category, "name" | "slug"> | null;
  product_images: ProductImage[];
};

export type StoreSettings = {
  store_name: string;
  tagline: string | null;
  announcement: string | null;
  whatsapp_number: string | null;
  support_email: string | null;
  phone: string | null;
  address: string | null;
  delivery_fee: number;
  free_shipping_threshold: number | null;
  hero_image: string | null;
  about_text: string | null;
};

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  imageUrl: string | null;
  quantity: number;
  stockQuantity: number;
};
