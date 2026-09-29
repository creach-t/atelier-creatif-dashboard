const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireUser } = require('./lib/auth');
const { syncCustomerFromOrder } = require('./lib/customerSync');
const { todayInParis } = require('./lib/dates');
const { serverError } = require('./lib/errors');
const { validateOrderFields } = require('./lib/validate');

const ALLOWED_CHANNELS = ['kofi', 'reel'];

module.exports = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    // Trié par date de la transaction (order_date), pas par date d'insertion en base :
    // un import d'historique insère des centaines de commandes anciennes d'un coup,
    // created_at ne reflèterait que l'ordre du batch d'import, pas la vraie chronologie.
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false })
      .order('created_at', { ascending: false });

    const { channel } = req.query;
    if (channel && ALLOWED_CHANNELS.includes(channel)) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;
    if (error) return serverError(res, error, 'GET /orders');
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    if (!ALLOWED_CHANNELS.includes(body.channel)) {
      res.status(400).json({ error: `channel must be one of: ${ALLOWED_CHANNELS.join(', ')}` });
      return;
    }
    if (body.total === undefined) {
      res.status(400).json({ error: 'total is required' });
      return;
    }
    const invalid = validateOrderFields(body);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    const status = body.status || 'pending';

    const order = {
      user_id: user.id,
      channel: body.channel,
      customer_name: (body.customer_name && body.customer_name.trim()) || null,
      customer_email: body.customer_email || null,
      items: Array.isArray(body.items) ? body.items : [],
      total: body.total,
      status,
      order_date: body.order_date || todayInParis(),
      tracking: body.tracking || null,
      shipping: body.shipping || null,
      shop_name: body.channel === 'reel' ? body.shop_name || null : null,
    };
    // Colonne ajoutée par la migration 0005 : on ne l'envoie que si une note est saisie, pour que
    // créer une commande fonctionne même si la migration n'est pas encore passée.
    if (body.notes) order.notes = body.notes;

    // Divers (frais, dons, remises) : lignes { label, amount } qui ne sont pas des articles.
    if (Array.isArray(body.extras) && body.extras.length > 0) {
      order.extras = body.extras.map((e) => ({ label: e.label.trim(), amount: e.amount }));
    }

    // Commission de la boutique en % (0-100), pour les ventes en point de vente.
    if (body.commission_rate > 0) order.commission_rate = body.commission_rate;

    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) {
      const missing = ['notes', 'extras', 'commission_rate'].find((c) => error.message.includes(c));
      if (!missing) return serverError(res, error, 'POST /orders');
      res.status(500).json({ error: `La colonne « ${missing} » n'existe pas encore : exécute les migrations 0005 et 0008 dans Supabase.` });
      return;
    }

    if (order.customer_name) {
      await syncCustomerFromOrder(supabase, user.id, { name: order.customer_name, email: order.customer_email });
    }

    res.status(201).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
