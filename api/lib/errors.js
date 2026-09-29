// Les messages d'erreur Postgres/PostgREST (noms de colonnes, de contraintes, valeurs...) ne
// doivent pas partir vers le navigateur : on les logge côté serveur et on répond de façon générique.
function serverError(res, error, context) {
  console.error(`${context || 'API'} error:`, error);
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
}

const notFound = (res) => res.status(404).json({ error: 'Not found' });

// Violation de contrainte d'unicité Postgres.
const isUniqueViolation = (error) => Boolean(error) && error.code === '23505';

module.exports = { serverError, notFound, isUniqueViolation };
