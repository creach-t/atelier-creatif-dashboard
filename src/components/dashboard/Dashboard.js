import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, DollarSign, Clock, Palette, Truck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge, CHANNELS } from '../ui/ChannelBadge';
import { ProductThumbnail } from '../ui/ProductThumbnail';
import { computeSoldByName } from '../../utils/computeSoldByName';
import { computeReportStats } from '../../utils/computeReportStats';

const PALETTE = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399'];

const channelBreakdown = (orders) => {
  return Object.keys(CHANNELS).map((channel, i) => {
    const channelOrders = orders.filter((order) => order.channel === channel);
    const revenue = channelOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { channel, name: CHANNELS[channel].label, revenue, count: channelOrders.length, color: PALETTE[i % PALETTE.length] };
  });
};

const formatMonthLabel = (date) => {
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const monthKeyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

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

export const Dashboard = ({ orders, products, onSelectOrder, onNavigateToProduct, onGoToOrders, onGoToProducts }) => {
  const realNow = useMemo(() => new Date(), []);
  const realMonthKey = monthKeyOf(realNow);
  const [viewedDate, setViewedDate] = useState(() => new Date());

  const viewedMonthKey = monthKeyOf(viewedDate);
  const monthLabel = formatMonthLabel(viewedDate);
  const isCurrentMonth = viewedMonthKey === realMonthKey;

  const shiftMonth = (delta) => {
    setViewedDate((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
      return next;
    });
  };

  const currentMonthOrders = useMemo(
    () => orders.filter((order) => (order.order_date || '').startsWith(viewedMonthKey)),
    [orders, viewedMonthKey]
  );

  const monthRevenue = currentMonthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const shippedToday = orders.filter(
    (order) => order.status === 'shipped' && order.order_date === new Date().toISOString().split('T')[0]
  ).length;

  const breakdown = useMemo(() => channelBreakdown(currentMonthOrders), [currentMonthOrders]);
  const breakdownWithSales = breakdown.filter((b) => b.revenue > 0);

  const trendData = useMemo(() => computeReportStats(orders).monthlyData.slice(-6), [orders]);

  const soldByNameThisMonth = useMemo(() => computeSoldByName(currentMonthOrders), [currentMonthOrders]);
  const popularProducts = useMemo(
    () =>
      [...products]
        .map((p) => ({ ...p, sold: soldByNameThisMonth[p.name] || 0 }))
        .filter((p) => p.sold > 0)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 3),
    [products, soldByNameThisMonth]
  );

  const metrics = [
    { title: `Revenus (${monthLabel})`, value: `${monthRevenue.toFixed(2)}€`, icon: DollarSign, color: 'from-green-400 to-emerald-400', onClick: () => onGoToOrders && onGoToOrders() },
    { title: 'Commandes en Attente', value: pendingOrders, icon: Clock, color: 'from-yellow-400 to-orange-400', onClick: () => onGoToOrders && onGoToOrders('pending') },
    { title: 'Produits Catalogués', value: products.length, icon: Palette, color: 'from-purple-400 to-pink-400', onClick: onGoToProducts },
    { title: 'Expédiées Aujourd\'hui', value: shippedToday, icon: Truck, color: 'from-blue-400 to-purple-400', onClick: () => onGoToOrders && onGoToOrders('shipped') },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => shiftMonth(-1)}
          className="p-2 text-gray-500 hover:bg-purple-50 rounded-lg shrink-0"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-gray-700 min-w-[11rem] text-center">{monthLabel}</p>
        <button
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          className="p-2 text-gray-500 hover:bg-purple-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
          aria-label="Mois suivant"
        >
          <ChevronRight size={18} />
        </button>
        {!isCurrentMonth && (
          <button
            onClick={() => setViewedDate(new Date())}
            className="text-xs font-semibold text-purple-600 hover:underline"
          >
            Revenir à ce mois-ci
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className="p-6"
              hover
              onClick={metric.onClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Évolution des revenus</h3>
          <p className="text-sm text-gray-500 mb-4">6 derniers mois</p>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Pas encore assez de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Répartition par canal</h3>
          <p className="text-sm text-gray-500 mb-4">{monthLabel}</p>
          {breakdownWithSales.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Aucune vente ce mois-ci.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={breakdownWithSales} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={4} dataKey="revenue">
                    {breakdownWithSales.map((b) => <Cell key={b.channel} fill={b.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {breakdown.map(({ channel, name, revenue, count, color }) => (
                  <div key={channel} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <ChannelBadge channel={channel} />
                    </span>
                    <span className="text-gray-600">
                      {count} commande{count !== 1 ? 's' : ''} · <span className="font-semibold text-gray-900">{revenue.toFixed(2)}€</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Commandes Récentes</h3>
          <Button variant="ghost" size="sm" onClick={() => onGoToOrders && onGoToOrders()}>
            <Eye size={16} />
            Voir tout
          </Button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 3).map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectOrder && onSelectOrder(order)}
              className="w-full flex items-center justify-between p-4 bg-purple-25 rounded-xl hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  {(order.customer_name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{order.customer_name || 'Client anonyme'}</p>
                  <p className="text-sm text-gray-600">Commande #{order.id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-gray-900">{Number(order.total).toFixed(2)}€</p>
                  <p className="text-sm text-gray-600">{order.order_date}</p>
                </div>
                <ChannelBadge channel={order.channel} />
                <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </button>
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">Aucune commande pour le moment.</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Produits Populaires</h3>
        <p className="text-sm text-gray-500 mb-6">{monthLabel}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {popularProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => onNavigateToProduct && onNavigateToProduct(product.name)}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-left hover:shadow-md transition-shadow"
            >
              <ProductThumbnail image={product.image} size="text-3xl" className="mb-3" />
              <h4 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-600">{Number(product.price).toFixed(2)}€</span>
                <span className="text-sm text-gray-600">{product.sold} vendu{product.sold > 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}
          {popularProducts.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full text-center py-6">Aucune vente ce mois-ci pour l'instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
