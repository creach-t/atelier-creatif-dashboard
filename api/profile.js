const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireUser } = require('./lib/auth');

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

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

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
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
