-- Photos de produits envoyées depuis l'app (Supabase Storage). À exécuter une fois dans le SQL Editor Supabase.
--
-- Bucket public en LECTURE (les photos s'affichent sans jeton) ; aucune policy d'écriture : seules les écritures
-- de l'API (clé service role, POST /api/products/image) passent. Taille et types bornés aussi côté bucket.
--
-- Sans cette migration, tout fonctionne sauf l'envoi d'un fichier (l'API répond « storage_unsupported » et le
-- formulaire propose de coller l'URL de l'image à la place).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 1048576,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
