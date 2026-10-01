const { route, pickFields, badRequest, updateOwned, deleteOwned } = require('../lib/resource');
const { isFiniteNumber, optionalString, MAX_AMOUNT } = require('../lib/validate');

const PATCHABLE_FIELDS = ['name', 'category', 'price', 'price_estimated', 'is_free', 'kind', 'image', 'kofi_url'];
const KINDS = ['physical', 'digital', 'both'];

module.exports = route({
  PATCH: async (ctx) => {
    const { res, body } = ctx;
    const updates = pickFields(body, PATCHABLE_FIELDS);

    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.length > 200)) {
      return badRequest(res, 'name must be a non-empty string (200 chars max)');
    }
    if (updates.category !== undefined && (typeof updates.category !== 'string' || !updates.category.trim() || updates.category.length > 100)) {
      return badRequest(res, 'category must be a non-empty string (100 chars max)');
    }
    if (updates.price !== undefined && !(isFiniteNumber(updates.price) && updates.price >= 0 && updates.price <= MAX_AMOUNT)) {
      return badRequest(res, 'price must be a number >= 0');
    }
    if (!optionalString(updates.image, 500) || !optionalString(updates.kofi_url, 500)) return badRequest(res, 'image or kofi_url too long');
    if (updates.kind !== undefined && updates.kind !== null && !KINDS.includes(updates.kind)) {
      return badRequest(res, `kind must be one of: ${KINDS.join(', ')}`);
    }
    if (updates.name) updates.name = updates.name.trim();
    if (updates.category) updates.category = updates.category.trim();

    // Un prix saisi à la main n'est plus un prix estimé.
    if (updates.price !== undefined && body.price_estimated === undefined) updates.price_estimated = false;

    if (Object.keys(updates).length === 0) return badRequest(res, 'No valid fields to update');

    const product = await updateOwned(ctx, 'products', updates, { context: 'PATCH /products/:id' });
    if (product) res.status(200).json(product);
  },

  DELETE: (ctx) => deleteOwned(ctx, 'products', { context: 'DELETE /products/:id' }),
}, { withId: true });
