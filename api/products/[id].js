const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');

const PATCHABLE_FIELDS = ['name', 'category', 'price', 'price_estimated', 'is_free', 'kind', 'image', 'kofi_url'];
const KINDS = ['physical', 'digital', 'both'];
// Colonnes ajoutées par les migrations 0006/0007 : si elles n'existent pas encore, on retente sans elles.
const OPTIONAL_COLUMNS = ['price_estimated', 'is_free', 'kind'];

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { id } = req.query;
  const supabase = getSupabaseClient();

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (updates.kind !== undefined && updates.kind !== null && !KINDS.includes(updates.kind)) {
      res.status(400).json({ error: `kind must be one of: ${KINDS.join(', ')}` });
      return;
    }

    // Un prix saisi à la main n'est plus un prix estimé.
    if (updates.price !== undefined && body.price_estimated === undefined) updates.price_estimated = false;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const run = (fields) => supabase
      .from('products')
      .update(fields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    let { data, error } = await run(updates);

    // Migrations 0006/0007 pas encore passées : les colonnes n'existent pas, on retente sans elles
    // plutôt que de bloquer toute modification de produit.
    if (error && OPTIONAL_COLUMNS.some((c) => error.message.includes(c))) {
      const withoutOptional = Object.fromEntries(Object.entries(updates).filter(([k]) => !OPTIONAL_COLUMNS.includes(k)));
      if (Object.keys(withoutOptional).length > 0) ({ data, error } = await run(withoutOptional));
    }

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
