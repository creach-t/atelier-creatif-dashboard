// Pas de gestion de stock dans Cashly — la seule métrique produit qui compte est la
// quantité vendue, dérivée des articles déjà présents dans les commandes.
export function computeSoldByName(orders) {
  const sold = {};
  (orders || []).forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!item || !item.name) return;
      sold[item.name] = (sold[item.name] || 0) + (Number(item.quantity) || 0);
    });
  });
  return sold;
}
