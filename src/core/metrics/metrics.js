import { netOf, commissionOf } from '../../utils/orderAmounts';
import { countOrderItems } from '../../utils/computeProductRevenue';

const customerKey = (o) => o.customer_email || o.customer_name || null;

// Chaque métrique se calcule sur une liste de commandes (déjà filtrée par période). `ctx.allOrders` sert
// aux notions qui dépendent de l'historique (nouveau client = première commande dans la période).
// Ajouter une métrique ici la rend disponible dans tous les widgets configurables.
export const METRICS = {
  revenue: {
    id: 'revenue', label: 'Revenus (net)', short: 'Revenus', format: 'money', icon: 'wallet', tint: 'purple',
    compute: (orders) => orders.reduce((s, o) => s + netOf(o), 0),
  },
  gross: {
    id: 'gross', label: 'Ventes brutes', short: 'Brut', format: 'money', icon: 'wallet', tint: 'pink',
    compute: (orders) => orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
  },
  orders: {
    id: 'orders', label: 'Commandes', short: 'Commandes', format: 'int', icon: 'bag', tint: 'purple',
    compute: (orders) => orders.length,
  },
  basket: {
    id: 'basket', label: 'Panier moyen', short: 'Panier moyen', format: 'money', icon: 'receipt', tint: 'pink',
    compute: (orders) => (orders.length ? orders.reduce((s, o) => s + netOf(o), 0) / orders.length : 0),
  },
  items: {
    id: 'items', label: 'Articles vendus', short: 'Articles', format: 'int', icon: 'package', tint: 'amber',
    compute: (orders) => orders.reduce((s, o) => s + countOrderItems(o), 0),
  },
  customers: {
    id: 'customers', label: 'Clients distincts', short: 'Clients', format: 'int', icon: 'users', tint: 'emerald',
    compute: (orders) => new Set(orders.map(customerKey).filter(Boolean)).size,
  },
  newCustomers: {
    id: 'newCustomers', label: 'Nouveaux clients', short: 'Nouveaux clients', format: 'int', icon: 'userplus', tint: 'emerald',
    // Nouveau = dont la toute première commande (sur tout l'historique) tombe dans les commandes données.
    compute: (orders, ctx = {}) => {
      const first = {};
      (ctx.allOrders || orders).forEach((o) => {
        const key = customerKey(o);
        if (!key || !o.order_date) return;
        if (!first[key] || o.order_date < first[key]) first[key] = o.order_date;
      });
      const seen = new Set();
      orders.forEach((o) => {
        const key = customerKey(o);
        if (key && o.order_date && first[key] === o.order_date) seen.add(key);
      });
      return seen.size;
    },
  },
  commission: {
    id: 'commission', label: 'Commissions versées', short: 'Commissions', format: 'money', icon: 'receipt', tint: 'rose',
    compute: (orders) => orders.reduce((s, o) => s + commissionOf(o), 0),
  },
  pending: {
    id: 'pending', label: 'Commandes en attente', short: 'En attente', format: 'int', icon: 'clock', tint: 'amber',
    compute: (orders) => orders.filter((o) => o.status === 'pending').length,
  },
};

export const getMetric = (id) => METRICS[id] || METRICS.revenue;
export const metricOptions = (ids) => (ids || Object.keys(METRICS)).map((id) => ({ value: id, label: METRICS[id].label }));

// Variation en % ; null quand il n'y a pas de base de comparaison.
export const variation = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : null);
