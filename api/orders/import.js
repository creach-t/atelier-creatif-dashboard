const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');

// Rattrapage de l'historique Ko-fi (onboarding) : le front parse le CSV exporté depuis
// Ko-fi (More > Transactions > Download CSV) et envoie un tableau de lignes déjà
// normalisées (voir src/utils/normalizeKofiCsv.js). On réutilise kofi_transaction_id comme
// clé de dédup, comme pour le webhook — mais ici en UPDATE (pas ignore) sur conflit, pour
// pouvoir corriger un import précédent en ré-important le même CSV après un bugfix.
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

  const orders = rows
    .filter((row) => row && row.transaction_id && !row.isOutgoing)
    .map((row) => ({
      user_id: user.id,
      channel: 'kofi',
      customer_name: row.customer_name || null,
      customer_email: row.customer_email || null,
      items: Array.isArray(row.items) && row.items.length > 0
        ? row.items
        : [{ name: row.type || 'Support Ko-fi', quantity: 1 }],
      total: Number(row.amount) || 0,
      status: 'delivered',
      order_date: row.timestamp || new Date().toISOString().slice(0, 10),
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
    .upsert(orders, { onConflict: 'kofi_transaction_id' })
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ imported: data.length, skipped, total_rows: rows.length });
};
