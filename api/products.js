const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireUser } = require('./lib/auth');

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
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

    // Pas de gestion de stock dans Cashly — les colonnes stock/min_stock gardent leurs
    // valeurs par défaut en base, la seule métrique produit affichée est la quantité vendue.
    const product = {
      user_id: user.id,
      name: body.name,
      category: body.category,
      price: body.price,
      image: body.image || '🎨',
      kofi_url: body.kofi_url || null,
    };

    const KINDS = ['physical', 'digital', 'both'];
    if (body.kind !== undefined && body.kind !== null && !KINDS.includes(body.kind)) {
      res.status(400).json({ error: `kind must be one of: ${KINDS.join(', ')}` });
      return;
    }
    const optional = {};
    if (body.is_free !== undefined) optional.is_free = Boolean(body.is_free);
    if (body.kind !== undefined) optional.kind = body.kind;

    // Colonnes des migrations 0006/0007 : si elles n'existent pas encore, on crée sans elles.
    let { data, error } = await supabase.from('products').insert({ ...product, ...optional }).select().single();
    if (error && Object.keys(optional).some((c) => error.message.includes(c))) {
      ({ data, error } = await supabase.from('products').insert(product).select().single());
    }
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
