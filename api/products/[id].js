const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');
const { serverError, notFound } = require('../lib/errors');
const { isUuid, isFiniteNumber, optionalString, MAX_AMOUNT } = require('../lib/validate');

const PATCHABLE_FIELDS = ['name', 'category', 'price', 'price_estimated', 'is_free', 'kind', 'image', 'kofi_url'];
const KINDS = ['physical', 'digital', 'both'];
// Colonnes ajoutées par les migrations 0006/0007 : si elles n'existent pas encore, on retente sans elles.
const OPTIONAL_COLUMNS = ['price_estimated', 'is_free', 'kind'];

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!isUuid(id)) return notFound(res);
  const supabase = getSupabaseClient();

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.length > 200)) {
      res.status(400).json({ error: 'name must be a non-empty string (200 chars max)' });
      return;
    }
    if (updates.category !== undefined && (typeof updates.category !== 'string' || !updates.category.trim() || updates.category.length > 100)) {
      res.status(400).json({ error: 'category must be a non-empty string (100 chars max)' });
      return;
    }
    if (updates.price !== undefined && !(isFiniteNumber(updates.price) && updates.price >= 0 && updates.price <= MAX_AMOUNT)) {
      res.status(400).json({ error: 'price must be a number >= 0' });
      return;
    }
    if (!optionalString(updates.image, 500) || !optionalString(updates.kofi_url, 500)) {
      res.status(400).json({ error: 'image or kofi_url too long' });
      return;
    }
    if (updates.name) updates.name = updates.name.trim();
    if (updates.category) updates.category = updates.category.trim();

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
      .maybeSingle();

    let { data, error } = await run(updates);

    // Migrations 0006/0007 pas encore passées : les colonnes n'existent pas, on retente sans elles
    // plutôt que de bloquer toute modification de produit.
    if (error && OPTIONAL_COLUMNS.some((c) => error.message.includes(c))) {
      const withoutOptional = Object.fromEntries(Object.entries(updates).filter(([k]) => !OPTIONAL_COLUMNS.includes(k)));
      if (Object.keys(withoutOptional).length > 0) ({ data, error } = await run(withoutOptional));
    }

    if (error) return serverError(res, error, 'PATCH /products/:id');
    if (!data) return notFound(res);
    res.status(200).json(data);
    return;
  }

  if (req.method === 'DELETE') {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id');
    if (error) return serverError(res, error, 'DELETE /products/:id');
    if (!data || data.length === 0) return notFound(res);
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
