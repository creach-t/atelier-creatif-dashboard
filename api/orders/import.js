const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');
const { syncProductsFromItems } = require('../lib/productSync');
const { syncCustomerFromOrder } = require('../lib/customerSync');
const { todayInParis } = require('../lib/dates');
const { serverError } = require('../lib/errors');
const { isDay } = require('../lib/validate');

const MAX_ROWS = 5000;

// Rattrapage de l'historique Ko-fi (onboarding) : le front parse le CSV exporté depuis
// Ko-fi (More > Transactions > Download CSV) et envoie un tableau de lignes déjà
// normalisées (voir src/utils/normalizeKofiCsv.js). On réutilise kofi_transaction_id comme
// clé de dédup, comme pour le webhook — mais ici en UPDATE (pas ignore) sur conflit, pour
// pouvoir corriger un import précédent en ré-important le même CSV après un bugfix.
// Le CSV est parsé par le navigateur : on ne fait pas confiance à la forme des articles reçus.
function cleanImportedItems(items, type) {
  const clean = (Array.isArray(items) ? items : [])
    .filter((i) => i && typeof i.name === 'string' && i.name.trim())
    .slice(0, 200)
    .map((i) => ({ name: i.name.trim().slice(0, 200), quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1 }));
  return clean.length > 0 ? clean : [{ name: String(type || 'Support Ko-fi').slice(0, 200), quantity: 1 }];
}

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rows = Array.isArray(req.body && req.body.rows) ? req.body.rows : null;
  if (!rows || rows.length === 0) {
    res.status(400).json({ error: 'rows must be a non-empty array' });
    return;
  }

  if (rows.length > MAX_ROWS) {
    res.status(400).json({ error: `rows must contain at most ${MAX_ROWS} lines` });
    return;
  }

  const importable = rows.filter((row) => row && typeof row.transaction_id === 'string' && row.transaction_id && !row.isOutgoing);

  const orders = importable.map((row) => ({
    user_id: user.id,
    channel: 'kofi',
    customer_name: row.customer_name || null,
    customer_email: row.customer_email || null,
    items: cleanImportedItems(row.items, row.type),
    total: Number(row.amount) > 0 && Number(row.amount) < 1e8 ? Number(row.amount) : 0,
    status: 'delivered',
    order_date: isDay(row.timestamp) ? row.timestamp : todayInParis(),
    kofi_transaction_id: row.transaction_id,
    raw_payload: { imported_from_csv: true, ...row },
  }));

  const skipped = rows.length - orders.length;

  if (orders.length === 0) {
    res.status(400).json({ error: 'Aucune ligne importable (transaction_id manquant ou toutes "given")' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .upsert(orders, { onConflict: 'user_id,kofi_transaction_id' })
    .select();

  if (error) return serverError(res, error, 'POST /orders/import');

  // Enrichit le catalogue produits — uniquement pour de vraies commandes boutique. Le CSV
  // Ko-fi ne donne pas de prix unitaire fiable (PricePerUnit vide dès qu'une commande a
  // plusieurs articles), donc on laisse le prix à 0 — la créatrice le complète elle-même.
  const shopOrders = importable.filter((row) => row.type === 'Shop Order');
  for (const row of shopOrders) {
    await syncProductsFromItems(supabase, user.id, row.items);
  }

  // Une seule tentative de sync par client distinct (un import a souvent des dizaines
  // de lignes pour le même client, inutile de refaire le lookup à chaque fois).
  const seenCustomers = new Set();
  for (const row of importable) {
    const name = row.customer_name && row.customer_name.trim();
    if (!name || seenCustomers.has(name)) continue;
    seenCustomers.add(name);
    await syncCustomerFromOrder(supabase, user.id, { name, email: row.customer_email });
  }

  res.status(200).json({ imported: data.length, skipped, total_rows: rows.length });
};
