const { route, pickFields, badRequest, updateOwned, deleteOwned } = require('../lib/resource');
const { optionalString } = require('../lib/validate');

const PATCHABLE_FIELDS = ['name', 'email', 'notes'];

module.exports = route({
  PATCH: async (ctx) => {
    const { res, body } = ctx;
    const updates = pickFields(body, PATCHABLE_FIELDS);

    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.length > 200)) {
      return badRequest(res, 'name must be a non-empty string (200 chars max)');
    }
    if (!optionalString(updates.email, 254) || !optionalString(updates.notes, 5000)) return badRequest(res, 'email or notes too long');
    if (updates.name) updates.name = updates.name.trim();
    if (Object.keys(updates).length === 0) return badRequest(res, 'No valid fields to update');

    const customer = await updateOwned(ctx, 'customers', updates, {
      context: 'PATCH /customers/:id',
      conflictMessage: 'Un client porte déjà ce nom.',
    });
    if (customer) res.status(200).json(customer);
  },

  DELETE: (ctx) => deleteOwned(ctx, 'customers', { context: 'DELETE /customers/:id' }),
}, { withId: true });
