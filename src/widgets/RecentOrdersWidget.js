import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { countField, periodField, CHANNEL_OPTIONS, STATUS_OPTIONS } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { OrderRow } from '../components/orders/OrderRow';
import { EmptyState, ScrollArea } from '../core/widgets/parts';
import { listItem } from '../core/ui/motion';

const RecentOrdersView = ({ config }) => {
  const { orders } = useWidgetOrders(config.period);
  const { openOrder } = useOverlays();

  const rows = useMemo(() => orders
    .filter((o) => (config.status === 'all' || o.status === config.status) && (config.channel === 'all' || o.channel === config.channel))
    .slice(0, config.count), [orders, config.status, config.channel, config.count]);

  if (rows.length === 0) return <EmptyState icon={ShoppingCart}>Aucune commande à afficher.</EmptyState>;
  return (
    <ScrollArea>
      <div className="divide-y divide-purple-50">
        {rows.map((order, i) => (
          <motion.div key={order.id} custom={i} variants={listItem} initial="hidden" animate="visible">
            <OrderRow order={order} compact showChannel={config.showChannel} showStatus={config.showStatus} onClick={() => openOrder(order)} />
          </motion.div>
        ))}
      </div>
    </ScrollArea>
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
