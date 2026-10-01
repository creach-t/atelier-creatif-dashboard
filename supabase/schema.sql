-- Cashly — schéma Supabase (installation neuve, multi-utilisateur)
-- À exécuter une fois dans l'éditeur SQL de ton projet Supabase (https://app.supabase.com -> SQL Editor).
-- Pour une base existante (créée avant le passage multi-utilisateur), voir plutôt
-- supabase/migrations/0002_multi_tenant.sql

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  kofi_verification_token text unique,
  onboarding_completed boolean not null default false,
  workspace jsonb,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  price_estimated boolean not null default false,
  is_free boolean not null default false,
  kind text check (kind is null or kind in ('physical', 'digital', 'both')),
  stock integer not null default 0,
  min_stock integer not null default 1,
  image text default '🎨',
  kofi_url text,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
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
  commission_rate numeric(5,2),
  extras jsonb not null default '[]'::jsonb,
  notes text,
  kofi_transaction_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_channel_idx on orders (channel);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists products_user_id_idx on products (user_id);
create index if not exists customers_user_id_idx on customers (user_id);
create unique index if not exists customers_user_name_unique on customers (user_id, name);
create unique index if not exists products_user_name_unique on products (user_id, name);
create unique index if not exists orders_user_kofi_transaction_unique on orders (user_id, kofi_transaction_id);

-- Crée automatiquement une ligne "profiles" à chaque inscription (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security : lecture seule pour le navigateur (clé publique + JWT de l'utilisateur). Toutes les
-- écritures passent par l'API (clé service_role, qui bypass RLS), qui valide les entrées et filtre par user_id.
alter table profiles enable row level security;
alter table orders enable row level security;
alter table products enable row level security;
alter table customers enable row level security;

create policy "Users read own profile" on profiles for select using (id = auth.uid());
create policy "Users read own orders" on orders for select using (user_id = auth.uid());
create policy "Users read own products" on products for select using (user_id = auth.uid());
create policy "Users read own customers" on customers for select using (user_id = auth.uid());
