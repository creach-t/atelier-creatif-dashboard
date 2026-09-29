const { getSupabaseClient } = require('../lib/supabaseClient');
const { requireUser } = require('../lib/auth');
const { serverError, notFound, isUniqueViolation } = require('../lib/errors');
const { isUuid, optionalString } = require('../lib/validate');

const PATCHABLE_FIELDS = ['name', 'email', 'notes'];

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
    if (!optionalString(updates.email, 254) || !optionalString(updates.notes, 5000)) {
      res.status(400).json({ error: 'email or notes too long' });
      return;
    }
    if (updates.name) updates.name = updates.name.trim();

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      if (isUniqueViolation(error)) {
        res.status(409).json({ error: 'Un client porte déjà ce nom.' });
        return;
      }
      return serverError(res, error, 'PATCH /customers/:id');
    }
    if (!data) return notFound(res);
    res.status(200).json(data);
    return;
  }

  if (req.method === 'DELETE') {
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id');
    if (error) return serverError(res, error, 'DELETE /customers/:id');
    if (!data || data.length === 0) return notFound(res);
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
