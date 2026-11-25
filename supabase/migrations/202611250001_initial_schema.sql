create extension if not exists pgcrypto;

do $$ begin
  create type public.profile_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('cash_on_delivery', 'bkash');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'pending_verification', 'paid', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.fulfillment_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  role public.profile_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text unique,
  featured boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  district text not null,
  area text not null,
  delivery_instructions text not null default '',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null check (delivery_fee >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_status public.fulfillment_status not null default 'pending',
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (length(title) between 2 and 120),
  comment text not null check (length(comment) between 5 and 3000),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  store_name text not null default 'AND Shop',
  tagline text,
  announcement text,
  whatsapp_number text,
  support_email text,
  phone text,
  address text,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  free_shipping_threshold numeric(12,2) check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  hero_image text,
  about_text text,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  fulfillment_status public.fulfillment_status not null,
  payment_status public.payment_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.guest_lookup_rate_limits (
  client_hash text primary key,
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count >= 0)
);

create index if not exists products_active_category_idx on public.products(category_id, created_at desc) where is_active;
create index if not exists products_active_featured_idx on public.products(featured, created_at desc) where is_active;
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_email_created_idx on public.orders(lower(customer_email), created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists reviews_approved_product_idx on public.reviews(product_id, created_at desc) where is_approved;
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create or replace function public.record_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
    or new.fulfillment_status is distinct from old.fulfillment_status
    or new.payment_status is distinct from old.payment_status then
    insert into public.order_status_history (
      order_id, fulfillment_status, payment_status, changed_by
    ) values (
      new.id, new.fulfillment_status, new.payment_status, (select auth.uid())
    );
  end if;
  return new;
end;
$$;

drop trigger if exists auth_user_profile on auth.users;
create trigger auth_user_profile after insert on auth.users
for each row execute function public.create_profile_for_new_user();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history after insert or update on public.orders
for each row execute function public.record_order_status();

insert into public.store_settings (store_name)
values ('AND Shop')
on conflict (singleton) do nothing;

create or replace function public.checkout_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address text,
  p_district text,
  p_area text,
  p_delivery_instructions text,
  p_payment_method public.payment_method,
  p_idempotency_key uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_product public.products%rowtype;
  v_item record;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_delivery_fee numeric(12,2);
  v_free_shipping_threshold numeric(12,2);
  v_total numeric(12,2);
  v_payment_status public.payment_status;
begin
  if p_idempotency_key is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'INVALID_CHECKOUT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;

  if found then
    if lower(v_existing.customer_email) <> lower(trim(p_customer_email))
      or v_existing.user_id is distinct from (select auth.uid()) then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'order_number', v_existing.order_number,
      'total', v_existing.total
    );
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    where item.product_id is null or item.quantity is null or item.quantity < 1 or item.quantity > 99
  ) then
    raise exception 'INVALID_CHECKOUT_ITEMS';
  end if;

  select ss.delivery_fee, ss.free_shipping_threshold
    into v_delivery_fee, v_free_shipping_threshold
  from public.store_settings ss
  order by ss.updated_at desc
  limit 1;
  v_delivery_fee := coalesce(v_delivery_fee, 0);

  for v_item in
    select item.product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by item.product_id
    order by item.product_id
  loop
    select * into v_product
    from public.products
    where id = v_item.product_id and is_active
    for update;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    if v_item.quantity > v_product.stock_quantity then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    v_subtotal := v_subtotal + v_product.price * v_item.quantity;
    update public.products
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_product.id;
  end loop;

  if v_free_shipping_threshold is not null and v_subtotal >= v_free_shipping_threshold then
    v_delivery_fee := 0;
  end if;
  v_total := v_subtotal + v_delivery_fee;
  v_payment_status := case
    when p_payment_method = 'bkash' then 'pending_verification'::public.payment_status
    else 'unpaid'::public.payment_status
  end;
  v_order_number := 'AND-' || to_char(now(), 'YY') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 6, '0');

  insert into public.orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    delivery_address, district, area, delivery_instructions,
    subtotal, delivery_fee, discount, total, payment_method,
    payment_status, fulfillment_status, idempotency_key
  ) values (
    v_order_number, (select auth.uid()), trim(p_customer_name), lower(trim(p_customer_email)),
    trim(p_customer_phone), trim(p_delivery_address), trim(p_district), trim(p_area),
    coalesce(trim(p_delivery_instructions), ''), v_subtotal, v_delivery_fee, 0, v_total,
    p_payment_method, v_payment_status, 'pending', p_idempotency_key
  ) returning id into v_order_id;

  for v_item in
    select item.product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by item.product_id
    order by item.product_id
  loop
    select * into v_product from public.products where id = v_item.product_id;
    insert into public.order_items (
      order_id, product_id, product_name_snapshot, sku_snapshot,
      unit_price, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.sku,
      v_product.price, v_item.quantity, v_product.price * v_item.quantity
    );
  end loop;

  return jsonb_build_object('order_number', v_order_number, 'total', v_total);
end;
$$;

create sequence if not exists public.order_number_seq;

create or replace function public.lookup_guest_order(
  p_order_number text,
  p_customer_email text,
  p_client_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_count integer;
begin
  insert into public.guest_lookup_rate_limits (client_hash, window_started_at, attempt_count)
  values (p_client_hash, now(), 1)
  on conflict (client_hash) do update
  set window_started_at = case
        when public.guest_lookup_rate_limits.window_started_at < now() - interval '15 minutes' then now()
        else public.guest_lookup_rate_limits.window_started_at
      end,
      attempt_count = case
        when public.guest_lookup_rate_limits.window_started_at < now() - interval '15 minutes' then 1
        else public.guest_lookup_rate_limits.attempt_count + 1
      end
  returning attempt_count into v_attempt_count;

  if v_attempt_count > 8 then
    raise exception 'LOOKUP_RATE_LIMITED';
  end if;

  return (
    select jsonb_build_object(
      'order_number', o.order_number,
      'customer_name', o.customer_name,
      'created_at', o.created_at,
      'fulfillment_status', o.fulfillment_status,
      'payment_status', o.payment_status,
      'total', o.total,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'name', oi.product_name_snapshot,
          'quantity', oi.quantity,
          'line_total', oi.line_total
        ))
        from public.order_items oi
        where oi.order_id = o.id
      ), '[]'::jsonb)
    )
    from public.orders o
    where upper(o.order_number) = upper(trim(p_order_number))
      and lower(o.customer_email) = lower(trim(p_customer_email))
      and o.user_id is null
    limit 1
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.order_status_history enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.guest_lookup_rate_limits enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles_update_own_or_admin" on public.profiles
for update to authenticated using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "categories_read_active" on public.categories
for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "categories_admin_all" on public.categories
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products_read_active" on public.products
for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "products_admin_all" on public.products
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_images_read_active" on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active)
  or (select public.is_admin())
);
create policy "product_images_admin_all" on public.product_images
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "orders_select_own_or_admin" on public.orders
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders_admin_update" on public.orders
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "order_items_select_own_or_admin" on public.order_items
for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  or (select public.is_admin())
);

create policy "reviews_read_approved" on public.reviews
for select to anon, authenticated using (is_approved or user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews_insert_own" on public.reviews
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
create policy "reviews_admin_update" on public.reviews
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "reviews_admin_delete" on public.reviews
for delete to authenticated using ((select public.is_admin()));

create policy "settings_read_public" on public.store_settings
for select to anon, authenticated using (true);
create policy "settings_admin_update" on public.store_settings
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "settings_admin_insert" on public.store_settings
for insert to authenticated with check ((select public.is_admin()));

create policy "subscribers_admin_only" on public.subscribers
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "contact_messages_admin_only" on public.contact_messages
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "order_history_own_or_admin" on public.order_status_history
for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  or (select public.is_admin())
);
create policy "audit_logs_admin_read" on public.admin_audit_logs
for select to authenticated using ((select public.is_admin()));

revoke all on function public.checkout_order(text, text, text, text, text, text, text, public.payment_method, uuid, jsonb) from public;
grant execute on function public.checkout_order(text, text, text, text, text, text, text, public.payment_method, uuid, jsonb) to anon, authenticated;
revoke all on function public.lookup_guest_order(text, text, text) from public, anon, authenticated;
grant execute on function public.lookup_guest_order(text, text, text) to service_role;
grant execute on function public.is_admin() to anon, authenticated;

grant select on public.categories, public.products, public.product_images, public.reviews, public.store_settings to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products, public.product_images, public.reviews to authenticated;
grant select on public.profiles, public.orders, public.order_items, public.order_status_history, public.admin_audit_logs to authenticated;
grant update on public.orders to authenticated;
grant update, insert on public.store_settings to authenticated;

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
create policy "product_images_admin_insert" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_update" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_delete" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
