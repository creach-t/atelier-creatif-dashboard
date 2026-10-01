const { chunk } = require('./batch');

// Enrichit automatiquement le catalogue produits à partir des ventes Ko-fi (webhook + import
// CSV) : quand un article vendu ne correspond à aucun produit existant, on le crée. On ne
// touche jamais à un produit déjà présent (le prix reste sous le contrôle de la créatrice).
// Pas de gestion de stock dans Cashly — seule la quantité vendue (calculée depuis les
// commandes côté front) compte, donc rien à initialiser ici au-delà du nom/catégorie/prix.
// Requêtes groupées : un import peut contenir des milliers d'articles. Les erreurs sont loguées sans interrompre l'appelant.
async function syncProductsFromItems(supabase, userId, items, { price = 0 } = {}) {
  const names = [...new Set((Array.isArray(items) ? items : []).map((item) => item && item.name && item.name.trim()).filter(Boolean))];
  if (names.length === 0) return;

  const known = new Set();
  for (const batch of chunk(names, 100)) {
    const { data, error } = await supabase.from('products').select('name').eq('user_id', userId).in('name', batch);
    if (error) {
      console.error('productSync lookup error:', error);
      return;
    }
    data.forEach((p) => known.add(p.name));
  }

  const rows = names
    .filter((name) => !known.has(name))
    .map((name) => ({ user_id: userId, name, category: 'Ko-fi', price: Number(price) || 0, image: '🎁' }));

  for (const batch of chunk(rows, 500)) {
    // Index unique (user_id, name) : une course avec une autre requête ignore le doublon au lieu de le créer.
    let { error } = await supabase.from('products').upsert(batch, { onConflict: 'user_id,name', ignoreDuplicates: true });
    // 42P10 : l'index de la migration 0011 n'est pas encore créé -> simple insertion, comme avant.
    if (error && error.code === '42P10') ({ error } = await supabase.from('products').insert(batch));
    if (error) console.error('productSync insert error:', error);
  }
}

module.exports = { syncProductsFromItems };
