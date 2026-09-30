import { computeProductRevenue } from './computeProductRevenue';
import { catalogPrices } from './estimatePrices';
import { groupProducts, groupIndex } from './productVariants';

// Classement des produits (variantes additionnées) sur une liste de commandes.
// by : 'revenue' (prix × quantité) ou 'sold' (unités). Renvoie { items: [{ group, revenue, sold }], totalRevenue }.
export function rankProducts(orders, products, { limit = 5, by = 'revenue' } = {}) {
  const index = groupIndex(groupProducts(products));
  const byKey = new Map();
  const entries = computeProductRevenue(orders, catalogPrices(products));
  entries.forEach((entry) => {
    const group = index.get(entry.name);
    if (!group) return;
    const row = byKey.get(group.key) || { group, revenue: 0, sold: 0 };
    row.revenue += entry.revenue;
    row.sold += entry.sold;
    byKey.set(group.key, row);
  });
  const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
  const items = [...byKey.values()]
    .filter((t) => (by === 'sold' ? t.sold > 0 : t.revenue > 0))
    .sort((a, b) => (by === 'sold' ? b.sold - a.sold || b.revenue - a.revenue : b.revenue - a.revenue))
    .slice(0, limit);
  return { items, totalRevenue };
}
