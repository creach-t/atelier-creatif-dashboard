const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');

const ALLOWED_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];
const PATCHABLE_FIELDS = ['status', 'tracking', 'shipping', 'notes'];

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;
  const body = req.body || {};

  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
    res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    return;
  }

  const updates = {};
  for (const field of PATCHABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

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
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json(data);
};
