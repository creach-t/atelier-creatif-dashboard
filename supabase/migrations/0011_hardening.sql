-- Durcissement (audit du 2026-10-01). À exécuter une fois dans le SQL Editor Supabase, AVANT ou APRÈS le
-- déploiement : le code fonctionne dans les deux cas (productSync retombe sur un simple insert sans l'index).
--
-- 1. Lecture seule côté navigateur. Le front ne parle à Supabase que pour l'authentification : toutes les
--    écritures passent par l'API (clé service role), qui valide les entrées. Avec l'ancienne policy « for all »,
--    n'importe qui connecté pouvait écrire directement via PostgREST en contournant ces validations.
-- 2. Un produit par nom et par utilisateur (deux webhooks simultanés ne créent plus de doublon).
-- 3. Le verification_token du webhook ne doit pas être recopié dans orders.raw_payload.

drop policy if exists "Users manage own profile" on profiles;
drop policy if exists "Users manage own orders" on orders;
drop policy if exists "Users manage own products" on products;
drop policy if exists "Users manage own customers" on customers;
drop policy if exists "Users read own profile" on profiles;
drop policy if exists "Users read own orders" on orders;
drop policy if exists "Users read own products" on products;
drop policy if exists "Users read own customers" on customers;

create policy "Users read own profile" on profiles for select using (id = auth.uid());
create policy "Users read own orders" on orders for select using (user_id = auth.uid());
create policy "Users read own products" on products for select using (user_id = auth.uid());
create policy "Users read own customers" on customers for select using (user_id = auth.uid());

-- Si cette ligne échoue (« could not create unique index »), des doublons existent déjà. Les repérer avec :
--   select user_id, name, count(*) from products group by 1, 2 having count(*) > 1;
-- puis fusionner / supprimer les doublons à la main, et relancer.
create unique index if not exists products_user_name_unique on products (user_id, name);

update orders set raw_payload = raw_payload - 'verification_token' where raw_payload ? 'verification_token';
