-- Ajoute une note libre optionnelle sur une commande — additif, sans risque.
-- À exécuter une fois dans le SQL Editor Supabase.

alter table orders add column if not exists notes text;
