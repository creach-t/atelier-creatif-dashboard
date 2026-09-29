// Détail et revenus des commandes. Règle : un prix connu prime toujours.
//   1. prix inscrit sur la ligne de commande
//   2. prix du catalogue (saisi à la main, ou estimé globalement par estimatePrices)
//   3. à défaut, l'article absorbe ce qui reste du total (il se partage le reste au prorata des quantités)
// Si l'ensemble ne coïncide pas avec le total payé, l'écart n'est PAS réparti sur les produits :
// il forme une ligne à part (surplus = don / prix libre, manque = remise).
import { extrasSum } from './orderAmounts';

const qtyOf = (i) => Number(i.quantity) || 1;

// estimatedNames : produits dont le prix du catalogue est lui-même une estimation (drapeau price_estimated).
export function describeOrder(order, priceByName = {}, estimatedNames = new Set()) {
  const items = (order.items || []).filter((i) => i && i.name);
  // Le divers (frais, dons) fait partie du total payé mais pas des articles : on le retire avant de comparer.
  const total = (Number(order.total) || 0) - extrasSum(order);
  const inCatalog = (i) => Object.prototype.hasOwnProperty.call(priceByName, i.name);
  const isKnown = (i) => Number(i.price) > 0 || inCatalog(i); // un prix catalogue de 0 = gratuit, donc connu
  const unitOf = (i) => (Number(i.price) > 0 ? Number(i.price) : priceByName[i.name] || 0);

  const knownSum = items.reduce((s, i) => s + qtyOf(i) * unitOf(i), 0);
  const unpricedQty = items.filter((i) => !isKnown(i)).reduce((s, i) => s + qtyOf(i), 0);
  const fallbackUnit = unpricedQty > 0 ? Math.max(0, total - knownSum) / unpricedQty : 0;

  const lines = items.map((i) => {
    const known = isKnown(i);
    const unit = known ? unitOf(i) : fallbackUnit;
    // "estimated" : le prix affiché n'est pas un prix connu (estimation globale, ou reste du total).
    const estimated = !known || (!(Number(i.price) > 0) && estimatedNames.has(i.name));
    return { item: i, unit, total: unit * qtyOf(i), estimated, free: known && unit === 0 };
  });
  const gap = Math.round((total - lines.reduce((s, l) => s + l.total, 0)) * 100) / 100;
  return { lines, adjustment: Math.abs(gap) > 0.005 ? gap : 0 };
}

// Revenu par produit : la somme des lignes au prix connu. Le surplus (don) n'est attribué à aucun produit.
export function computeProductRevenue(orders, priceByName = {}) {
  const byName = {};
  (orders || []).forEach((order) => {
    describeOrder(order, priceByName).lines.forEach((line) => {
      const name = line.item.name;
      const entry = byName[name] || (byName[name] = { name, revenue: 0, sold: 0 });
      entry.revenue += line.total;
      entry.sold += qtyOf(line.item);
    });
  });
  return Object.values(byName);
}

// Total des dons / prix libre (surplus au-delà des prix connus) sur un ensemble de commandes.
export function computeDonations(orders, priceByName = {}) {
  return (orders || []).reduce((sum, order) => {
    const { adjustment } = describeOrder(order, priceByName);
    return adjustment > 0 ? sum + adjustment : sum;
  }, 0);
}

// Nombre total d'articles (quantités cumulées) d'une commande.
export const countOrderItems = (order) =>
  (order.items || []).reduce((sum, i) => sum + (Number(i && i.quantity) || 1), 0);
