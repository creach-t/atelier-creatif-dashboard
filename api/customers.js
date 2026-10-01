const { route, badRequest, listOwned, insertOwned } = require('./lib/resource');
const { optionalString } = require('./lib/validate');

module.exports = route({
  GET: (ctx) => listOwned(ctx, 'customers', { orderBy: [['name', true]], context: 'GET /customers' }),

  POST: async (ctx) => {
    const { res, user, body } = ctx;

    if (typeof body.name !== 'string' || !body.name.trim()) return badRequest(res, 'name is required');
    if (body.name.length > 200 || !optionalString(body.email, 254) || !optionalString(body.notes, 5000)) {
      return badRequest(res, 'name, email or notes too long');
    }

    const customer = await insertOwned(
      ctx,
      'customers',
      { user_id: user.id, name: body.name.trim(), email: body.email || null, notes: body.notes || null },
      { context: 'POST /customers', conflictMessage: 'Un client porte déjà ce nom.' }
    );
    if (customer) res.status(201).json(customer);
  },
});
