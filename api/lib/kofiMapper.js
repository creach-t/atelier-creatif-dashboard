// Traduit un payload webhook Ko-fi (https://ko-fi.com/manage/webhooks) en ligne "orders".
// Pure function (pas d'appel réseau/DB) pour rester facilement testable.

const { todayInParis, dayInParisFromTimestamp } = require('./dates');

const KOFI_TYPE_LABELS = {
  Donation: 'Don Ko-fi',
  Subscription: 'Abonnement Ko-fi',
  Commission: 'Commande personnalisée Ko-fi',
  'Shop Order': 'Commande boutique Ko-fi',
};

function describeKofiType(type) {
  return KOFI_TYPE_LABELS[type] || 'Support Ko-fi';
}

// Le payload arrive d'Internet (même avec un token valide) : on ne stocke que des textes bornés et des nombres finis.
const MAX_ITEMS = 200;
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const finiteAmount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e8 ? n : 0;
};

// Le verification_token est le secret du webhook : il ne doit pas être recopié dans chaque commande.
const withoutSecret = ({ verification_token: _token, ...rest }) => rest;

function buildItems(payload) {
  if (Array.isArray(payload.shop_items) && payload.shop_items.length > 0) {
    // Ko-fi ne fournit pas de prix unitaire par article dans shop_items,
    // uniquement le nom/variation et la quantité — le total reste `amount`.
    return payload.shop_items.slice(0, MAX_ITEMS).map((item) => {
      const it = item && typeof item === 'object' ? item : {};
      const quantity = Number(it.quantity);
      return {
        name: text(it.variation_name, 200) || text(it.direct_link_code, 200) || 'Article Ko-fi',
        quantity: Number.isFinite(quantity) && quantity > 0 && quantity < 10000 ? quantity : 1,
      };
    });
  }

  return [
    {
      name: describeKofiType(payload.type),
      quantity: 1,
      price: finiteAmount(payload.amount),
    },
  ];
}

function mapKofiPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid Ko-fi payload');
  }

  const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : null;
  const orderDate = (timestamp && dayInParisFromTimestamp(timestamp)) || todayInParis();

  return {
    channel: 'kofi',
    customer_name: text(payload.from_name, 200),
    customer_email: text(payload.email, 254),
    items: buildItems(payload),
    total: finiteAmount(payload.amount),
    status: 'pending',
    order_date: orderDate,
    tracking: null,
    shipping: payload.shipping ? 'standard' : null,
    shop_name: null,
    kofi_transaction_id: text(payload.kofi_transaction_id, 200),
    raw_payload: withoutSecret(payload),
  };
}

module.exports = { mapKofiPayload, describeKofiType };
