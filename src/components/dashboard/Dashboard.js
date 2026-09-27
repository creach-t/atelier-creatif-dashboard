import React, { useMemo } from 'react';
import { Eye, DollarSign, Clock, Palette, Truck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge, CHANNELS } from '../ui/ChannelBadge';
import { ProductThumbnail } from '../ui/ProductThumbnail';
import { computeSoldByName } from '../../utils/computeSoldByName';

const channelBreakdown = (orders) => {
  return Object.keys(CHANNELS).map((channel) => {
    const channelOrders = orders.filter((order) => order.channel === channel);
    const revenue = channelOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { channel, revenue, count: channelOrders.length };
  });
};

const monthLabel = (() => {
  const label = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
})();

export const Dashboard = ({ orders, products }) => {
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentMonthOrders = useMemo(
    () => orders.filter((order) => (order.order_date || '').startsWith(currentMonthKey)),
    [orders, currentMonthKey]
  );

  const monthRevenue = currentMonthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const shippedToday = orders.filter(
    (order) => order.status === 'shipped' && order.order_date === new Date().toISOString().split('T')[0]
  ).length;

  const breakdown = channelBreakdown(currentMonthOrders);
  const maxRevenue = Math.max(1, ...breakdown.map((b) => b.revenue));

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
    { title: `Revenus (${monthLabel})`, value: `${monthRevenue.toFixed(2)}€`, icon: DollarSign, color: 'from-green-400 to-emerald-400' },
    { title: 'Commandes en Attente', value: pendingOrders, icon: Clock, color: 'from-yellow-400 to-orange-400' },
    { title: 'Produits Catalogués', value: products.length, icon: Palette, color: 'from-purple-400 to-pink-400' },
    { title: 'Expédiées Aujourd\'hui', value: shippedToday, icon: Truck, color: 'from-blue-400 to-purple-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h3>
        <p className="text-sm text-gray-500 mt-1">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="p-6" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Répartition par canal</h3>
        <p className="text-sm text-gray-500 mb-6">{monthLabel}</p>
        <div className="space-y-4">
          {breakdown.map(({ channel, revenue, count }) => (
            <div key={channel}>
              <div className="flex items-center justify-between mb-1">
                <ChannelBadge channel={channel} />
                <span className="text-sm text-gray-600">
                  {count} commande{count !== 1 ? 's' : ''} · <span className="font-semibold text-gray-900">{revenue.toFixed(2)}€</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                  style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Commandes Récentes</h3>
          <Button variant="ghost" size="sm">
            <Eye size={16} />
            Voir tout
          </Button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-purple-25 rounded-xl hover:bg-purple-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  {(order.customer_name || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.customer_name || 'Client anonyme'}</p>
                  <p className="text-sm text-gray-600">Commande #{order.id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{Number(order.total).toFixed(2)}€</p>
                  <p className="text-sm text-gray-600">{order.order_date}</p>
                </div>
                <ChannelBadge channel={order.channel} />
                <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
              </div>
            </div>
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
            <div key={product.id} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <ProductThumbnail image={product.image} size="text-3xl" className="mb-3" />
              <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-600">{Number(product.price).toFixed(2)}€</span>
                <span className="text-sm text-gray-600">{product.sold} vendu{product.sold > 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
          {popularProducts.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full text-center py-6">Aucune vente ce mois-ci pour l'instant.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
