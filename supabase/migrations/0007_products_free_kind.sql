-- Produits : « gratuit » explicite (0 € voulu, pas un prix manquant) et type physique / numérique.
-- Additif, sans risque : les produits existants restent inchangés (kind non précisé).
-- À exécuter une fois dans le SQL Editor Supabase.

alter table products add column if not exists is_free boolean not null default false;
alter table products add column if not exists kind text;
alter table products drop constraint if exists products_kind_check;
alter table products add constraint products_kind_check check (kind is null or kind in ('physical', 'digital', 'both'));
