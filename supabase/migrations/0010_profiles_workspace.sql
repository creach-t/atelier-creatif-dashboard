-- Espace de travail personnalisable : pages, widgets et disposition de chaque utilisatrice, synchronisés
-- entre ses appareils. Colonne optionnelle : sans elle, l'app garde la personnalisation en local (navigateur).
-- À exécuter une fois dans le SQL Editor Supabase.

alter table profiles add column if not exists workspace jsonb;
