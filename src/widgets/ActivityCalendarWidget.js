import React, { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { CHANNEL_OPTIONS } from '../core/widgets/common';
import { useData } from '../data/DataProvider';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { OrdersHeatmap } from '../features/orders/OrdersHeatmap';
import { heatmapGrid } from '../features/orders/heatmapLayout';
import { OrderRow } from '../features/orders/OrderRow';
import { formatDate } from '../core/metrics/format';
import { ScaleToFit } from '../core/widgets/ScaleToFit';
import { Paged } from '../core/widgets/Fit';

// Le calendrier tient toujours en entier, sans défilement, avec des cases carrées : leur taille suit la hauteur du
// widget, puis on ajoute autant de semaines que la largeur en accepte (la durée choisie est un minimum). Si le tout
// dépasse encore, le contenu est réduit à l'échelle. Court : on retire les chiffres et la légende.
const CalendarView = ({ config, size }) => {
  const { orders } = useData();
  const { openOrder } = useOverlays();
  const [day, setDay] = useState(null);

  const scoped = useMemo(() => orders.filter((o) => config.channel === 'all' || o.channel === config.channel), [orders, config.channel]);
  const dayOrders = useMemo(() => (day ? scoped.filter((o) => o.order_date === day) : []), [scoped, day]);

  const tall = size.hTier === 'md' || size.hTier === 'lg';
  const { cell, weeks } = heatmapGrid({ ...size, minWeeks: Number(config.weeks), showStats: tall, dayOpen: Boolean(day) });

  return (
    <ScaleToFit>
      <OrdersHeatmap orders={scoped} weeksCount={weeks} selectedDay={day} onSelectDay={setDay} cell={cell} showStats={tall} showLegend={tall} />
      {day && (
        <div className="mt-3 border-t border-purple-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">{formatDate(day)}</p>
          <Paged
            items={dayOrders}
            pageSize={2}
            resetKey={day}
            renderItem={(o, i) => <div key={o.id} className="mb-2"><OrderRow order={o} index={i} compact onClick={() => openOrder(o)} /></div>}
          />
        </div>
      )}
    </ScaleToFit>
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
    { key: 'weeks', label: 'Durée minimale', help: 'Le calendrier ajoute des semaines tant que la largeur du widget le permet.', type: 'select', options: [{ value: 12, label: '3 mois' }, { value: 26, label: '6 mois' }, { value: 52, label: '1 an' }] },
    { key: 'channel', label: 'Canal', type: 'select', options: CHANNEL_OPTIONS.map((o) => ({ ...o, label: o.value === 'all' ? 'Tous' : o.label })) },
  ],
  component: CalendarView,
});
