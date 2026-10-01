// Adaptateur Etsy : transforme un export CSV officiel (Etsy > Paramètres de la boutique > Options > Données
// téléchargeables) en lignes prêtes pour POST /api/orders/import { source: 'etsy' }.
//
// Deux exports existent, détectés à leurs colonnes :
//   « Articles vendus » (Sold Order Items) : une ligne par article -> regroupées par n° de commande, avec les noms d'articles.
//   « Commandes vendues » (Sold Orders)    : une ligne par commande -> pas de noms d'articles, mais les frais réels (Card Processing Fees).
//
// ⚠️ Les noms de colonnes ci-dessous suivent la documentation et des exports connus d'Etsy ; la correspondance est
// tolérante (casse, accents, alias) mais n'a pas pu être vérifiée sur un export réel de cette boutique. Un fichier
// non reconnu est refusé avec un message clair plutôt que mal interprété.
import { rowReader, hasHeader, parseAmount, parseDay, round2 } from './csvFields';

export const ETSY_ID = 'etsy';

const MAX_ITEMS = 200;

export const isEtsyItemsExport = (rows) => hasHeader(rows, 'Item Name', "Nom de l'article");
export const isEtsyOrdersExport = (rows) => !isEtsyItemsExport(rows) && hasHeader(rows, 'Order Total', 'Order Net', 'Total de la commande');

const ORDER_ID = ['Order ID', 'Numéro de commande', 'N° de commande'];
const SALE_DATE = ['Sale Date', 'Date of Sale', 'Date de vente'];

function statusOf(read) {
  return read('Date Shipped', "Date d'expédition") ? 'delivered' : 'pending';
}

// Frais réels / total -> taux en % (borné 0-100, 2 décimales). null si la colonne est absente ou vide.
function feeRate(fees, total) {
  if (fees === null || !(total > 0)) return null;
  return Math.min(100, Math.max(0, round2((fees / total) * 100)));
}

// rawRows : lignes de utils/parseCsv. options.defaultRate : taux appliqué quand l'export ne donne pas les frais.
// Retourne { rows, unreadable } : unreadable = lignes sans n° de commande ou sans date lisible (ignorées, comptées).
export function normalizeEtsyRows(rawRows, { defaultRate = 0 } = {}) {
  if (isEtsyItemsExport(rawRows)) return normalizeItemsExport(rawRows, defaultRate);
  if (isEtsyOrdersExport(rawRows)) return normalizeOrdersExport(rawRows, defaultRate);
  return { rows: [], unreadable: 0, recognized: false };
}

function normalizeItemsExport(rawRows, defaultRate) {
  const orders = new Map();
  let unreadable = 0;

  rawRows.forEach((raw) => {
    const read = rowReader(raw);
    const id = read(...ORDER_ID);
    const date = parseDay(read(...SALE_DATE));
    if (!id || !date) { unreadable += 1; return; }

    const quantity = parseAmount(read('Quantity', 'Quantité'));
    const price = parseAmount(read('Price', 'Prix'));
    const lineTotal = parseAmount(read('Item Total', "Total de l'article"));
    const name = read('Item Name', "Nom de l'article") || 'Article Etsy';
    const qty = quantity > 0 ? quantity : 1;
    // Le prix unitaire vient de « Price » ; à défaut, de « Item Total » divisé par la quantité.
    const unit = price !== null && price >= 0 ? price : lineTotal !== null && lineTotal >= 0 ? lineTotal / qty : 0;

    if (!orders.has(id)) {
      orders.set(id, {
        source_ref: id,
        date,
        customer_name: read('Buyer', 'Full Name', 'Acheteur') || null,
        items: [],
        shipping: parseAmount(read('Order Shipping', 'Shipping', 'Livraison')) || 0,
        discount: 0,
        status: statusOf(read),
      });
    }
    const order = orders.get(id);
    if (order.items.length < MAX_ITEMS) order.items.push({ name, quantity: qty, price: round2(unit) });
  });

  const rows = [...orders.values()].map(({ shipping, discount, ...order }) => {
    const itemsTotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0);
    const extras = shipping > 0 ? [{ label: 'Livraison', amount: round2(shipping) }] : [];
    return { ...order, extras, total: round2(itemsTotal + (shipping > 0 ? shipping : 0) - discount), commission_rate: defaultRate };
  });
  return { rows, unreadable, recognized: true };
}

function normalizeOrdersExport(rawRows, defaultRate) {
  const rows = [];
  const seen = new Set();
  let unreadable = 0;

  rawRows.forEach((raw) => {
    const read = rowReader(raw);
    const id = read(...ORDER_ID);
    const date = parseDay(read(...SALE_DATE));
    const total = parseAmount(read('Order Total', 'Total de la commande'));
    if (!id || !date || total === null || total < 0) { unreadable += 1; return; }
    if (seen.has(id)) return;
    seen.add(id);

    const count = parseAmount(read('Number of Items', "Nombre d'articles"));
    const rate = feeRate(parseAmount(read('Card Processing Fees', 'Frais de traitement')), total);
    rows.push({
      source_ref: id,
      date,
      customer_name: read('Full Name', 'Buyer', 'Nom complet', 'Acheteur') || null,
      // Cet export ne détaille pas les articles : une seule ligne, au montant de la commande.
      items: [{ name: 'Commande Etsy', quantity: count > 0 ? count : 1, price: round2(total / (count > 0 ? count : 1)) }],
      extras: [],
      total: round2(total),
      commission_rate: rate === null ? defaultRate : rate,
      status: statusOf(read),
    });
  });
  return { rows, unreadable, recognized: true };
}

export const etsyAdapter = {
  id: ETSY_ID,
  help: 'Sur Etsy : Paramètres de la boutique → Options → Données téléchargeables → « Articles vendus » (avec les noms d’articles) ou « Commandes vendues » (avec les frais réels), au format CSV.',
  parse: normalizeEtsyRows,
};
