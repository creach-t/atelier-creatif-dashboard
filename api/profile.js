const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireUser } = require('./lib/auth');
const { serverError, isUniqueViolation } = require('./lib/errors');
const { optionalString } = require('./lib/validate');

const PATCHABLE_FIELDS = ['display_name', 'kofi_verification_token', 'onboarding_completed'];

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return serverError(res, error, 'GET /profile');
    res.status(200).json(data);
    return;
  }

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (!optionalString(updates.display_name, 100)) {
      res.status(400).json({ error: 'display_name must be a string (100 chars max)' });
      return;
    }
    if (updates.kofi_verification_token !== undefined && updates.kofi_verification_token !== null) {
      const token = updates.kofi_verification_token;
      if (typeof token !== 'string' || !token.trim() || token.length > 200) {
        res.status(400).json({ error: 'kofi_verification_token must be a non-empty string (200 chars max) or null' });
        return;
      }
      updates.kofi_verification_token = token.trim();
    }
    if (updates.onboarding_completed !== undefined && typeof updates.onboarding_completed !== 'boolean') {
      res.status(400).json({ error: 'onboarding_completed must be a boolean' });
      return;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // upsert plutôt que update : increvable même si la ligne profiles n'a jamais été
    // créée (trigger auth.users manqué, compte créé avant migration, etc.)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single();

    if (error) {
      // Un token Ko-fi ne peut appartenir qu'à un compte : message volontairement vague, pour ne pas
      // confirmer à un tiers qu'un token donné existe déjà.
      if (isUniqueViolation(error)) {
        res.status(409).json({ error: 'Ce token ne peut pas être utilisé.' });
        return;
      }
      return serverError(res, error, 'PATCH /profile');
    }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
