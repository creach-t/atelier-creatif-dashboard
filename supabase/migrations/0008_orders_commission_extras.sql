-- Commandes : commission de la boutique (en %, point de vente) et lignes « divers » (frais, dons,
-- remises) qui ne sont pas des articles. Additif, sans risque. À exécuter une fois dans le SQL Editor
-- Supabase (avec la 0005 si elle n'a pas encore été passée).

alter table orders add column if not exists commission_rate numeric(5,2);
alter table orders add column if not exists extras jsonb not null default '[]'::jsonb;
