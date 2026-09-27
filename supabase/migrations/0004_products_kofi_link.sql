-- Ajoute le lien direct Ko-fi d'un produit (bouton d'achat rapide) — additif, sans risque.
-- À exécuter une fois dans le SQL Editor Supabase.

alter table products add column if not exists kofi_url text;
