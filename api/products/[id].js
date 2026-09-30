const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');
const { serverError, notFound } = require('../lib/errors');
const { isUuid, isFiniteNumber, optionalString, MAX_AMOUNT } = require('../lib/validate');

const PATCHABLE_FIELDS = ['name', 'category', 'price', 'price_estimated', 'is_free', 'kind', 'image', 'kofi_url'];
const KINDS = ['physical', 'digital', 'both'];

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

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

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
