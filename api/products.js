const { route, badRequest, listOwned, insertOwned } = require('./lib/resource');
const { isFiniteNumber, optionalString, MAX_AMOUNT } = require('./lib/validate');
const { isValidProductImage, isHttpsUrl } = require('./lib/productImage');

const KINDS = ['physical', 'digital', 'both'];

module.exports = route({
  GET: (ctx) => listOwned(ctx, 'products', { orderBy: [['name', true]], context: 'GET /products' }),

  POST: async (ctx) => {
    const { res, user, body } = ctx;

    if (typeof body.name !== 'string' || !body.name.trim() || typeof body.category !== 'string' || !body.category.trim()) {
      return badRequest(res, 'name and category are required');
    }
    if (body.name.length > 200 || body.category.length > 100 || !optionalString(body.image, 500) || !optionalString(body.kofi_url, 500)) {
      return badRequest(res, 'name, category, image or kofi_url too long');
    }
    if (body.image !== undefined && body.image !== null && body.image !== '' && !isValidProductImage(body.image)) {
      return badRequest(res, 'image must be an emoji or an https URL');
    }
    if (body.kofi_url !== undefined && body.kofi_url !== null && body.kofi_url !== '' && !isHttpsUrl(body.kofi_url)) {
      return badRequest(res, 'kofi_url must be an https URL');
    }
    if (!isFiniteNumber(body.price) || body.price < 0 || body.price > MAX_AMOUNT) return badRequest(res, 'price must be a number >= 0');
    if (body.kind !== undefined && body.kind !== null && !KINDS.includes(body.kind)) {
      return badRequest(res, `kind must be one of: ${KINDS.join(', ')}`);
    }

    // Pas de gestion de stock dans Cashly — les colonnes stock/min_stock gardent leurs
    // valeurs par défaut en base, la seule métrique produit affichée est la quantité vendue.
    const product = {
      user_id: user.id,
      name: body.name.trim(),
      category: body.category.trim(),
      price: body.price,
      image: body.image || '🎁',
      kofi_url: body.kofi_url || null,
    };
    if (body.is_free !== undefined) product.is_free = Boolean(body.is_free);
    if (body.kind !== undefined) product.kind = body.kind;

    const created = await insertOwned(ctx, 'products', product, { context: 'POST /products', conflictMessage: 'Un produit porte déjà ce nom.' });
    if (created) res.status(201).json(created);
  },
});
