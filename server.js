// Serveur Express : sert l'API (les handlers api/*.js, de simples fonctions (req, res)) et le build React
// statique, dans un conteneur Docker derrière Traefik.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const { requireUser } = require('./api/lib/auth');

// En prod (Docker), les variables d'env sont déjà injectées par docker-compose (env_file) —
// ce fichier n'existe pas dans le container, donc ce chargement est un no-op silencieux.
// En dev local, ça permet à npm run dev/npm run server de lire .env.local comme react-scripts le fait déjà côté front.
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudflare -> Traefik -> app : on fait confiance aux deux proxys pour que req.ip soit l'IP
// réelle du client (sinon le rate limiting partagerait un seul compteur pour tout le monde).
app.set('trust proxy', 2);
app.disable('x-powered-by');

// Le front n'appelle que son propre serveur et Supabase Auth (navigateur -> SUPABASE_URL).
// Google Fonts pour Inter ; les images produit sont des URLs https (photos de la boutique Ko-fi).
// Le build CRA est produit avec INLINE_RUNTIME_CHUNK=false : aucun script inline à autoriser.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // Recharts/Tailwind posent des styles inline
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...(process.env.SUPABASE_URL ? [process.env.SUPABASE_URL] : [])],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);
app.use(compression());

// Le webhook Ko-fi est public : on borne le nombre d'essais (devinette de token, flood).
app.use(
  '/api/kofi-webhook',
  rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests' } })
);
// API authentifiée : large (3 polls / 30 s par onglet), pensé pour stopper les abus, pas l'usage normal.
app.use(
  '/api',
  rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests' } })
);

// Seul l'import CSV Ko-fi (des centaines de lignes, chacune avec sa ligne brute conservée dans
// raw_payload) a besoin d'un gros corps. Monté avant le parseur global : body-parser ignore une
// requête déjà parsée. Partout ailleurs (webhook public compris) on reste à 100kb.
// L'utilisateur est authentifié AVANT de lire ce gros corps : un anonyme ne peut pas faire parser 10 Mo.
app.use('/api/orders/import', async (req, res, next) => {
  try {
    req.user = await requireUser(req, res);
    if (req.user) next();
  } catch (err) {
    next(err);
  }
});
app.use('/api/orders/import', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Les handlers api/*/[id].js lisent l'id via req.query.id
// — on le reproduit ici à partir du param de route Express.
const withIdParam = (handler) => (req, res) => {
  req.query.id = req.params.id;
  return handler(req, res);
};

// Express 4 ne catch pas automatiquement les rejets/throws d'un handler async :
// une erreur (ex: Supabase mal configuré) planterait tout le process pour tout le monde.
const safe = (handler) => (req, res) => {
  Promise.resolve()
    .then(() => handler(req, res))
    .catch((err) => {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    });
};

app.all('/api/kofi-webhook', safe(require('./api/kofi-webhook')));
app.all('/api/orders/import', safe(require('./api/orders/import'))); // avant /:id, sinon "import" matcherait comme id
app.all('/api/orders', safe(require('./api/orders')));
app.all('/api/orders/:id', safe(withIdParam(require('./api/orders/[id]'))));
app.all('/api/products', safe(require('./api/products')));
app.all('/api/products/:id', safe(withIdParam(require('./api/products/[id]'))));
app.all('/api/customers', safe(require('./api/customers')));
app.all('/api/customers/:id', safe(withIdParam(require('./api/customers/[id]'))));
app.all('/api/profile', safe(require('./api/profile')));

app.get('/health', (req, res) => res.status(200).send('ok'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const buildPath = path.join(__dirname, 'build');
// Les fichiers de /static sont hashés par CRA : cache d'un an. index.html, lui, doit toujours être revalidé.
app.use(
  express.static(buildPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}static${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Corps trop gros (413) ou JSON malformé (400) : réponse JSON propre, jamais de stack trace.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.type === 'entity.too.large' ? 'Payload too large' : 'Bad request' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Cashly server listening on port ${PORT}`);
});

// Filet de sécurité : un rejet non géré ne doit pas tuer le process en silence.
process.on('unhandledRejection', (reason) => console.error('unhandledRejection:', reason));

// docker stop envoie SIGTERM : on termine les requêtes en cours avant de sortir.
const shutdown = (signal) => {
  console.log(`${signal} reçu, arrêt du serveur...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
