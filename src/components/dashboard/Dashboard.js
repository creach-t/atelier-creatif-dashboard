import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, ChevronRight, ChevronLeft, TrendingUp, TrendingDown, ShoppingBag, Receipt, UserPlus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge, CHANNELS } from '../ui/ChannelBadge';
import { TopProducts } from '../products/TopProducts';
import { computeReportStats } from '../../utils/computeReportStats';
import { netOf } from '../../utils/orderAmounts';
import { computeProductRevenue } from '../../utils/computeProductRevenue';
import { catalogPrices } from '../../utils/estimatePrices';
import { groupProducts, groupIndex } from '../../utils/productVariants';

const PALETTE = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399'];

const channelBreakdown = (orders) => {
  return Object.keys(CHANNELS).map((channel, i) => {
    const channelOrders = orders.filter((order) => order.channel === channel);
    const revenue = channelOrders.reduce((sum, order) => sum + netOf(order), 0);
    return { channel, name: CHANNELS[channel].label, revenue, count: channelOrders.length, color: PALETTE[i % PALETTE.length] };
  });
};

const formatMonthLabel = (date) => {
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const monthKeyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const money = (n) => `${Number(n || 0).toFixed(2)}€`;

// Variation en % vs le mois précédent ; null si pas de base de comparaison.
const variation = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : null);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg text-sm border border-purple-100 bg-white">
      {label && <p className="text-xs mb-1 font-semibold text-gray-500">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} style={{ color: p.color || p.fill }} className="font-bold">
          {p.name ? `${p.name} : ` : ''}{Number(p.value).toFixed(2)}€
        </p>
      ))}
    </div>
  );
};

const Variation = ({ value }) => {
  if (value === null) return <span className="text-xs text-gray-400">pas de mois préc.</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
      <Icon size={12} />
      {up ? '+' : ''}{value.toFixed(0)} %
    </span>
  );
};

const StatRow = ({ icon: Icon, label, value, delta, tint }) => (
  <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
    </div>
    {delta}
  </div>
);

export const Dashboard = ({ orders, products, onSelectOrder, onNavigateToProduct, onGoToOrders, onGoToProducts }) => {
  const realNow = useMemo(() => new Date(), []);
  const realMonthKey = monthKeyOf(realNow);
  const [viewedDate, setViewedDate] = useState(() => new Date());

  const viewedMonthKey = monthKeyOf(viewedDate);
  const monthLabel = formatMonthLabel(viewedDate);
  const isCurrentMonth = viewedMonthKey === realMonthKey;
  const prevMonthKey = monthKeyOf(new Date(viewedDate.getFullYear(), viewedDate.getMonth() - 1, 1));

  const shiftMonth = (delta) => {
    setViewedDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const currentMonthOrders = useMemo(
    () => orders.filter((order) => (order.order_date || '').startsWith(viewedMonthKey)),
    [orders, viewedMonthKey]
  );
  const prevMonthOrders = useMemo(
    () => orders.filter((order) => (order.order_date || '').startsWith(prevMonthKey)),
    [orders, prevMonthKey]
  );

  const sum = (list) => list.reduce((s, o) => s + netOf(o), 0);
  const monthRevenue = sum(currentMonthOrders);
  const prevRevenue = sum(prevMonthOrders);
  const orderCount = currentMonthOrders.length;
  const averageBasket = orderCount ? monthRevenue / orderCount : 0;
  const prevAverageBasket = prevMonthOrders.length ? prevRevenue / prevMonthOrders.length : 0;

  // Nouveau client = dont la toute première commande tombe dans le mois affiché.
  const newCustomers = useMemo(() => {
    const first = {};
    orders.forEach((o) => {
      const key = o.customer_email || o.customer_name;
      if (!key || !o.order_date) return;
      if (!first[key] || o.order_date < first[key]) first[key] = o.order_date;
    });
    return Object.values(first).filter((d) => d.startsWith(viewedMonthKey)).length;
  }, [orders, viewedMonthKey]);

  const breakdown = useMemo(() => channelBreakdown(currentMonthOrders), [currentMonthOrders]);
  const breakdownWithSales = breakdown.filter((b) => b.revenue > 0);

  const trendData = useMemo(() => computeReportStats(orders).monthlyData.slice(-6), [orders]);

  // Produits classés par revenu généré (prix × quantité) sur le mois affiché.
  const monthProductRevenue = useMemo(
    () => computeProductRevenue(currentMonthOrders, catalogPrices(products)).reduce((sum, e) => sum + e.revenue, 0),
    [currentMonthOrders, products]
  );

  // Top 3 du mois : même podium que l'onglet Produits, les variantes d'un même produit étant additionnées.
  const topProducts = useMemo(() => {
    const index = groupIndex(groupProducts(products));
    const byKey = new Map();
    computeProductRevenue(currentMonthOrders, catalogPrices(products)).forEach((entry) => {
      const group = index.get(entry.name);
      if (!group) return;
      const row = byKey.get(group.key) || { group, revenue: 0, sold: 0 };
      row.revenue += entry.revenue;
      row.sold += entry.sold;
      byKey.set(group.key, row);
    });
    return [...byKey.values()].filter((t) => t.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  }, [currentMonthOrders, products]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-white border border-purple-100 rounded-xl p-1">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 text-gray-500 hover:bg-purple-50 rounded-lg" aria-label="Mois précédent">
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-semibold text-gray-700 min-w-[9.5rem] text-center">{monthLabel}</p>
          <button
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="p-1.5 text-gray-500 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Mois suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <p className="text-sm font-medium text-gray-500">Revenus · {monthLabel}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 mb-4">
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{money(monthRevenue)}</p>
            <Variation value={variation(monthRevenue, prevRevenue)} />
          </div>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Pas encore assez de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDashMontant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="montant" name="Revenus" stroke="#f472b6" strokeWidth={2.5} fill="url(#gDashMontant)" dot={{ fill: '#f472b6', r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4 sm:p-6 divide-y divide-purple-50 flex flex-col justify-center">
          <StatRow
            icon={ShoppingBag}
            label="Commandes"
            value={orderCount}
            tint="bg-purple-50 text-purple-600"
            delta={<Variation value={variation(orderCount, prevMonthOrders.length)} />}
          />
          <StatRow
            icon={Receipt}
            label="Panier moyen"
            value={money(averageBasket)}
            tint="bg-pink-50 text-pink-600"
            delta={<Variation value={variation(averageBasket, prevAverageBasket)} />}
          />
          <StatRow
            icon={UserPlus}
            label="Nouveaux clients"
            value={newCustomers}
            tint="bg-emerald-50 text-emerald-600"
          />
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">Produits les plus rentables</h3>
            <p className="text-sm text-gray-500">Par revenu généré · {monthLabel}</p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onGoToProducts && onGoToProducts()}>
            Catalogue
          </Button>
        </div>
        {topProducts.length === 0 ? (
          <Card className="p-5 sm:p-8 text-center">
            <p className="text-sm text-gray-500">Aucune vente ce mois-ci pour l'instant.</p>
          </Card>
        ) : (
          <TopProducts items={topProducts} totalRevenue={monthProductRevenue} onView={onNavigateToProduct} />
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
        <Card className="p-4 sm:p-6 h-full">
          <h3 className="text-base font-semibold text-gray-900">Répartition par canal</h3>
          <p className="text-sm text-gray-500 mb-4">{monthLabel}</p>
          {breakdownWithSales.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucune vente ce mois-ci.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownWithSales} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={4} dataKey="revenue">
                      {breakdownWithSales.map((b) => <Cell key={b.channel} fill={b.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 w-full">
                {breakdown.map(({ channel, revenue, count, color }) => (
                  <div key={channel} className="flex items-center justify-between text-sm gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <ChannelBadge channel={channel} />
                    </span>
                    <span className="text-gray-500 text-right">
                      <span className="font-semibold text-gray-900">{money(revenue)}</span> · {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        </div>
        <div className="lg:col-span-3">
      <Card className="p-4 sm:p-6 h-full">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-semibold text-gray-900">Commandes récentes</h3>
          <Button variant="ghost" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => onGoToOrders && onGoToOrders()}>
            <Eye size={16} />
            Voir tout
          </Button>
        </div>
        <div className="divide-y divide-purple-50">
          {orders.slice(0, 5).map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectOrder && onSelectOrder(order)}
              className="w-full flex items-center gap-3 py-3 hover:bg-purple-25 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {(order.customer_name || '?').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 break-words">{order.customer_name || 'Client anonyme'}</p>
                <p className="text-xs text-gray-500 whitespace-nowrap">{order.order_date}</p>
              </div>
              {/* Étroit : montant au-dessus du statut ; large : tout sur une ligne */}
              <div className="flex flex-col items-end gap-1 shrink-0 sm:flex-row sm:items-center sm:gap-3">
                <p className="font-semibold text-gray-900 whitespace-nowrap">{money(netOf(order))}</p>
                <span className="hidden sm:inline"><ChannelBadge channel={order.channel} /></span>
                <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
              </div>
            </button>
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">Aucune commande pour le moment.</p>
          )}
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
};
