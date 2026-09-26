-- Atelier Créatif Dashboard — schéma Supabase
-- À exécuter une fois dans l'éditeur SQL de ton projet Supabase (https://app.supabase.com -> SQL Editor).

create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  stock integer not null default 0,
  min_stock integer not null default 1,
  image text default '🎨',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('kofi', 'reel')),
  customer_name text,
  customer_email text,
  items jsonb not null default '[]',
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'shipped', 'delivered', 'cancelled')),
  order_date date not null default current_date,
  tracking text,
  shipping text,
  shop_name text,
  kofi_transaction_id text unique,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_channel_idx on orders (channel);
create index if not exists orders_created_at_idx on orders (created_at desc);

-- Données de départ optionnelles (reprend les exemples du dashboard d'origine)
insert into products (name, category, price, stock, min_stock, image) values
  ('Sticker Chat Kawaii', 'Stickers', 4.50, 25, 5, '🐱'),
  ('Figurine Licorne', 'Figurines', 15.00, 8, 3, '🦄'),
  ('Illustration Personnalisée', 'Illustrations', 35.00, 999, 1, '🎨')
on conflict do nothing;
