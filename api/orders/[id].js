const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');
const { syncCustomerFromOrder } = require('../lib/customerSync');

const ALLOWED_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_CHANNELS = ['kofi', 'reel'];
const PATCHABLE_FIELDS = [
  'status', 'tracking', 'shipping', 'notes', 'commission_rate',
  'channel', 'customer_name', 'customer_email', 'items', 'total', 'order_date', 'extras', 'shop_name',
];

const validItems = (items) =>
  Array.isArray(items) &&
  items.every((i) => i && typeof i.name === 'string' && i.name.trim() && typeof i.quantity === 'number' && i.quantity > 0 && typeof i.price === 'number' && i.price >= 0);
const validExtras = (extras) =>
  Array.isArray(extras) &&
  extras.every((e) => e && typeof e.label === 'string' && e.label.trim() && typeof e.amount === 'number' && Number.isFinite(e.amount));

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'DELETE') {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('orders').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(204).end();
    return;
  }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};

  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
    res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    return;
  }

  if (body.commission_rate !== undefined && body.commission_rate !== null && !(typeof body.commission_rate === 'number' && body.commission_rate >= 0 && body.commission_rate <= 100)) {
    res.status(400).json({ error: 'commission_rate must be a number between 0 and 100' });
    return;
  }

  const fail = (message) => res.status(400).json({ error: message });
  if (body.channel !== undefined && !ALLOWED_CHANNELS.includes(body.channel)) return fail(`channel must be one of: ${ALLOWED_CHANNELS.join(', ')}`);
  if (body.items !== undefined && !validItems(body.items)) return fail('items must be a list of { name, quantity > 0, price >= 0 }');
  if (body.extras !== undefined && !validExtras(body.extras)) return fail('extras must be a list of { label, amount }');
  if (body.total !== undefined && !(typeof body.total === 'number' && Number.isFinite(body.total) && body.total >= 0)) return fail('total must be a positive number');
  if (body.order_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.order_date))) return fail('order_date must be YYYY-MM-DD');
  if (body.customer_name !== undefined && !(typeof body.customer_name === 'string' && body.customer_name.trim())) return fail('customer_name cannot be empty');

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
    .single();

  if (error) {
    const missing = ['notes', 'extras', 'commission_rate'].find((c) => error.message.includes(c));
    res.status(500).json({
      error: missing
        ? `La colonne « ${missing} » n'existe pas encore : exécute les migrations 0005 et 0008 dans Supabase.`
        : error.message,
    });
    return;
  }

  // Le client a pu changer : on crée sa fiche si elle n'existe pas encore (comme à la création).
  if (updates.customer_name) {
    await syncCustomerFromOrder(supabase, user.id, { name: updates.customer_name, email: updates.customer_email || data.customer_email });
  }

  res.status(200).json(data);
};
