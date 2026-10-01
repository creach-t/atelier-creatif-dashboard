const { route, pickFields, badRequest, updateOwned, deleteOwned } = require('../lib/resource');
const { syncCustomerFromOrder } = require('../lib/customerSync');
const { validateOrderFields } = require('../lib/validate');

const PATCHABLE_FIELDS = [
  'status', 'tracking', 'shipping', 'notes', 'commission_rate',
  'channel', 'customer_name', 'customer_email', 'items', 'total', 'order_date', 'extras', 'shop_name',
];

module.exports = route({
  PATCH: async (ctx) => {
    const { res, user, supabase, body } = ctx;

    const invalid = validateOrderFields(body);
    if (invalid) return badRequest(res, invalid);
    if (body.customer_name !== undefined && !(typeof body.customer_name === 'string' && body.customer_name.trim())) {
      return badRequest(res, 'customer_name cannot be empty');
    }

    const updates = pickFields(body, PATCHABLE_FIELDS);
    if (updates.items) updates.items = updates.items.map((i) => ({ name: i.name.trim(), quantity: i.quantity, price: i.price }));
    if (updates.extras) updates.extras = updates.extras.map((e) => ({ label: e.label.trim(), amount: e.amount }));
    if (updates.customer_name) updates.customer_name = updates.customer_name.trim();
    if (Object.keys(updates).length === 0) return badRequest(res, 'No valid fields to update');

    const order = await updateOwned(ctx, 'orders', updates, { context: 'PATCH /orders/:id' });
    if (!order) return;

    // Le client a pu changer : on crée sa fiche si elle n'existe pas encore (comme à la création).
    if (updates.customer_name) {
      await syncCustomerFromOrder(supabase, user.id, { name: updates.customer_name, email: updates.customer_email || order.customer_email });
    }
    res.status(200).json(order);
  },

  DELETE: (ctx) => deleteOwned(ctx, 'orders', { context: 'DELETE /orders/:id' }),
}, { withId: true });
