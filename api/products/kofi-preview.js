const { route, badRequest } = require('../lib/resource');
const { parseKofiProductUrl, fetchKofiProduct, KofiFetchError } = require('../lib/kofiProduct');

// POST /api/products/kofi-preview { url } -> { name, price, currency, imageUrl, kofi_url }
// Ne modifie RIEN : le front affiche l'aperçu, demande confirmation, puis passe par POST/PATCH /products.
// L'URL fournie n'est jamais passée à fetch : seul l'alias en est extrait (voir api/lib/kofiProduct.js).
const STATUS = { not_found: 404, blocked: 502, unavailable: 502, unparseable: 422 };

module.exports = route({
  POST: async ({ res, body }) => {
    const alias = parseKofiProductUrl(body.url);
    if (!alias) return badRequest(res, 'invalid_kofi_url');

    try {
      const product = await fetchKofiProduct(alias);
      res.status(200).json(product);
    } catch (err) {
      if (!(err instanceof KofiFetchError)) throw err; // inattendu : safe() répond 500 générique
      // Message = code stable que le front traduit ; aucune URL ni détail réseau n'est renvoyé.
      res.status(STATUS[err.code] || 502).json({ error: `kofi_${err.code}` });
    }
  },
});
