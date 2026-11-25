"use client";

import { useState } from "react";
import { formatBDT } from "@/lib/format";

type TrackedOrder = {
  order_number: string;
  customer_name: string;
  created_at: string;
  fulfillment_status: string;
  payment_status: string;
  total: string;
  items: { name: string; quantity: number; line_total: string }[];
};

export default function TrackOrderPage() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: form.get("order_number"),
          customer_email: form.get("customer_email"),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body
          ? String(body.error)
          : "Order lookup failed.";
        throw new Error(message);
      }
      setOrder(body as TrackedOrder);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Order lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-main tracking-page">
      <div className="page-title"><p className="eyebrow">A little reassurance</p><h1>Track your order</h1><p>Enter the order number and email address used when placing your order.</p></div>
      <form className="tracking-form" onSubmit={submit}>
        <label className="form-field"><span>Order number</span><input name="order_number" required autoComplete="off" /></label>
        <label className="form-field"><span>Email address</span><input name="customer_email" type="email" required autoComplete="email" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Looking up…" : "Find my order"}</button>
      </form>
      {order && (
        <section className="tracking-result" aria-live="polite">
          <div className="section-heading">
            <div><p className="eyebrow">Order {order.order_number}</p><h2>{statusLabel(order.fulfillment_status)}</h2></div>
            <span className="tracking-badge">{statusLabel(order.payment_status)}</span>
          </div>
          <p>Placed {new Date(order.created_at).toLocaleDateString("en-BD", { dateStyle: "long" })}</p>
          {order.items.map((item, index) => <div className="summary-row" key={`${item.name}-${index}`}><span>{item.name} × {item.quantity}</span><span>{formatBDT(item.line_total)}</span></div>)}
          <div className="summary-row tracking-total"><strong>Total</strong><strong>{formatBDT(order.total)}</strong></div>
        </section>
      )}
    </main>
  );
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}
