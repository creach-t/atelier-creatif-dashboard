const { getSupabaseClient } = require('./lib/supabaseClient');
const { mapKofiPayload } = require('./lib/kofiMapper');
const { syncProductsFromItems } = require('./lib/productSync');
const { syncCustomerFromOrder } = require('./lib/customerSync');

// Ko-fi POST en application/x-www-form-urlencoded avec un champ `data`
// contenant le JSON de l'événement. server.js monte express.urlencoded()
// avant cette route, donc req.body.data est déjà disponible ici.
//
// Multi-utilisateur : Ko-fi envoie le même verification_token à chaque événement
// pour un créateur donné, et chaque créateur a le sien (stocké dans profiles.kofi_verification_token
// via l'onboarding) — c'est ce qui permet de retrouver le bon compte sans connaître
// à l'avance qui possède quel token.
module.exports = async (req, res) => {
  console.log(`Ko-fi webhook: requête reçue (${req.method})`);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawData = req.body && req.body.data;
  if (!rawData) {
    console.warn('Ko-fi webhook: missing data field. Body reçu:', JSON.stringify(req.body));
    res.status(400).json({ error: 'Missing data field' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch (err) {
    console.warn('Ko-fi webhook: invalid JSON payload:', rawData);
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  if (!payload.verification_token) {
    console.warn('Ko-fi webhook: verification_token absent du payload', payload);
    res.status(401).json({ error: 'Missing verification token' });
    return;
  }

  try {
    const supabase = getSupabaseClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('kofi_verification_token', payload.verification_token)
      .maybeSingle();

    if (profileError) {
      console.error('Supabase lookup error (kofi-webhook):', profileError);
      res.status(500).json({ error: 'Failed to resolve account' });
      return;
    }

    if (!profile) {
      console.warn(
        `Ko-fi webhook: aucun profil ne correspond au verification_token reçu ("${payload.verification_token}")`
      );
      res.status(401).json({ error: 'Unknown verification token' });
      return;
    }

    const order = { ...mapKofiPayload(payload), user_id: profile.id };

    const { error } = await supabase
      .from('orders')
      .upsert(order, { onConflict: 'kofi_transaction_id', ignoreDuplicates: true });

    if (error) {
      console.error('Supabase insert error (kofi-webhook):', error);
      res.status(500).json({ error: 'Failed to store order' });
      return;
    }

    // Enrichit le catalogue produits — uniquement pour de vraies commandes boutique
    // (shop_items présent), jamais pour un don/tip générique.
    if (Array.isArray(payload.shop_items) && payload.shop_items.length > 0) {
      await syncProductsFromItems(supabase, profile.id, order.items);
    }

    if (order.customer_name) {
      await syncCustomerFromOrder(supabase, profile.id, { name: order.customer_name, email: order.customer_email });
    }

    console.log(`Ko-fi webhook: commande enregistrée pour user ${profile.id} (type: ${payload.type})`);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Ko-fi webhook error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};
