const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireDashboardAuth } = require('../lib/auth');

const PATCHABLE_FIELDS = ['name', 'category', 'price', 'stock', 'min_stock', 'image'];

module.exports = async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;

  const { id } = req.query;
  const supabase = getSupabaseClient();

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
