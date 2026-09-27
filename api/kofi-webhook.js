const { getSupabaseClient } = require('./lib/supabaseClient');
const { mapKofiPayload } = require('./lib/kofiMapper');

// Ko-fi POST en application/x-www-form-urlencoded avec un champ `data`
// contenant le JSON de l'événement. server.js monte express.urlencoded()
// avant cette route, donc req.body.data est déjà disponible ici.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawData = req.body && req.body.data;
  if (!rawData) {
    res.status(400).json({ error: 'Missing data field' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  const expectedToken = process.env.KOFI_VERIFICATION_TOKEN;
  if (!expectedToken || payload.verification_token !== expectedToken) {
    res.status(401).json({ error: 'Invalid verification token' });
    return;
  }

  try {
    const order = mapKofiPayload(payload);
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('orders')
      .upsert(order, { onConflict: 'kofi_transaction_id', ignoreDuplicates: true });

    if (error) {
      console.error('Supabase insert error (kofi-webhook):', error);
      res.status(500).json({ error: 'Failed to store order' });
      return;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Ko-fi webhook error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};
