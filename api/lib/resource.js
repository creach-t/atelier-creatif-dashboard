// Briques communes aux handlers REST : authentification, aiguillage par méthode HTTP, et les trois opérations
// Supabase répétées partout (lister, modifier, supprimer) toujours bornées à l'utilisateur connecté.
// Chaque handler garde ce qui lui est propre : sa validation et ses effets de bord.
const { getSupabaseClient } = require('./supabaseClient');
const { requireUser } = require('./auth');
const { serverError, notFound, isUniqueViolation, isMissingSourcesMigration, migrationRequired } = require('./errors');
const { isUuid } = require('./validate');

const badRequest = (res, message) => res.status(400).json({ error: message });

// route({ GET, POST, … }, { withId }) -> handler (req, res).
// Chaque fonction reçoit { req, res, user, supabase, body, id } ; une méthode non déclarée répond 405.
// withId : la route vise une ligne (/:id) — un id qui n'est pas un UUID répond 404 avant tout accès base.
function route(methods, { withId = false } = {}) {
  return async (req, res) => {
    const user = req.user || (await requireUser(req, res)); // req.user : déjà authentifié en amont (import CSV)
    if (!user) return;

    let id;
    if (withId) {
      id = req.query.id;
      if (!isUuid(id)) return notFound(res);
    }

    const handler = methods[req.method];
    if (!handler) {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    return handler({ req, res, user, supabase: getSupabaseClient(), body: req.body || {}, id });
  };
}

// Copie les seuls champs autorisés présents dans `body`.
const pickFields = (body, fields) => {
  const picked = {};
  for (const field of fields) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
};

// Toutes les lignes de l'utilisateur. `orderBy` : colonnes de tri, ex. [['order_date', false]] (false = décroissant).
async function listOwned({ res, supabase, user }, table, { orderBy = [], context, filters = {} }) {
  let query = supabase.from(table).select('*').eq('user_id', user.id);
  Object.entries(filters).forEach(([column, value]) => { query = query.eq(column, value); });
  orderBy.forEach(([column, ascending]) => { query = query.order(column, { ascending }); });

  const { data, error } = await query;
  if (error) return serverError(res, error, context);
  res.status(200).json(data);
}

// Modifie une ligne de l'utilisateur. Renvoie la ligne modifiée, ou null après avoir déjà répondu
// (404 si elle n'existe pas ou appartient à quelqu'un d'autre, 409 si `conflictMessage` et doublon, sinon 500).
async function updateOwned({ res, supabase, user, id }, table, updates, { context, conflictMessage } = {}) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) {
    if (table === 'orders' && isMissingSourcesMigration(error)) migrationRequired(res);
    else if (conflictMessage && isUniqueViolation(error)) res.status(409).json({ error: conflictMessage });
    else serverError(res, error, context);
    return null;
  }
  if (!data) {
    notFound(res);
    return null;
  }
  return data;
}

async function deleteOwned({ res, supabase, user, id }, table, { context }) {
  const { data, error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id).select('id');
  if (error) return serverError(res, error, context);
  if (!data || data.length === 0) return notFound(res);
  res.status(204).end();
}

// Insère une ligne (l'appelant répond 201). `conflictMessage` : réponse 409 en cas de doublon.
// Renvoie la ligne créée, ou null après avoir répondu en erreur.
async function insertOwned({ res, supabase }, table, row, { context, conflictMessage } = {}) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) {
    if (table === 'orders' && isMissingSourcesMigration(error)) migrationRequired(res);
    else if (conflictMessage && isUniqueViolation(error)) res.status(409).json({ error: conflictMessage });
    else serverError(res, error, context);
    return null;
  }
  return data;
}

module.exports = { route, pickFields, badRequest, listOwned, updateOwned, deleteOwned, insertOwned };
