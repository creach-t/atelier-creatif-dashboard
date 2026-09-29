const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');
const { syncCustomerFromOrder } = require('../lib/customerSync');
const { serverError, notFound } = require('../lib/errors');
const { isUuid, validateOrderFields } = require('../lib/validate');

const PATCHABLE_FIELDS = [
  'status', 'tracking', 'shipping', 'notes', 'commission_rate',
  'channel', 'customer_name', 'customer_email', 'items', 'total', 'order_date', 'extras', 'shop_name',
];

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!isUuid(id)) return notFound(res);

  if (req.method === 'DELETE') {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('orders').delete().eq('id', id).eq('user_id', user.id).select('id');
    if (error) return serverError(res, error, 'DELETE /orders/:id');
    if (!data || data.length === 0) return notFound(res);
    res.status(204).end();
    return;
  }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};

  const invalid = validateOrderFields(body);
  if (invalid) return res.status(400).json({ error: invalid });
  if (body.customer_name !== undefined && !(typeof body.customer_name === 'string' && body.customer_name.trim())) {
    return res.status(400).json({ error: 'customer_name cannot be empty' });
  }

  const updates = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  if (updates.items) updates.items = updates.items.map((i) => ({ name: i.name.trim(), quantity: i.quantity, price: i.price }));
  if (updates.extras) updates.extras = updates.extras.map((e) => ({ label: e.label.trim(), amount: e.amount }));
  if (updates.customer_name) updates.customer_name = updates.customer_name.trim();

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    const missing = ['notes', 'extras', 'commission_rate'].find((c) => error.message.includes(c));
    if (!missing) return serverError(res, error, 'PATCH /orders/:id');
    res.status(500).json({ error: `La colonne « ${missing} » n'existe pas encore : exécute les migrations 0005 et 0008 dans Supabase.` });
    return;
  }
  if (!data) return notFound(res);

  // Le client a pu changer : on crée sa fiche si elle n'existe pas encore (comme à la création).
  if (updates.customer_name) {
    await syncCustomerFromOrder(supabase, user.id, { name: updates.customer_name, email: updates.customer_email || data.customer_email });
  }

  res.status(200).json(data);
};
