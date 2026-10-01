// Les messages d'erreur Postgres/PostgREST (noms de colonnes, de contraintes, valeurs...) ne
// doivent pas partir vers le navigateur : on les logge côté serveur et on répond de façon générique.
function serverError(res, error, context) {
  console.error(`${context || 'API'} error:`, error);
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
}

const notFound = (res) => res.status(404).json({ error: 'Not found' });

// Violation de contrainte d'unicité Postgres.
const isUniqueViolation = (error) => Boolean(error) && error.code === '23505';

// La migration 0012 (canaux élargis, source_ref) n'est pas passée : l'ancienne contrainte refuse les nouvelles
// sources, ou la colonne source_ref n'existe pas. Ce n'est pas une panne : on le dit au lieu d'un 500 générique.
const isMissingSourcesMigration = (error) =>
  Boolean(error) &&
  ((error.code === '23514' && /orders_channel_check/.test(error.message || '')) ||
    ((error.code === 'PGRST204' || error.code === '42703') && /source_ref/.test(error.message || '')) ||
    (error.code === '42P10' && /source_ref|conflict/i.test(error.message || '')));

const migrationRequired = (res) => res.status(501).json({ error: 'migration_0012_required' });

module.exports = { serverError, notFound, isUniqueViolation, isMissingSourcesMigration, migrationRequired };
