import React, { useState } from 'react';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge } from '../ui/ChannelBadge';
import { OrderForm } from './OrderForm';

export const Orders = ({ orders, createOrder, updateOrder }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(term) || order.id.toLowerCase().includes(term);
    return matchesStatus && matchesChannel && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Nouvelle Commande
        </Button>
      </div>

      <Card className="p-6">
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
            className="px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="all">Tous les canaux</option>
            <option value="kofi">Ko-fi</option>
            <option value="reel">Reel</option>
          </select>
          <select
            className="px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
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
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Commande</th>
                <th className="text-left p-4 font-semibold text-gray-700">Canal</th>
                <th className="text-left p-4 font-semibold text-gray-700">Client</th>
                <th className="text-left p-4 font-semibold text-gray-700">Articles</th>
                <th className="text-left p-4 font-semibold text-gray-700">Total</th>
                <th className="text-left p-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-purple-100 hover:bg-purple-25">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">{order.order_date}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <ChannelBadge channel={order.channel} />
                    {order.channel === 'reel' && order.shop_name && (
                      <p className="text-xs text-gray-500 mt-1">{order.shop_name}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customer_name || 'Anonyme'}</p>
                      {order.customer_email && <p className="text-sm text-gray-600">{order.customer_email}</p>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {(order.items || []).map((item, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {item.name} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-900">{Number(order.total).toFixed(2)}€</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg">
                        <Edit size={16} />
                      </button>
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => updateOrder(order.id, { status: 'shipped' })}>
                          Expédier
                        </Button>
                      )}
                    </div>
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
    </div>
  );
};
