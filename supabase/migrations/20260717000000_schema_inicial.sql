-- Schema inicial: restaurants, categories, products, product_variants, orders, order_items
-- Ver 01-documento-principal.md secao 5 para o modelo de dados e regras de RLS.

create extension if not exists "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  address text not null,
  phone text not null,
  delivery_fee numeric(10,2) not null default 0,
  opening_hours jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  active boolean not null default true
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete restrict,
  customer_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  status text not null default 'recebido'
    check (status in ('recebido', 'preparo', 'saiu_entrega', 'entregue', 'cancelado')),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid not null references product_variants(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  notes text
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_categories_restaurant on categories(restaurant_id);
create index idx_products_restaurant on products(restaurant_id);
create index idx_products_category on products(category_id);
create index idx_variants_product on product_variants(product_id);
create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_customer on orders(customer_id);
create index idx_order_items_order on order_items(order_id);

-- ============================================================
-- RLS
-- ============================================================

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- restaurants: leitura publica, escrita so pelo dono
create policy "restaurants_select_public" on restaurants
  for select using (true);

create policy "restaurants_insert_owner" on restaurants
  for insert with check (owner_id = auth.uid());

create policy "restaurants_update_owner" on restaurants
  for update using (owner_id = auth.uid());

-- categories: leitura publica, escrita restrita ao dono do restaurante
create policy "categories_select_public" on categories
  for select using (true);

create policy "categories_write_owner" on categories
  for all using (
    exists (
      select 1 from restaurants r
      where r.id = categories.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = categories.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- products: leitura publica, escrita restrita ao dono do restaurante
create policy "products_select_public" on products
  for select using (true);

create policy "products_write_owner" on products
  for all using (
    exists (
      select 1 from restaurants r
      where r.id = products.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = products.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- product_variants: leitura publica, escrita restrita ao dono do restaurante (via product)
create policy "variants_select_public" on product_variants
  for select using (true);

create policy "variants_write_owner" on product_variants
  for all using (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = product_variants.product_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = product_variants.product_id and r.owner_id = auth.uid()
    )
  );

-- orders: cliente autenticado cria e le os proprios; dono do restaurante le e atualiza status
create policy "orders_select_customer_or_owner" on orders
  for select using (
    customer_id = auth.uid()
    or exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "orders_insert_customer" on orders
  for insert with check (customer_id = auth.uid());

create policy "orders_update_owner" on orders
  for update using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- order_items: acompanha a visibilidade/criacao do pedido pai; sem update/delete (pedido imutavel)
create policy "order_items_select_customer_or_owner" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid()
             or exists (
               select 1 from restaurants r
               where r.id = o.restaurant_id and r.owner_id = auth.uid()
             ))
    )
  );

create policy "order_items_insert_customer" on order_items
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );
