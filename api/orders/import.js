const { route } = require('../lib/resource');
const { syncProductsFromItems } = require('../lib/productSync');
const { syncCustomers } = require('../lib/customerSync');
const { serverError } = require('../lib/errors');
const { isDay } = require('../lib/validate');

const MAX_ROWS = 5000;

// Chaîne bornée, ou null : le corps vient du navigateur, un nom qui n'est pas du texte ne doit pas faire échouer l'import.
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// Rattrapage de l'historique Ko-fi (page Réglages) : le front parse le CSV exporté depuis
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

module.exports = route({
  POST: async ({ res, user, supabase, body }) => {
    const rows = Array.isArray(body.rows) ? body.rows : null;
    if (!rows || rows.length === 0) {
      res.status(400).json({ error: 'rows must be a non-empty array' });
      return;
    }

    if (rows.length > MAX_ROWS) {
      res.status(400).json({ error: `rows must contain at most ${MAX_ROWS} lines` });
      return;
    }

    // Une transaction par identifiant : deux lignes identiques dans un même lot feraient échouer tout l'upsert
    // (« ON CONFLICT DO UPDATE command cannot affect row a second time »). On garde la première.
    const byTransaction = new Map();
    let invalidDate = 0;
    rows.forEach((row) => {
      if (!row || typeof row.transaction_id !== 'string' || !row.transaction_id || row.transaction_id.length > 200 || row.isOutgoing) return;
      if (byTransaction.has(row.transaction_id)) return;
      // Une date illisible n'est PAS remplacée par « aujourd'hui » : la vente serait rangée dans la mauvaise période.
      if (!isDay(row.timestamp)) { invalidDate += 1; return; }
      byTransaction.set(row.transaction_id, row);
    });
    const importable = [...byTransaction.values()];

    const orders = importable.map((row) => ({
      user_id: user.id,
      channel: 'kofi',
      customer_name: text(row.customer_name, 200),
      customer_email: text(row.customer_email, 254),
      items: cleanImportedItems(row.items, row.type),
      total: Number(row.amount) > 0 && Number(row.amount) < 1e8 ? Number(row.amount) : 0,
      status: 'delivered',
      order_date: row.timestamp,
      kofi_transaction_id: row.transaction_id,
      // Seuls les champs connus sont conservés : le CSV est envoyé par le navigateur, on ne stocke pas n'importe quoi.
      raw_payload: {
        imported_from_csv: true,
        type: text(row.type, 100),
        shopOrderType: text(row.shopOrderType, 50),
        amount: Number(row.amount) || 0,
      },
    }));

    const skipped = rows.length - orders.length;

    if (orders.length === 0) {
      res.status(400).json({ error: 'Aucune ligne importable (transaction_id ou date manquants, ou toutes "given")' });
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .upsert(orders, { onConflict: 'user_id,kofi_transaction_id' })
      .select();

    if (error) return serverError(res, error, 'POST /orders/import');

    // Enrichit le catalogue produits — uniquement pour de vraies commandes boutique. Le CSV
    // Ko-fi ne donne pas de prix unitaire fiable (PricePerUnit vide dès qu'une commande a
    // plusieurs articles), donc on laisse le prix à 0 — la créatrice le complète elle-même.
    const shopItems = importable.filter((row) => row.type === 'Shop Order').flatMap((row) => cleanImportedItems(row.items, row.type));
    await syncProductsFromItems(supabase, user.id, shopItems);
    await syncCustomers(supabase, user.id, orders.map((o) => ({ name: o.customer_name, email: o.customer_email })));

    res.status(200).json({ imported: data.length, skipped, invalid_date: invalidDate, total_rows: rows.length });
  },
});
