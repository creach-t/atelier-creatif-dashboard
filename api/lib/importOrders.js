// Import générique d'un export CSV de source (Etsy…) : le navigateur parse le fichier (adaptateurs de src/sources/)
// et envoie des lignes normalisées ; ici on ne leur fait AUCUNE confiance (textes bornés, nombres finis, dates valides).
// Dédoublonnage par (user_id, channel, source_ref) : réimporter un fichier ne crée jamais de doublon et ne
// réécrit pas les commandes déjà là (statut, notes… modifiés à la main restent intacts).
const { SOURCES } = require('./sources');
const { STATUSES, isDay, MAX_AMOUNT } = require('./validate');
const { serverError, isMissingSourcesMigration, migrationRequired } = require('./errors');
const { syncProductsFromItems } = require('./productSync');
const { syncCustomers } = require('./customerSync');

const MAX_ROWS = 5000;
const MAX_ITEMS = 200;
const MAX_EXTRAS = 50;

const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const amount = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_AMOUNT ? Math.round(v * 100) / 100 : null);

// Sources dont l'import CSV générique est branché (hors Ko-fi, qui a son propre format et sa propre clé).
const importableSource = (id) => SOURCES.find((s) => s.id === id && s.importAdapter && s.importAdapter !== 'kofi') || null;

function cleanItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((i) => i && typeof i.name === 'string' && i.name.trim())
    .slice(0, MAX_ITEMS)
    .map((i) => ({
      name: i.name.trim().slice(0, 200),
      quantity: Number.isFinite(i.quantity) && i.quantity > 0 && i.quantity < 100000 ? i.quantity : 1,
      price: amount(i.price) ?? 0,
    }));
}

function cleanExtras(extras) {
  return (Array.isArray(extras) ? extras : [])
    .filter((e) => e && typeof e.label === 'string' && e.label.trim() && typeof e.amount === 'number' && Number.isFinite(e.amount) && Math.abs(e.amount) <= MAX_AMOUNT)
    .slice(0, MAX_EXTRAS)
    .map((e) => ({ label: e.label.trim().slice(0, 200), amount: Math.round(e.amount * 100) / 100 }));
}

// Une ligne reçue -> la commande à insérer, ou null (+ raison) si elle n'est pas importable.
function cleanRow(row, source, userId) {
  if (!row || typeof row !== 'object') return { reason: 'invalid' };
  if (typeof row.source_ref !== 'string' || !row.source_ref.trim() || row.source_ref.length > 200) return { reason: 'invalid' };
  // Une date illisible n'est PAS remplacée par « aujourd'hui » : la vente serait rangée dans la mauvaise période.
  if (!isDay(row.date)) return { reason: 'invalid_date' };
  const total = amount(row.total);
  if (total === null) return { reason: 'invalid' };

  const items = cleanItems(row.items);
  const rate = Number(row.commission_rate);
  const hasRate = source.commission.mode === 'rate' && Number.isFinite(rate) && rate > 0 && rate <= 100;
  const order = {
    user_id: userId,
    channel: source.id,
    source_ref: row.source_ref.trim(),
    customer_name: text(row.customer_name, 200),
    items: items.length > 0 ? items : [{ name: `Commande ${source.id}`, quantity: 1, price: total }],
    extras: cleanExtras(row.extras),
    total,
    status: STATUSES.includes(row.status) ? row.status : source.defaultStatus,
    order_date: row.date,
    // Seuls des champs connus et bornés sont conservés : le lot vient du navigateur.
    raw_payload: { imported_from_csv: true, source: source.id },
  };
  if (hasRate) order.commission_rate = Math.round(rate * 100) / 100;
  return { order };
}

// Corps : { source, rows }. Réponse : { imported, duplicates, invalid, invalid_date, total_rows }.
async function importSourceOrders({ res, user, supabase, body }) {
  const source = importableSource(body.source);
  if (!source) {
    res.status(400).json({ error: 'source must be an importable source' });
    return;
  }
  const rows = Array.isArray(body.rows) ? body.rows : null;
  if (!rows || rows.length === 0) {
    res.status(400).json({ error: 'rows must be a non-empty array' });
    return;
  }
  if (rows.length > MAX_ROWS) {
    res.status(400).json({ error: `rows must contain at most ${MAX_ROWS} lines` });
    return;
  }

  const bySourceRef = new Map();
  let invalid = 0;
  let invalidDate = 0;
  let inBatchDuplicates = 0;
  rows.forEach((row) => {
    const { order, reason } = cleanRow(row, source, user.id);
    if (!order) {
      if (reason === 'invalid_date') invalidDate += 1;
      else invalid += 1;
      return;
    }
    // Deux lignes d'un même lot avec le même n° feraient échouer tout l'upsert : on garde la première.
    if (bySourceRef.has(order.source_ref)) { inBatchDuplicates += 1; return; }
    bySourceRef.set(order.source_ref, order);
  });

  const orders = [...bySourceRef.values()];
  if (orders.length === 0) {
    res.status(400).json({ error: 'Aucune ligne importable (n° de commande, date ou montant manquants)' });
    return;
  }

  // ignoreDuplicates : une commande déjà importée est laissée telle quelle (data ne contient que les nouvelles).
  const { data, error } = await supabase
    .from('orders')
    .upsert(orders, { onConflict: 'user_id,channel,source_ref', ignoreDuplicates: true })
    .select('id, source_ref');
  if (error) {
    if (isMissingSourcesMigration(error)) return migrationRequired(res);
    return serverError(res, error, 'POST /orders/import (source)');
  }

  const inserted = new Set(data.map((o) => o.source_ref));
  const fresh = orders.filter((o) => inserted.has(o.source_ref));
  await syncProductsFromItems(supabase, user.id, fresh.flatMap((o) => o.items), { category: source.label || source.id, usePrices: true });
  await syncCustomers(supabase, user.id, fresh.map((o) => ({ name: o.customer_name, email: null })));

  res.status(200).json({
    imported: data.length,
    duplicates: orders.length - data.length + inBatchDuplicates,
    invalid,
    invalid_date: invalidDate,
    total_rows: rows.length,
  });
}

module.exports = { importSourceOrders, importableSource, cleanRow };
