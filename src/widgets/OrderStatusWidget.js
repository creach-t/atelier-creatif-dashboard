import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { OrderRow, ORDER_ROW_H } from '../features/orders/OrderRow';
import { ScaleToFit } from '../core/widgets/ScaleToFit';
import { FitList } from '../core/widgets/Fit';
import { STATUS_LABELS } from '../domain/constants';
import { EmptyState } from '../core/widgets/parts';
import { spring } from '../core/ui/motion';

const STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];
const COLORS = { pending: 'text-amber-600 bg-amber-50', shipped: 'text-blue-600 bg-blue-50', delivered: 'text-emerald-600 bg-emerald-50', cancelled: 'text-rose-600 bg-rose-50' };

const OrderStatusView = ({ config, size }) => {
  const { orders } = useWidgetOrders(config.period);
  const { openOrder } = useOverlays();
  const [selected, setSelected] = useState('pending');

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])), [orders]);
  const list = useMemo(() => orders.filter((o) => o.status === selected), [orders, selected]);

  // Court : seuls les compteurs restent, la liste détaillée reprend quand il y a de la place.
  const showList = size.hTier === 'md' || size.hTier === 'lg';

  const counters = (
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
  );

  // Court : les compteurs seuls, réduits à la taille disponible ; sinon compteurs + liste paginée.
  if (!showList) return <ScaleToFit>{counters}</ScaleToFit>;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {counters}
      {list.length === 0 ? (
        <EmptyState emoji={selected === 'pending' ? '🎉' : '🌱'}>{selected === 'pending' ? 'Tout est à jour, rien en attente !' : `Aucune commande « ${STATUS_LABELS[selected].toLowerCase()} » pour le moment.`}</EmptyState>
      ) : (
        <FitList
          items={list}
          rowHeight={ORDER_ROW_H.compact}
          resetKey={`${selected}|${config.period}`}
          renderItem={(o, i) => <OrderRow key={`${selected}-${o.id}`} order={o} index={i} compact showStatus={false} onClick={() => openOrder(o)} />}
        />
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
