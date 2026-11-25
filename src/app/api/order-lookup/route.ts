import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const requestSchema = z.object({
  order_number: z.string().trim().min(6).max(40),
  customer_email: z.email().max(254),
});

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Order lookup is not configured yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the order number and email used at checkout." }, { status: 400 });
  }

  const clientIp = request.headers.get("x-vercel-forwarded-for") ?? "unknown-client";
  const clientHash = createHmac("sha256", serviceKey).update(clientIp).digest("hex");
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("lookup_guest_order", {
    p_order_number: parsed.data.order_number,
    p_customer_email: parsed.data.customer_email.toLowerCase(),
    p_client_hash: clientHash,
  });
  if (error) {
    if (error.message.includes("LOOKUP_RATE_LIMITED")) {
      return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
    }
    console.error("Guest order lookup failed.", error);
    return NextResponse.json({ error: "Order lookup is temporarily unavailable." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "We couldn’t find an order matching those details." }, { status: 404 });
  }
  return NextResponse.json(data);
}
