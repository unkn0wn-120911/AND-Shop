"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCart } from "@/components/cart-provider";
import { formatBDT } from "@/lib/format";
import { decimalToMinorUnits } from "@/lib/money";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name.").max(120),
  customer_phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  customer_email: z.email("Enter a valid email address."),
  delivery_address: z.string().trim().min(8, "Enter your complete delivery address.").max(500),
  district: z.string().trim().min(2, "Enter your district.").max(100),
  area: z.string().trim().min(2, "Enter your area.").max(100),
  delivery_instructions: z.string().trim().max(500).optional(),
  payment_method: z.enum(["cash_on_delivery", "bkash"]),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;
type OrderResult = { order_number: string; total: string };

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [serverError, setServerError] = useState("");
  const [requestKey, setRequestKey] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: "cash_on_delivery" },
  });

  async function submit(values: CheckoutValues) {
    if (!items.length) return;
    setServerError("");
    const signature = JSON.stringify({
      values,
      items: items.map(({ id, quantity }) => ({ id, quantity })),
    });
    let idempotencyKey = requestKey;
    try {
      const saved = window.sessionStorage.getItem("and-shop-checkout-request");
      const previous = saved ? JSON.parse(saved) as { signature?: string; key?: string } : null;
      if (previous?.signature === signature && previous.key) {
        idempotencyKey = previous.key;
      } else {
        idempotencyKey = window.crypto.randomUUID();
        window.sessionStorage.setItem(
          "and-shop-checkout-request",
          JSON.stringify({ signature, key: idempotencyKey }),
        );
      }
    } catch (error) {
      console.error("Checkout retry state could not be persisted.", error);
      idempotencyKey ??= window.crypto.randomUUID();
    }
    setRequestKey(idempotencyKey);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          idempotency_key: idempotencyKey,
          items: items.map(({ id, quantity }) => ({ product_id: id, quantity })),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "error" in body
            ? String(body.error)
            : "Your order could not be placed. Please try again.";
        throw new Error(message);
      }
      const created = body as OrderResult;
      setOrder(created);
      clearCart();
      window.sessionStorage.removeItem("and-shop-checkout-request");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Your order could not be placed.");
    }
  }

  if (order) {
    return (
      <main className="page-main confirmation">
        <p className="eyebrow">Order received</p>
        <h1>Thank you.</h1>
        <p>Your order <strong>{order.order_number}</strong> has been placed.</p>
        <p className="detail-price">{formatBDT(order.total)}</p>
        <p>We’ll send an update to your email as your order is prepared.</p>
        <Link className="button button-dark" href="/track-order">Track your order</Link>
        <Link className="text-link" href="/shop">Continue browsing ↗</Link>
      </main>
    );
  }

  if (!items.length) {
    return <main className="page-main"><div className="empty-state"><p className="eyebrow">Your bag is empty</p><h1>Choose something to keep.</h1><Link className="button button-dark" href="/shop">Explore the collection</Link></div></main>;
  }

  return (
    <main className="page-main">
      <div className="page-title"><p className="eyebrow">Almost yours</p><h1>Checkout</h1><p>Your total and stock are verified securely when you place the order.</p></div>
      <form className="checkout-layout" onSubmit={handleSubmit(submit)} noValidate>
        <div className="checkout-fields">
          <h2>Delivery details</h2>
          <div className="form-grid">
            <Field label="Full name" name="customer_name" register={register} error={errors.customer_name?.message} />
            <Field label="Phone number" name="customer_phone" register={register} error={errors.customer_phone?.message} />
            <Field label="Email address" name="customer_email" type="email" register={register} error={errors.customer_email?.message} />
            <Field label="District" name="district" register={register} error={errors.district?.message} />
            <Field label="Area" name="area" register={register} error={errors.area?.message} />
            <Field label="Delivery address" name="delivery_address" wide register={register} error={errors.delivery_address?.message} />
            <Field label="Delivery instructions (optional)" name="delivery_instructions" wide register={register} error={errors.delivery_instructions?.message} />
          </div>
          <h2>Payment method</h2>
          <label className="payment-option"><input type="radio" value="cash_on_delivery" {...register("payment_method")} /> Cash on delivery</label>
          <label className="payment-option"><input type="radio" value="bkash" {...register("payment_method")} /> bKash — manual confirmation</label>
        </div>
        <aside className="cart-summary">
          <p className="eyebrow">Your bag</p>
          {items.map((item) => (
            <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><span>{formatBDT(decimalToMinorUnits(item.price) * item.quantity / 100)}</span></div>
          ))}
          <p className="summary-note">Product prices and delivery fee are calculated again using current store data before the order is saved.</p>
          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <button className="button button-dark button-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Placing order…" : "Place order"}</button>
          <Link className="text-link continue-shopping" href="/cart">Return to bag</Link>
        </aside>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  wide = false,
  register,
  error,
}: {
  label: string;
  name: keyof CheckoutValues;
  type?: string;
  wide?: boolean;
  register: ReturnType<typeof useForm<CheckoutValues>>["register"];
  error?: string;
}) {
  return (
    <label className={`form-field ${wide ? "form-field-wide" : ""}`}>
      <span>{label}</span>
      <input type={type} {...register(name)} aria-invalid={Boolean(error)} />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
