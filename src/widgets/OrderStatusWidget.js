import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { OrderRow } from '../components/orders/OrderRow';
import { STATUS_LABELS } from '../components/ui/Badge';
import { EmptyState, ScrollArea } from '../core/widgets/parts';
import { spring } from '../core/ui/motion';

const STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];
const COLORS = { pending: 'text-amber-600 bg-amber-50', shipped: 'text-blue-600 bg-blue-50', delivered: 'text-emerald-600 bg-emerald-50', cancelled: 'text-rose-600 bg-rose-50' };

const OrderStatusView = ({ config }) => {
  const { orders } = useWidgetOrders(config.period);
  const { openOrder } = useOverlays();
  const [selected, setSelected] = useState('pending');

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])), [orders]);
  const list = useMemo(() => orders.filter((o) => o.status === selected), [orders, selected]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-2 px-4 pb-3 shrink-0">
        {STATUSES.map((s) => {
          const active = selected === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelected(s)}
              aria-pressed={active}
              className={`relative rounded-xl p-2.5 text-left transition-colors ${COLORS[s]} ${active ? '' : 'opacity-70 hover:opacity-100'}`}
            >
              {active && <motion.span layoutId={`status-ring-${config.period}`} transition={spring} className="absolute inset-0 rounded-xl ring-2 ring-current" />}
              <span className="relative block text-xl font-bold leading-none">{counts[s]}</span>
              <span className="relative block text-[11px] font-medium mt-1">{STATUS_LABELS[s]}</span>
            </button>
          );
        })}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={ListChecks}>Rien ici : aucune commande « {STATUS_LABELS[selected].toLowerCase()} ».</EmptyState>
      ) : (
        <ScrollArea className="divide-y divide-purple-50 border-t border-purple-50">
          {list.map((o) => <OrderRow key={o.id} order={o} compact showStatus={false} onClick={() => openOrder(o)} />)}
        </ScrollArea>
      )}
    </div>
  );
};

defineWidget({
  type: 'order-status',
  title: 'Suivi des commandes',
  description: 'Combien de commandes par statut. Touchez un statut pour voir lesquelles.',
  icon: ListChecks,
  category: 'Ventes',
  bleed: true,
  size: { w: 5, h: 10, minW: 3, minH: 6, maxW: 12, maxH: 24 },
  defaultConfig: { period: 'all' },
  schema: [periodField()],
  component: OrderStatusView,
});
