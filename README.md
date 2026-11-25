# AND Shop

AND Shop is a Next.js App Router storefront for a small lifestyle-goods boutique in Bangladesh. It uses Supabase for the live catalogue, store settings, authentication-ready profiles, product images, and transactional checkout.

## Run locally

1. Use Node.js 20.19+ and npm.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (for guest order tracking) the server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply `supabase/migrations/202611250001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
5. Add products and categories in the Supabase dashboard. Products default to inactive; publish them by setting `is_active` after their product details and images are ready.
6. Start the app:

   ```sh
   npm install
   npm run dev
   ```

Without Supabase credentials the app shows an explicit setup state; it does not invent a catalogue or simulate successful orders.

## Database and security

- The migration defines the catalogue, store settings, customer profiles, orders, order snapshots, reviews, contact/newsletter records, status history, and admin audit-log storage.
- Public reads are restricted to active products/categories and approved reviews. Orders and profiles are protected by row-level security.
- Checkout calls a PostgreSQL `SECURITY DEFINER` operation using only the public Supabase key. It locks products, reads canonical prices, calculates delivery, decrements stock and writes the order/items in a single transaction.
- Checkout accepts an idempotency UUID and serializes concurrent retries for the same key.
- Guest tracking uses a server-only service key and an atomic database rate limit. Never prefix the service key with `NEXT_PUBLIC_` or expose it to browser code.
- To provision the initial administrator, create their Auth user first, then run a one-time owner-level SQL update for that verified user UUID:

  ```sql
  update public.profiles set role = 'admin' where id = '<verified-auth-user-uuid>';
  ```

  Customer profile writes cannot change the role.
- The `product-images` public bucket is limited to image types and 5 MB per file; write policies require an admin profile.

## Implemented

- Responsive editorial storefront with light/dark preference, live store settings, category navigation, featured products, and product detail pages.
- Server-side catalogue search, category/availability filters, sorting, and pagination.
- Persistent browser bag and guest checkout with server-side validation, authoritative price/stock calculation, historical order snapshots, and cash-on-delivery or manual bKash status.
- Guest order tracking with generic not-found responses and per-client database rate limits.
- Focused unit tests for exact-decimal and delivery calculations.

## Remaining work before production acceptance

This repository is a working foundation, not a finished production store. The admin dashboard and CRUD screens, customer sign-in/order history, review submission/moderation UI, contact/newsletter flows, email provider, WhatsApp order handoff, additional policy pages, E2E tests, and deployment/backup runbooks still need implementation and live Supabase verification. Do not launch until those flows and the RLS policies are tested in the target Supabase project.
