import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge } from '../ui/ChannelBadge';
import { OrderForm } from './OrderForm';
import { OrderDetailModal } from './OrderDetailModal';

const PERIODS = [
  { id: 'all', label: 'Tout' },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'year', label: 'Cette année' },
];

const matchesPeriod = (order, period) => {
  if (period === 'all' || !order.order_date) return true;
  const orderDate = new Date(order.order_date);
  const now = new Date();
  if (period === 'year') return orderDate.getFullYear() === now.getFullYear();
  const days = period === '7d' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return orderDate >= cutoff;
};

export const Orders = ({ orders, products, createOrder, updateOrder, onNavigateToProduct, selectedOrderId, onClearSelectedOrder }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [period, setPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(term) || order.id.toLowerCase().includes(term);
    return matchesStatus && matchesChannel && matchesSearch && matchesPeriod(order, period);
  }), [orders, statusFilter, channelFilter, searchTerm, period]);

  const openDetail = (order) => setDetailOrder(order);
  const closeDetail = () => {
    setDetailOrder(null);
    onClearSelectedOrder && onClearSelectedOrder();
  };

  const handleNavigateToProduct = (name) => {
    closeDetail();
    onNavigateToProduct(name);
  };

  // Ouvre automatiquement le détail d'une commande sélectionnée depuis une notification.
  React.useEffect(() => {
    if (!selectedOrderId) return;
    const match = orders.find((o) => o.id === selectedOrderId);
    if (match) setDetailOrder(match);
  }, [selectedOrderId, orders]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h3>
        <Button onClick={() => setShowForm(true)} className="justify-center">
          <Plus size={16} />
          Nouvelle Commande
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou numéro..."
              className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full md:w-auto px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="all">Tous les canaux</option>
            <option value="kofi">Ko-fi</option>
            <option value="reel">Reel</option>
          </select>
          <select
            className="w-full md:w-auto px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="shipped">Expédiées</option>
            <option value="delivered">Livrées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                period === p.id ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Commande</th>
                <th className="text-left p-4 font-semibold text-gray-700 hidden sm:table-cell">Canal</th>
                <th className="text-left p-4 font-semibold text-gray-700">Client</th>
                <th className="text-left p-4 font-semibold text-gray-700 hidden lg:table-cell">Articles</th>
                <th className="text-left p-4 font-semibold text-gray-700">Total</th>
                <th className="text-left p-4 font-semibold text-gray-700 hidden md:table-cell">Statut</th>
                <th className="text-left p-4 font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => openDetail(order)}
                  className="border-b border-purple-100 hover:bg-purple-25 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">{order.order_date}</p>
                      <div className="sm:hidden mt-1">
                        <ChannelBadge channel={order.channel} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <ChannelBadge channel={order.channel} />
                    {order.channel === 'reel' && order.shop_name && (
                      <p className="text-xs text-gray-500 mt-1">{order.shop_name}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customer_name || 'Anonyme'}</p>
                      {order.customer_email && <p className="text-sm text-gray-600 hidden md:block">{order.customer_email}</p>}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="space-y-1">
                      {(order.items || []).slice(0, 2).map((item, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {item.name} x{item.quantity}
                        </p>
                      ))}
                      {(order.items || []).length > 2 && (
                        <p className="text-xs text-gray-400">+{order.items.length - 2} autre(s)</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-900">{Number(order.total).toFixed(2)}€</span>
                    <div className="md:hidden mt-1">
                      <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
                  </td>
                  <td className="p-4">
                    {order.status === 'pending' && (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); updateOrder(order.id, { status: 'shipped' }); }}>
                        Expédier
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-gray-500">
                    Aucune commande ne correspond à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && <OrderForm onCreate={createOrder} onClose={() => setShowForm(false)} />}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          products={products}
          onUpdate={updateOrder}
          onNavigateToProduct={handleNavigateToProduct}
          onClose={closeDetail}
        />
      )}
    </div>
  );
};
