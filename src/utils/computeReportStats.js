import { netOf } from './orderAmounts';
// Statistiques dérivées des commandes pour l'onglet Rapports — inspiré de kofi-visualizer,
// adapté aux commandes multi-canal de Cashly (pas seulement Ko-fi) au lieu d'un CSV séparé.
const MONTH_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function computeReportStats(orders) {
  const list = orders || [];
  const total = list.reduce((s, o) => s + netOf(o), 0); // revenus = net après commission

  // Mensuel + cumul
  const monthMap = {};
  list.forEach((o) => {
    const [y, mo] = (o.order_date || '').split('-');
    if (!y || !mo) return;
    const key = `${y}-${mo}`;
    if (!monthMap[key]) monthMap[key] = { key, year: y, month: mo, total: 0 };
    monthMap[key].total += netOf(o);
  });
  const months = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
  let running = 0;
  const monthlyData = months.map((m) => {
    running += m.total;
    return {
      name: `${MONTH_FR[parseInt(m.month, 10) - 1]} ${m.year.slice(2)}`,
      fullName: `${MONTH_FR[parseInt(m.month, 10) - 1]} ${m.year}`,
      montant: Math.round(m.total * 100) / 100,
      cumul: Math.round(running * 100) / 100,
    };
  });
  const bestMonth = [...monthlyData].sort((a, b) => b.montant - a.montant)[0];
  const lastMonth = months.at(-1);
  const prevMonth = months.at(-2);
  const monthTrend = prevMonth && prevMonth.total > 0 ? ((lastMonth.total - prevMonth.total) / prevMonth.total) * 100 : null;

  // Jour de la semaine
  const dayTotals = Array(7).fill(0);
  list.forEach((o) => {
    if (!o.order_date) return;
    const day = new Date(o.order_date).getDay();
    dayTotals[day] += netOf(o);
  });
  const dayData = DAYS_FR.map((name, i) => ({ name, montant: Math.round(dayTotals[i] * 100) / 100 }));

  // Clients
  const customerMap = {};
  list.forEach((o) => {
    const name = o.customer_name || 'Anonyme';
    if (!customerMap[name]) {
      customerMap[name] = { name, email: o.customer_email || null, total: 0, count: 0, first: o.order_date, last: o.order_date };
    }
    const c = customerMap[name];
    c.total += Number(o.total || 0);
    c.count += 1;
    if (o.order_date && o.order_date < c.first) c.first = o.order_date;
    if (o.order_date && o.order_date > c.last) c.last = o.order_date;
    if (!c.email && o.customer_email) c.email = o.customer_email;
  });
  const customers = Object.values(customerMap)
    .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  return {
    total,
    count: list.length,
    avgOrderValue: list.length ? total / list.length : 0,
    monthlyData,
    bestMonth,
    monthTrend,
    dayData,
    customers,
    uniqueCustomers: customers.length,
    topCustomer: customers[0] || null,
  };
}
