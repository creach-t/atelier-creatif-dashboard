import React, { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { CHANNEL_OPTIONS } from '../core/widgets/common';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { OrdersHeatmap, GAP } from '../components/orders/OrdersHeatmap';
import { OrderRow } from '../components/orders/OrderRow';
import { formatDate } from '../core/metrics/format';
import { ScaleToFit } from '../core/widgets/ScaleToFit';
import { Paged } from '../core/widgets/Fit';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Le calendrier tient toujours en entier, sans défilement : les cases prennent la taille qui remplit la largeur et
// la hauteur du widget (plus petites si besoin), et si le tout dépasse encore, le contenu est réduit à l'échelle.
// Court : on retire les chiffres et la légende.
const CalendarView = ({ config, size }) => {
  const { orders } = useData();
  const { openOrder } = useOverlays();
  const [day, setDay] = useState(null);

  const scoped = useMemo(() => orders.filter((o) => config.channel === 'all' || o.channel === config.channel), [orders, config.channel]);
  const dayOrders = useMemo(() => (day ? scoped.filter((o) => o.order_date === day) : []), [scoped, day]);

  const weeks = Number(config.weeks);
  const tall = size.hTier === 'md' || size.hTier === 'lg';
  const availW = size.width - 38 - 24; // étiquettes des jours + marge pour la dernière étiquette de mois
  const availH = size.height - 18 - 12 - (tall ? 70 : 0) - (day ? 180 : 0); // mois + marge + chiffres/légende + jour choisi
  const cellW = (availW - (weeks - 1) * GAP) / weeks;
  const cellH = (availH - 6 * GAP) / 7;
  const cell = size.measured ? clamp(Math.floor(Math.min(cellW, cellH)), 5, 26) : 16;

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
    { key: 'weeks', label: 'Durée', type: 'select', options: [{ value: 12, label: '3 mois' }, { value: 26, label: '6 mois' }, { value: 52, label: '1 an' }] },
    { key: 'channel', label: 'Canal', type: 'select', options: CHANNEL_OPTIONS.map((o) => ({ ...o, label: o.value === 'all' ? 'Tous' : o.label })) },
  ],
  component: CalendarView,
});
