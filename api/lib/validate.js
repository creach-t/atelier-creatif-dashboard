// Validation partagée des corps de requête. Chaque validateur retourne un message d'erreur
// (string) ou null si tout est bon — les handlers répondent 400 avec ce message.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const MAX_ITEMS = 200;
const MAX_EXTRAS = 50;
const MAX_AMOUNT = 99999999.99; // numeric(10,2)

const isUuid = (v) => typeof v === 'string' && UUID.test(v);
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

const isDay = (v) => {
  if (typeof v !== 'string' || !DAY.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

// Chaîne facultative : undefined/null acceptés, sinon string de longueur bornée.
const optionalString = (v, max) => v === undefined || v === null || (typeof v === 'string' && v.length <= max);

const validItems = (items) =>
  Array.isArray(items) &&
  items.length <= MAX_ITEMS &&
  items.every(
    (i) =>
      i &&
      typeof i.name === 'string' &&
      i.name.trim() &&
      i.name.length <= 200 &&
      isFiniteNumber(i.quantity) &&
      i.quantity > 0 &&
      isFiniteNumber(i.price) &&
      i.price >= 0
  );

const validExtras = (extras) =>
  Array.isArray(extras) &&
  extras.length <= MAX_EXTRAS &&
  extras.every(
    (e) => e && typeof e.label === 'string' && e.label.trim() && e.label.length <= 200 && isFiniteNumber(e.amount)
  );

const STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];
const { SOURCE_IDS: CHANNELS } = require('./sources'); // registre des sources (voir docs/SOURCES.md)

// Valide les champs de commande présents dans `body` (création ET modification).
function validateOrderFields(body) {
  if (body.channel !== undefined && !CHANNELS.includes(body.channel)) return `channel must be one of: ${CHANNELS.join(', ')}`;
  if (body.status !== undefined && !STATUSES.includes(body.status)) return `status must be one of: ${STATUSES.join(', ')}`;
  if (body.items !== undefined && !validItems(body.items)) return 'items must be a list of { name, quantity > 0, price >= 0 }';
  if (body.extras !== undefined && !validExtras(body.extras)) return 'extras must be a list of { label, amount }';
  if (body.total !== undefined && !(isFiniteNumber(body.total) && body.total >= 0 && body.total <= MAX_AMOUNT)) {
    return 'total must be a number between 0 and 99999999.99';
  }
  if (body.order_date !== undefined && !isDay(body.order_date)) return 'order_date must be YYYY-MM-DD';
  if (body.commission_rate !== undefined && body.commission_rate !== null && !(isFiniteNumber(body.commission_rate) && body.commission_rate >= 0 && body.commission_rate <= 100)) {
    return 'commission_rate must be a number between 0 and 100';
  }
  if (!optionalString(body.customer_name, 200)) return 'customer_name must be a string (200 chars max)';
  if (!optionalString(body.customer_email, 254)) return 'customer_email must be a string (254 chars max)';
  if (!optionalString(body.tracking, 200)) return 'tracking must be a string (200 chars max)';
  if (!optionalString(body.shipping, 100)) return 'shipping must be a string (100 chars max)';
  if (!optionalString(body.shop_name, 200)) return 'shop_name must be a string (200 chars max)';
  if (!optionalString(body.notes, 5000)) return 'notes must be a string (5000 chars max)';
  return null;
}

module.exports = { CHANNELS, STATUSES, isUuid, isDay, isFiniteNumber, optionalString, validItems, validExtras, validateOrderFields, MAX_AMOUNT };
