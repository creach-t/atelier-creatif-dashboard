// Traduit un payload webhook Ko-fi (https://ko-fi.com/manage/webhooks) en ligne "orders".
// Pure function (pas d'appel réseau/DB) pour rester facilement testable.

const KOFI_TYPE_LABELS = {
  Donation: 'Don Ko-fi',
  Subscription: 'Abonnement Ko-fi',
  Commission: 'Commande personnalisée Ko-fi',
  'Shop Order': 'Commande boutique Ko-fi',
};

function describeKofiType(type) {
  return KOFI_TYPE_LABELS[type] || 'Support Ko-fi';
}

function buildItems(payload) {
  if (Array.isArray(payload.shop_items) && payload.shop_items.length > 0) {
    // Ko-fi ne fournit pas de prix unitaire par article dans shop_items,
    // uniquement le nom/variation et la quantité — le total reste `amount`.
    return payload.shop_items.map((item) => ({
      name: item.variation_name || item.direct_link_code || 'Article Ko-fi',
      quantity: Number(item.quantity) || 1,
    }));
  }

  return [
    {
      name: describeKofiType(payload.type),
      quantity: 1,
      price: Number(payload.amount) || 0,
    },
  ];
}

function mapKofiPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid Ko-fi payload');
  }

  const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : null;
  const orderDate = (timestamp && timestamp.slice(0, 10)) || new Date().toISOString().slice(0, 10);

  return {
    channel: 'kofi',
    customer_name: payload.from_name || null,
    customer_email: payload.email || null,
    items: buildItems(payload),
    total: Number(payload.amount) || 0,
    status: 'pending',
    order_date: orderDate,
    tracking: null,
    shipping: payload.shipping ? 'standard' : null,
    shop_name: null,
    kofi_transaction_id: payload.kofi_transaction_id || null,
    raw_payload: payload,
  };
}

module.exports = { mapKofiPayload, describeKofiType };
