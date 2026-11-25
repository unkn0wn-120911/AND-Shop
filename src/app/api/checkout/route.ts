import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const checkoutRequestSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string().trim().min(7).max(30),
  customer_email: z.email().max(254),
  delivery_address: z.string().trim().min(8).max(500),
  district: z.string().trim().min(2).max(100),
  area: z.string().trim().min(2).max(100),
  delivery_instructions: z.string().trim().max(500).optional(),
  payment_method: z.enum(["cash_on_delivery", "bkash"]),
  idempotency_key: z.uuid(),
  items: z.array(z.object({
    product_id: z.uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = checkoutRequestSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please review your details and try again." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("checkout_order", {
      p_customer_name: parsed.data.customer_name,
      p_customer_email: parsed.data.customer_email.toLowerCase(),
      p_customer_phone: parsed.data.customer_phone,
      p_delivery_address: parsed.data.delivery_address,
      p_district: parsed.data.district,
      p_area: parsed.data.area,
      p_delivery_instructions: parsed.data.delivery_instructions ?? "",
      p_payment_method: parsed.data.payment_method,
      p_idempotency_key: parsed.data.idempotency_key,
      p_items: parsed.data.items,
    });
    if (error) {
      if (error.message.includes("INSUFFICIENT_STOCK")) {
        return NextResponse.json({ error: "One or more items no longer have enough stock. Update your bag and try again." }, { status: 409 });
      }
      if (error.message.includes("PRODUCT_UNAVAILABLE")) {
        return NextResponse.json({ error: "One or more products are no longer available." }, { status: 409 });
      }
      console.error("Order creation failed.", error);
      return NextResponse.json({ error: "We could not place your order. Please try again." }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Checkout request failed.", error);
    return NextResponse.json({ error: "Checkout could not be completed. Please try again." }, { status: 500 });
  }
}
