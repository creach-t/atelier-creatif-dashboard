const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireUser } = require('./lib/auth');
const { serverError, isUniqueViolation } = require('./lib/errors');
const { optionalString } = require('./lib/validate');

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (error) return serverError(res, error, 'GET /customers');
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    if (typeof body.name !== 'string' || !body.name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (body.name.length > 200 || !optionalString(body.email, 254) || !optionalString(body.notes, 5000)) {
      res.status(400).json({ error: 'name, email or notes too long' });
      return;
    }

    const customer = {
      user_id: user.id,
      name: body.name.trim(),
      email: body.email || null,
      notes: body.notes || null,
    };

    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) {
      if (isUniqueViolation(error)) {
        res.status(409).json({ error: 'Un client porte déjà ce nom.' });
        return;
      }
      return serverError(res, error, 'POST /customers');
    }
    res.status(201).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
