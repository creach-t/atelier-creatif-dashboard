import { round2 } from './money';

// Montants d'une commande.
//   total  = ce que le client a payé (brut) : articles + lignes « divers »
//   divers = frais, dons, remises (montant négatif) : comptent dans le total, jamais dans les articles
//   commission = % prélevé par la boutique (point de vente) sur le total ; net = ce que tu touches vraiment.
// Les revenus de l'app (Dashboard, Rapports) sont comptés en net.

// Une commande annulée n'est jamais comptée dans les revenus, quantités vendues ni statistiques clients.
export const isCounted = (order) => order.status !== 'cancelled';

export const extrasOf = (order) =>
  (Array.isArray(order.extras) ? order.extras : []).filter((e) => e && e.label && Number(e.amount));

export const extrasSum = (order) => round2(extrasOf(order).reduce((s, e) => s + Number(e.amount), 0));

export const commissionRateOf = (order) => {
  const rate = Number(order.commission_rate);
  return rate > 0 ? Math.min(rate, 100) : 0;
};

export const commissionOf = (order) => round2(((Number(order.total) || 0) * commissionRateOf(order)) / 100);

export const netOf = (order) => round2((Number(order.total) || 0) - commissionOf(order));
