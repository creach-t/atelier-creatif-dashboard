import React from 'react';
import { X, Mail, Edit, StickyNote } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge } from '../ui/ChannelBadge';
import { getCustomerBadges, getInitials } from '../../utils/customerBadges';

export const CustomerDetailModal = ({ customer, orders, onEdit, onClose }) => {
  const badges = getCustomerBadges(customer);
  const customerOrders = [...(orders || [])].sort((a, b) => (b.order_date || '').localeCompare(a.order_date || ''));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900">Fiche client</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-semibold text-gray-900 truncate">{customer.name}</h4>
                {badges.map((b) => (
                  <span key={b.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
              {customer.email ? (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Mail size={12} />
                  {customer.email}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-0.5">Pas d'email renseigné</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-purple-25 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Total dépensé</p>
              <p className="text-base font-bold text-purple-600">{Number(customer.total || 0).toFixed(2)}€</p>
            </div>
            <div className="p-3 bg-purple-25 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Commandes</p>
              <p className="text-base font-bold text-gray-900">{customer.count || 0}</p>
            </div>
            <div className="p-3 bg-purple-25 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Dernière</p>
              <p className="text-sm font-semibold text-gray-900">{customer.last || '—'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <StickyNote size={14} />
              Notes
            </p>
            {customer.notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{customer.notes}</p>
            ) : (
              <p className="text-sm text-gray-400">Aucune note.</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Historique des commandes</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChannelBadge channel={order.channel} />
                    <span className="text-xs text-gray-500 shrink-0">{order.order_date}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">{Number(order.total).toFixed(2)}€</span>
                    <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
                  </div>
                </div>
              ))}
              {customerOrders.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune commande pour le moment.</p>
              )}
            </div>
          </div>

          <Button onClick={onEdit} className="w-full justify-center">
            <Edit size={14} />
            Modifier le client
          </Button>
        </div>
      </Card>
    </div>
  );
};
