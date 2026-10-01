import React, { useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { countField, periodField, CHANNEL_OPTIONS, STATUS_OPTIONS } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { OrderRow, ORDER_ROW_H } from '../features/orders/OrderRow';
import { EmptyState } from '../core/widgets/parts';
import { FitList } from '../core/widgets/Fit';

const RecentOrdersView = ({ config, size }) => {
  const { orders } = useWidgetOrders(config.period);
  const { openOrder } = useOverlays();

  const rows = useMemo(() => orders
    .filter((o) => (config.status === 'all' || o.status === config.status) && (config.channel === 'all' || o.channel === config.channel))
    .slice(0, config.count), [orders, config.status, config.channel, config.count]);

  if (rows.length === 0) return <EmptyState emoji="🌱">Vos prochaines commandes apparaîtront ici — chaque vente commence par une première.</EmptyState>;
  return (
    <FitList
      items={rows}
      rowHeight={ORDER_ROW_H.compact}
      resetKey={`${config.status}|${config.channel}|${config.count}|${config.period}`}
      renderItem={(order, i) => (
        <OrderRow key={order.id} order={order} index={i} compact showChannel={config.showChannel && size.wTier !== 'xs'} showStatus={config.showStatus} onClick={() => openOrder(order)} />
      )}
    />
  );
};

defineWidget({
  type: 'recent-orders',
  title: 'Commandes récentes',
  description: 'Les dernières commandes, filtrables par statut et par canal. Touchez-en une pour l’ouvrir.',
  icon: ShoppingCart,
  category: 'Ventes',
  bleed: true,
  size: { w: 7, h: 9, minW: 3, minH: 5, maxW: 12, maxH: 30 },
  defaultConfig: { count: 5, status: 'all', channel: 'all', period: 'all', showChannel: true, showStatus: true },
  schema: [
    countField({ max: 20 }),
    { key: 'status', label: 'Statut', type: 'select', display: 'select', options: STATUS_OPTIONS },
    { key: 'channel', label: 'Canal', type: 'select', options: CHANNEL_OPTIONS.map((o) => ({ ...o, label: o.value === 'all' ? 'Tous' : o.label })) },
    periodField({ help: '« Tout » = les plus récentes, sans limite de date.' }),
    { key: 'showChannel', label: 'Afficher le canal', type: 'toggle' },
    { key: 'showStatus', label: 'Afficher le statut', type: 'toggle' },
  ],
  presets: [
    { label: 'Commandes à traiter', description: 'Uniquement les commandes en attente.', config: { status: 'pending', count: 8 } },
  ],
  component: RecentOrdersView,
});
