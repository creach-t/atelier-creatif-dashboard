const { route, pickFields, badRequest } = require('./lib/resource');
const { serverError, isUniqueViolation } = require('./lib/errors');
const { optionalString } = require('./lib/validate');

const MIN_TOKEN_LENGTH = 20; // un verification_token Ko-fi est un UUID (36 caractères)
const PATCHABLE_FIELDS = ['display_name', 'kofi_verification_token', 'onboarding_completed', 'workspace'];

// Espace de travail (pages, widgets, disposition) : un objet JSON libre côté produit, mais borné ici
// pour qu'un client ne puisse pas stocker n'importe quoi ni gonfler la ligne.
const MAX_WORKSPACE_BYTES = 200 * 1024;
const isValidWorkspace = (w) =>
  w !== null &&
  typeof w === 'object' &&
  !Array.isArray(w) &&
  Array.isArray(w.pages) &&
  w.pages.length <= 30 &&
  Buffer.byteLength(JSON.stringify(w), 'utf8') <= MAX_WORKSPACE_BYTES;

module.exports = route({
  GET: async ({ res, user, supabase }) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) return serverError(res, error, 'GET /profile');
    res.status(200).json(data);
  },

  PATCH: async ({ res, user, supabase, body }) => {
    const updates = pickFields(body, PATCHABLE_FIELDS);

    if (!optionalString(updates.display_name, 100)) return badRequest(res, 'display_name must be a string (100 chars max)');
    if (updates.kofi_verification_token !== undefined && updates.kofi_verification_token !== null) {
      const token = updates.kofi_verification_token;
      // Longueur minimale : ce token est le seul secret du webhook public, un token court se devine.
      if (typeof token !== 'string' || token.trim().length < MIN_TOKEN_LENGTH || token.length > 200) {
        return badRequest(res, `kofi_verification_token must be a string of ${MIN_TOKEN_LENGTH} to 200 chars, or null`);
      }
      updates.kofi_verification_token = token.trim();
    }
    if (updates.onboarding_completed !== undefined && typeof updates.onboarding_completed !== 'boolean') {
      return badRequest(res, 'onboarding_completed must be a boolean');
    }
    if (updates.workspace !== undefined && !isValidWorkspace(updates.workspace)) {
      return badRequest(res, 'workspace must be an object with a pages array (200 KB max)');
    }
    if (Object.keys(updates).length === 0) return badRequest(res, 'No valid fields to update');

    // upsert plutôt que update : increvable même si la ligne profiles n'a jamais été
    // créée (trigger auth.users manqué, compte créé avant migration, etc.)
    const { data, error } = await supabase.from('profiles').upsert({ id: user.id, ...updates }).select().single();

    if (error) {
      // Un token Ko-fi ne peut appartenir qu'à un compte : message volontairement vague, pour ne pas
      // confirmer à un tiers qu'un token donné existe déjà.
      if (isUniqueViolation(error)) return res.status(409).json({ error: 'Ce token ne peut pas être utilisé.' });
      // Colonne `workspace` absente (migration 0010 pas encore exécutée) : ce n'est pas une panne, juste une
      // fonction optionnelle indisponible. Réponse dédiée, sans log d'erreur : le client cesse d'insister.
      if (error.code === 'PGRST204' && /workspace/.test(error.message || '')) {
        return res.status(501).json({ error: 'workspace_unsupported' });
      }
      return serverError(res, error, 'PATCH /profile');
    }
    res.status(200).json(data);
  },
});
