// Enrichit automatiquement le catalogue produits à partir des ventes Ko-fi (webhook + import
// CSV) : quand un article vendu ne correspond à aucun produit existant, on le crée. On ne
// touche jamais à un produit déjà présent (le prix reste sous le contrôle de la créatrice).
// Pas de gestion de stock dans Cashly — seule la quantité vendue (calculée depuis les
// commandes côté front) compte, donc rien à initialiser ici au-delà du nom/catégorie/prix.
async function syncProductsFromItems(supabase, userId, items, { price = 0 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    const name = item && item.name && item.name.trim();
    if (!name) continue;

    const { data: existing, error: lookupError } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .maybeSingle();

    if (lookupError) {
      console.error('productSync lookup error:', lookupError);
      continue;
    }
    if (existing) continue;

    const { error: insertError } = await supabase.from('products').insert({
      user_id: userId,
      name,
      category: 'Ko-fi',
      price: Number(price) || 0,
      image: '🎁',
    });

    if (insertError) {
      console.error('productSync insert error:', insertError);
    }
  }
}

module.exports = { syncProductsFromItems };
