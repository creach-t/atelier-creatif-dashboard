-- Ko-fi transaction id : unicité par utilisateur et non plus globale.
-- Avec l'ancienne contrainte globale, l'upsert de l'import CSV (onConflict kofi_transaction_id)
-- pouvait écraser — user_id compris — la commande d'un autre compte partageant le même id.
-- À exécuter une fois dans le SQL Editor Supabase.

alter table orders drop constraint if exists orders_kofi_transaction_id_key;

create unique index if not exists orders_user_kofi_transaction_unique
  on orders (user_id, kofi_transaction_id);
