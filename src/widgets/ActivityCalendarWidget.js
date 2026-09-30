import React, { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { CHANNEL_OPTIONS } from '../core/widgets/common';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { OrdersHeatmap } from '../components/orders/OrdersHeatmap';
import { OrderRow } from '../components/orders/OrderRow';
import { formatDate } from '../core/metrics/format';
import { ScrollArea } from '../core/widgets/parts';

const CalendarView = ({ config }) => {
  const { orders } = useData();
  const { openOrder } = useOverlays();
  const [day, setDay] = useState(null);

  const scoped = useMemo(() => orders.filter((o) => config.channel === 'all' || o.channel === config.channel), [orders, config.channel]);
  const dayOrders = useMemo(() => (day ? scoped.filter((o) => o.order_date === day) : []), [scoped, day]);

  return (
    <ScrollArea>
      <OrdersHeatmap orders={scoped} weeksCount={Number(config.weeks)} selectedDay={day} onSelectDay={setDay} />
      {day && (
        <div className="mt-3 -mx-4 border-t border-purple-100 pt-2">
          <p className="px-4 text-xs font-semibold text-gray-500 mb-1">{formatDate(day)}</p>
          <div className="divide-y divide-purple-50">
            {dayOrders.map((o) => <OrderRow key={o.id} order={o} compact onClick={() => openOrder(o)} />)}
          </div>
        </div>
      )}
    </ScrollArea>
  );
};

defineWidget({
  type: 'activity-calendar',
  title: 'Calendrier d’activité',
  description: 'Une case par jour : plus elle est foncée, plus vous avez eu de commandes. Touchez un jour pour le détail.',
  icon: CalendarDays,
  category: 'Ventes',
  size: { w: 12, h: 9, minW: 4, minH: 6, maxW: 12, maxH: 20 },
  defaultConfig: { weeks: 26, channel: 'all' },
  schema: [
    { key: 'weeks', label: 'Durée', type: 'select', options: [{ value: 12, label: '3 mois' }, { value: 26, label: '6 mois' }, { value: 52, label: '1 an' }] },
    { key: 'channel', label: 'Canal', type: 'select', options: CHANNEL_OPTIONS.map((o) => ({ ...o, label: o.value === 'all' ? 'Tous' : o.label })) },
  ],
  component: CalendarView,
});
