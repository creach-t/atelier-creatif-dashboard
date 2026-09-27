const { getSupabaseClient } = require('./supabaseClient');

// Vérifie le JWT de session Supabase Auth envoyé par le front (Authorization: Bearer <access_token>).
// Retourne l'utilisateur Supabase si valide, sinon répond 401 elle-même et retourne null.
async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data || !data.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return data.user;
}

module.exports = { requireUser };
