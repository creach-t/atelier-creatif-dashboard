// Serveur Express : sert l'API (adaptée des handlers api/*.js, initialement écrits
// au format serverless Vercel — signature (req, res) compatible telle quelle avec
// Express) et le build React statique. Remplace Vercel pour un déploiement Docker/VPS.
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Les handlers api/orders/[id].js et api/products/[id].js lisent l'id via req.query.id
// (convention Vercel) — on le reproduit ici à partir du param de route Express.
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
app.all('/api/orders', safe(require('./api/orders')));
app.all('/api/orders/:id', safe(withIdParam(require('./api/orders/[id]'))));
app.all('/api/products', safe(require('./api/products')));
app.all('/api/products/:id', safe(withIdParam(require('./api/products/[id]'))));

app.get('/health', (req, res) => res.status(200).send('ok'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));
app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));

app.listen(PORT, () => {
  console.log(`Cashly server listening on port ${PORT}`);
});
