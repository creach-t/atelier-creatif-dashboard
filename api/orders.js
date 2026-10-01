const { route, badRequest, listOwned, insertOwned } = require('./lib/resource');
const { syncCustomerFromOrder } = require('./lib/customerSync');
const { todayInParis } = require('./lib/dates');
const { validateOrderFields, CHANNELS } = require('./lib/validate');

module.exports = route({
  // Trié par date de la transaction (order_date), pas par date d'insertion en base :
  // un import d'historique insère des centaines de commandes anciennes d'un coup,
  // created_at ne reflèterait que l'ordre du batch d'import, pas la vraie chronologie.
  GET: (ctx) => {
    const { channel } = ctx.req.query;
    return listOwned(ctx, 'orders', {
      orderBy: [['order_date', false], ['created_at', false]],
      filters: CHANNELS.includes(channel) ? { channel } : {},
      context: 'GET /orders',
    });
  },

  POST: async (ctx) => {
    const { res, user, supabase, body } = ctx;

    if (!CHANNELS.includes(body.channel)) return badRequest(res, `channel must be one of: ${CHANNELS.join(', ')}`);
    if (body.total === undefined) return badRequest(res, 'total is required');
    const invalid = validateOrderFields(body);
    if (invalid) return badRequest(res, invalid);

    const order = {
      user_id: user.id,
      channel: body.channel,
      customer_name: (body.customer_name && body.customer_name.trim()) || null,
      customer_email: body.customer_email || null,
      items: Array.isArray(body.items) ? body.items : [],
      total: body.total,
      status: body.status || 'pending',
      order_date: body.order_date || todayInParis(),
      tracking: body.tracking || null,
      shipping: body.shipping || null,
      shop_name: body.channel === 'reel' ? body.shop_name || null : null,
    };
    if (body.notes) order.notes = body.notes;
    // Divers (frais, dons, remises) : lignes { label, amount } qui ne sont pas des articles.
    if (Array.isArray(body.extras) && body.extras.length > 0) {
      order.extras = body.extras.map((e) => ({ label: e.label.trim(), amount: e.amount }));
    }
    // Commission de la boutique en % (0-100), pour les ventes en point de vente.
    if (body.commission_rate > 0) order.commission_rate = body.commission_rate;

    const created = await insertOwned(ctx, 'orders', order, { context: 'POST /orders' });
    if (!created) return;

    if (order.customer_name) {
      await syncCustomerFromOrder(supabase, user.id, { name: order.customer_name, email: order.customer_email });
    }
    res.status(201).json(created);
  },
});
