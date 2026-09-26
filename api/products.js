const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireDashboardAuth } = require('./lib/auth');

module.exports = async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    if (!body.name || !body.category) {
      res.status(400).json({ error: 'name and category are required' });
      return;
    }
    if (typeof body.price !== 'number' || Number.isNaN(body.price)) {
      res.status(400).json({ error: 'price must be a number' });
      return;
    }

    const product = {
      name: body.name,
      category: body.category,
      price: body.price,
      stock: Number.isInteger(body.stock) ? body.stock : 0,
      min_stock: Number.isInteger(body.min_stock) ? body.min_stock : 1,
      image: body.image || '🎨',
    };

    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
