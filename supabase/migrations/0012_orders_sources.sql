-- Nouvelles sources de vente (Etsy, Vinted, Depop…). À exécuter une fois dans le SQL Editor Supabase.
--
-- 1. orders.channel n'est plus limité à ('kofi', 'reel') : la liste des sources vit dans le registre applicatif
--    (src/domain/sources.js, api/lib/sources.js, validée par l'API). La base garde une contrainte LARGE (un
--    identifiant court en minuscules) : ajouter une source ne demande plus de migration.
-- 2. orders.source_ref : identifiant de la commande chez la source (n° de commande Etsy…), unique par
--    (utilisateur, canal) pour dédoublonner les imports. kofi_transaction_id reste inchangé.
--
-- Sans cette migration, l'app fonctionne pour Ko-fi et point de vente ; créer ou importer une commande d'une
-- autre source répond « migration_0012_required ».

alter table orders drop constraint if exists orders_channel_check;
alter table orders add constraint orders_channel_check check (channel ~ '^[a-z][a-z0-9_]{1,31}$');

alter table orders add column if not exists source_ref text;
-- Index non partiel (nécessaire à l'upsert PostgREST) : les NULL ne sont jamais considérés comme doublons.
create unique index if not exists orders_user_channel_source_ref_unique on orders (user_id, channel, source_ref);

notify pgrst, 'reload schema';
