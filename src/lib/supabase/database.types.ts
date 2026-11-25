export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update, Relationships extends object[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      categories: Table<
        { id: string; name: string; slug: string; description: string | null; image_url: string | null; is_active: boolean; sort_order: number; created_at: string },
        { id?: string; name: string; slug: string; description?: string | null; image_url?: string | null; is_active?: boolean; sort_order?: number },
        { name?: string; slug?: string; description?: string | null; image_url?: string | null; is_active?: boolean; sort_order?: number }
      >;
      products: Table<
        { id: string; category_id: string | null; name: string; slug: string; description: string | null; price: number; compare_at_price: number | null; stock_quantity: number; sku: string | null; featured: boolean; is_active: boolean; created_at: string; updated_at: string },
        { id?: string; category_id?: string | null; name: string; slug: string; description?: string | null; price: number; compare_at_price?: number | null; stock_quantity?: number; sku?: string | null; featured?: boolean; is_active?: boolean },
        { category_id?: string | null; name?: string; slug?: string; description?: string | null; price?: number; compare_at_price?: number | null; stock_quantity?: number; sku?: string | null; featured?: boolean; is_active?: boolean },
        [{ foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      >;
      product_images: Table<
        { id: string; product_id: string; image_url: string; alt_text: string | null; sort_order: number; created_at: string },
        { id?: string; product_id: string; image_url: string; alt_text?: string | null; sort_order?: number },
        { product_id?: string; image_url?: string; alt_text?: string | null; sort_order?: number },
        [{ foreignKeyName: "product_images_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }]
      >;
      store_settings: Table<
        { id: string; singleton: boolean; store_name: string; tagline: string | null; announcement: string | null; whatsapp_number: string | null; support_email: string | null; phone: string | null; address: string | null; delivery_fee: number; free_shipping_threshold: number | null; hero_image: string | null; about_text: string | null; updated_at: string },
        { id?: string; singleton?: boolean; store_name?: string; tagline?: string | null; announcement?: string | null; whatsapp_number?: string | null; support_email?: string | null; phone?: string | null; address?: string | null; delivery_fee?: number; free_shipping_threshold?: number | null; hero_image?: string | null; about_text?: string | null },
        { store_name?: string; tagline?: string | null; announcement?: string | null; whatsapp_number?: string | null; support_email?: string | null; phone?: string | null; address?: string | null; delivery_fee?: number; free_shipping_threshold?: number | null; hero_image?: string | null; about_text?: string | null }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      checkout_order: {
        Args: { p_customer_name: string; p_customer_email: string; p_customer_phone: string; p_delivery_address: string; p_district: string; p_area: string; p_delivery_instructions: string; p_payment_method: "cash_on_delivery" | "bkash"; p_idempotency_key: string; p_items: Json };
        Returns: Json;
      };
      lookup_guest_order: {
        Args: { p_order_number: string; p_customer_email: string; p_client_hash: string };
        Returns: Json;
      };
    };
    Enums: {
      profile_role: "customer" | "admin";
      payment_method: "cash_on_delivery" | "bkash";
      payment_status: "unpaid" | "pending_verification" | "paid" | "refunded";
      fulfillment_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};
