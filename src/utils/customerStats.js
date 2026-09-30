// Totaux par client (nom), calculés depuis les commandes : source unique pour la liste clients, la fiche
// client et les classements.
export const computeStatsByName = (orders) => {
  const map = {};
  (orders || []).forEach((o) => {
    const name = o.customer_name;
    if (!name) return;
    if (!map[name]) map[name] = { total: 0, count: 0, first: o.order_date, last: o.order_date };
    map[name].total += Number(o.total || 0);
    map[name].count += 1;
    if (o.order_date && o.order_date < map[name].first) map[name].first = o.order_date;
    if (o.order_date && o.order_date > map[name].last) map[name].last = o.order_date;
  });
  return map;
};

const EMPTY = { total: 0, count: 0, first: null, last: null };

export const withCustomerStats = (customers, orders) => {
  const stats = computeStatsByName(orders);
  return (customers || []).map((c) => ({ ...c, ...(stats[c.name] || EMPTY) }));
};
