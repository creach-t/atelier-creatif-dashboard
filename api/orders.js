const { getSupabaseClient } = require('./lib/supabaseClient');
const { requireUser } = require('./lib/auth');
const { syncCustomerFromOrder } = require('./lib/customerSync');

const ALLOWED_CHANNELS = ['kofi', 'reel'];
const ALLOWED_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];

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
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    if (!ALLOWED_CHANNELS.includes(body.channel)) {
      res.status(400).json({ error: `channel must be one of: ${ALLOWED_CHANNELS.join(', ')}` });
      return;
    }
    if (typeof body.total !== 'number' || Number.isNaN(body.total)) {
      res.status(400).json({ error: 'total must be a number' });
      return;
    }

    const status = ALLOWED_STATUSES.includes(body.status) ? body.status : 'pending';

    const order = {
      user_id: user.id,
      channel: body.channel,
      customer_name: body.customer_name || null,
      customer_email: body.customer_email || null,
      items: Array.isArray(body.items) ? body.items : [],
      total: body.total,
      status,
      order_date: body.order_date || new Date().toISOString().slice(0, 10),
      tracking: body.tracking || null,
      shipping: body.shipping || null,
      shop_name: body.channel === 'reel' ? body.shop_name || null : null,
    };

    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) {
      res.status(500).json({ error: error.message });
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
