-- Migration additive : passage de Cashly en multi-utilisateur.
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase, sur une base déjà créée avec l'ancien
-- supabase/schema.sql (mono-utilisateur). Sans danger pour les données existantes :
-- elles restent avec user_id = null jusqu'à la réassignation manuelle (voir README/DEPLOYMENT).

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  kofi_verification_token text unique,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table orders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table products add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists products_user_id_idx on products (user_id);

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

alter table profiles enable row level security;
alter table orders enable row level security;
alter table products enable row level security;

drop policy if exists "Users manage own profile" on profiles;
create policy "Users manage own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users manage own orders" on orders;
create policy "Users manage own orders" on orders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage own products" on products;
create policy "Users manage own products" on products
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Après avoir créé ton propre compte via le nouvel écran de connexion, récupère ton UUID
-- (Supabase → Authentication → Users) et lance, en remplaçant <TON_UUID> :
--
--   update orders set user_id = '<TON_UUID>' where user_id is null;
--   update products set user_id = '<TON_UUID>' where user_id is null;
--   update profiles set kofi_verification_token = '<TON_ANCIEN_TOKEN_KOFI>' where id = '<TON_UUID>';
