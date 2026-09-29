-- Marque les prix produits calculés automatiquement (prix moyen pondéré recoupé sur toutes les
-- commandes) par opposition à ceux saisis à la main — additif, sans risque.
-- À exécuter une fois dans le SQL Editor Supabase.

alter table products add column if not exists price_estimated boolean not null default false;
