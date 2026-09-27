-- Ajoute la table customers (fiches clients persistées) — additif, sans risque pour les
-- données existantes. À exécuter une fois dans le SQL Editor Supabase.

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx on customers (user_id);
create unique index if not exists customers_user_name_unique on customers (user_id, name);

alter table customers enable row level security;

drop policy if exists "Users manage own customers" on customers;
create policy "Users manage own customers" on customers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Rattrapage : crée une fiche client pour chaque nom de client déjà présent dans tes
-- commandes existantes (une par (user_id, customer_name) distinct, hors anonymes).
insert into customers (user_id, name, email)
select distinct on (user_id, customer_name)
  user_id, customer_name, customer_email
from orders
where customer_name is not null and customer_name <> ''
on conflict (user_id, name) do nothing;
