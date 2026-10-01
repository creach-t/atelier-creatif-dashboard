// Brouillon d'une commande en cours de saisie : fonctions pures (aucun React), donc testables seules.
// Le total n'est jamais saisi, il se calcule toujours à partir des lignes, du divers et de l'écart (`gap`).
import { describeOrder } from '../../utils/computeProductRevenue';
import { catalogPrices, estimatedNames } from '../../utils/estimatePrices';
import { extrasSum } from '../../utils/orderAmounts';
import { round2 } from '../../utils/money';
import { todayLocal } from '../../utils/dates';
import { scopedKey } from '../../utils/userScope';
import { defaultStatusFor } from '../../domain/constants';

export const emptyItem = () => ({ name: '', quantity: 1, price: 0 });
export const emptyExtra = () => ({ label: '', amount: '' });

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Dernière commission saisie, pour préremplir la suivante (la boutique garde en général le même taux).
const LAST_COMMISSION_KEY = () => scopedKey('cashly.lastCommission');
export const readLastCommission = () => {
  try { return window.localStorage.getItem(LAST_COMMISSION_KEY()) || ''; } catch (e) { return ''; }
};
export const rememberCommission = (value) => {
  try { window.localStorage.setItem(LAST_COMMISSION_KEY(), String(value)); } catch (e) { /* stockage indisponible */ }
};

// En modification, chaque article reprend son prix (saisi, catalogue, ou déduit du total). Ce qui reste
// pour retomber sur le total enregistré (don / prix libre, remise, ou montant jamais détaillé) est conservé
// à part dans `gap`.
function itemsFromOrder(order, products) {
  const { lines } = describeOrder(order, catalogPrices(products), estimatedNames(products));
  const items = lines.map((l) => ({ name: l.item.name, quantity: Number(l.item.quantity) || 1, price: round2(l.unit) }));
  const listed = items.reduce((sum, r) => sum + r.quantity * r.price, 0);
  const gap = round2((Number(order.total) || 0) - listed - extrasSum(order));
  return { items, gap: Math.abs(gap) < 0.03 ? 0 : gap };
}

export function initialDraft(order, products) {
  // `touched` : ce que l'utilisateur a réellement modifié. En modification, le reste n'est pas réécrit.
  const untouched = { items: false, extras: false, gap: false };
  if (!order) {
    return {
      channel: 'reel', customerName: '', customerEmail: '', orderDate: todayLocal(), status: defaultStatusFor('reel'),
      items: [emptyItem()], extras: [], gap: 0, undetailed: false,
      commission: readLastCommission(), tracking: '', notes: '', touched: untouched,
    };
  }
  const { items, gap } = itemsFromOrder(order, products);
  return {
    channel: order.channel,
    customerName: order.customer_name || '',
    customerEmail: order.customer_email || '',
    orderDate: order.order_date,
    status: order.status,
    items: items.length > 0 ? items : [emptyItem()],
    extras: Array.isArray(order.extras) ? order.extras.map((e) => ({ label: e.label, amount: String(e.amount) })) : [],
    gap,
    undetailed: items.length === 0,
    commission: order.commission_rate ? String(order.commission_rate) : '',
    tracking: order.tracking || '',
    notes: order.notes || '',
    touched: untouched,
  };
}

export function orderTotals(draft) {
  const itemsTotal = draft.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const extrasTotal = draft.extras.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const total = round2(itemsTotal + extrasTotal + draft.gap); // ce que le client paie (brut)
  const commissionRate = draft.channel === 'reel' ? Math.min(Math.max(Number(draft.commission) || 0, 0), 100) : 0;
  const commissionAmount = round2((total * commissionRate) / 100); // même arrondi que orderAmounts.commissionOf
  return { total, commissionRate, commissionAmount, net: round2(total - commissionAmount) };
}

export const cleanItems = (items) => items
  .filter((item) => item.name.trim())
  .map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity) || 1, price: Number(item.price) || 0 }));

// Lignes « divers » : ne créent ni article ni produit, comptent seulement dans le total.
export const cleanExtras = (extras) => extras
  .filter((e) => e.label.trim() && Number(e.amount))
  .map((e) => ({ label: e.label.trim(), amount: Number(e.amount) }));

// Message d'erreur à afficher, ou null si le brouillon peut être enregistré.
export function validateDraft(draft, { isEditing }) {
  if (!draft.customerName.trim()) return 'Le client est obligatoire.';
  // Une ligne divers à moitié remplie n'est pas ignorée en silence : on demande de la compléter.
  if (draft.extras.some((x) => (x.label.trim() && !Number(x.amount)) || (!x.label.trim() && Number(x.amount)))) {
    return 'Complète la ligne divers : il faut un libellé et un montant.';
  }
  // Une commande existante peut n'avoir jamais été détaillée (simple montant) : on peut la modifier quand même.
  if (!isEditing && cleanItems(draft.items).length === 0 && cleanExtras(draft.extras).length === 0) {
    return 'Ajoute au moins un article ou une ligne divers.';
  }
  if (orderTotals(draft).total < 0) return 'Le total ne peut pas être négatif.';
  return null;
}

// Articles saisis sans correspondance dans le catalogue : ils deviennent de nouveaux produits (un par nom).
export function newProducts(items, products) {
  const known = new Set((products || []).map((p) => p.name.toLowerCase()));
  const seen = new Set();
  return items.filter((i) => {
    if (known.has(i.name.toLowerCase()) || seen.has(i.name)) return false;
    seen.add(i.name);
    return true;
  });
}

export function buildCreatePayload(draft, email) {
  const { total, commissionRate } = orderTotals(draft);
  const extras = cleanExtras(draft.extras);
  return {
    channel: draft.channel,
    customer_name: draft.customerName.trim(),
    customer_email: email,
    items: cleanItems(draft.items),
    total: round2(total),
    status: draft.status,
    order_date: draft.orderDate,
    notes: draft.notes.trim() || null,
    ...(draft.tracking.trim() && { tracking: draft.tracking.trim() }),
    ...(extras.length > 0 && { extras }),
    ...(commissionRate > 0 && { commission_rate: commissionRate }),
  };
}

// En modification : uniquement ce qui a réellement changé.
export function buildUpdateChanges(order, draft, email) {
  const { total, commissionRate } = orderTotals(draft);
  const next = {
    channel: draft.channel,
    customer_name: draft.customerName.trim(),
    customer_email: email,
    status: draft.status,
    order_date: draft.orderDate,
    tracking: draft.tracking.trim() || null,
    notes: draft.notes.trim() || null,
    commission_rate: commissionRate,
  };
  const before = {
    channel: order.channel,
    customer_name: order.customer_name || '',
    customer_email: order.customer_email || null,
    status: order.status,
    order_date: order.order_date,
    tracking: order.tracking || null,
    notes: order.notes || null,
    commission_rate: Number(order.commission_rate) || 0,
  };
  const changes = {};
  Object.keys(next).forEach((key) => { if (!sameJson(next[key], before[key])) changes[key] = next[key]; });
  const { touched } = draft;
  if (touched.items) changes.items = cleanItems(draft.items);
  if (touched.extras) changes.extras = cleanExtras(draft.extras);
  // Le total ne change que si les lignes ou l'écart ont changé (calculé, jamais saisi).
  if (touched.items || touched.extras || touched.gap) changes.total = total;
  return changes;
}
