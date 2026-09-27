import React, { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { ChannelBadge } from '../ui/ChannelBadge';

// Pas de table de notifications dédiée : on dérive un flux d'activité récent
// directement des commandes déjà chargées (les plus récentes par date de transaction).
export const NotificationBell = ({ orders, onSelectOrder }) => {
  const [open, setOpen] = useState(false);

  const recent = useMemo(() => (orders || []).slice(0, 6), [orders]);
  const pendingCount = useMemo(
    () => (orders || []).filter((o) => o.status === 'pending').length,
    [orders]
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-600 hover:bg-purple-50 rounded-xl transition-colors"
      >
        <Bell size={20} />
        {pendingCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] text-white font-semibold">{pendingCount > 9 ? '9+' : pendingCount}</span>
          </div>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fermer les notifications"
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-purple-100 shadow-lg z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-100">
              <p className="font-semibold text-gray-900 text-sm">Activité récente</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {recent.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">Aucune commande pour le moment.</p>
              )}
              {recent.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setOpen(false);
                    onSelectOrder && onSelectOrder(order);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-purple-25 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.customer_name || 'Client anonyme'}
                    </p>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {Number(order.total).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ChannelBadge channel={order.channel} />
                    <span className="text-xs text-gray-500">{order.order_date}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
