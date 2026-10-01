import React, { useMemo, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { CHANNEL_OPTIONS } from '../core/widgets/common';
import { useData } from '../data/DataProvider';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { OrdersHeatmap } from '../features/orders/OrdersHeatmap';
import { heatmapGrid } from '../features/orders/heatmapLayout';
import { OrderRow } from '../features/orders/OrderRow';
import { formatDate, plural } from '../core/metrics/format';
import { ScaleToFit } from '../core/widgets/ScaleToFit';
import { Sheet } from '../core/ui/Sheet';

// Le calendrier tient toujours en entier, sans défilement, avec des cases carrées : leur taille suit la hauteur du
// widget, puis on ajoute autant de semaines que la largeur en accepte (la durée choisie est un minimum). Si le tout
// dépasse encore, le contenu est réduit à l'échelle, sinon il est centré. Court : on retire les chiffres et la légende.
// Toucher un jour ouvre ses commandes dans un panneau, sans toucher à la taille du calendrier.
const CalendarView = ({ config, size }) => {
  const { orders } = useData();
  const { openOrder } = useOverlays();
  const [day, setDay] = useState(null);

  const scoped = useMemo(() => orders.filter((o) => config.channel === 'all' || o.channel === config.channel), [orders, config.channel]);
  // Le détail du jour s'ouvre dans un panneau par-dessus : le calendrier garde sa taille quoi qu'on touche.
  // `shown` garde le dernier jour pendant l'animation de fermeture, pour que le panneau ne se vide pas en partant.
  const shown = useRef(null);
  if (day) shown.current = day;
  const dayOrders = useMemo(() => (shown.current ? scoped.filter((o) => o.order_date === shown.current) : []), [scoped, day]); // eslint-disable-line react-hooks/exhaustive-deps

  const tall = size.hTier === 'md' || size.hTier === 'lg';
  const { cell, weeks } = heatmapGrid({ ...size, minWeeks: Number(config.weeks), showStats: tall });

  // La fiche de commande s'ouvre dans une fenêtre sous le panneau : on ferme celui-ci d'abord.
  const open = (order) => { setDay(null); openOrder(order); };

  return (
    <>
      <ScaleToFit center>
        <OrdersHeatmap orders={scoped} weeksCount={weeks} selectedDay={day} onSelectDay={setDay} cell={cell} showStats={tall} showLegend={tall} />
      </ScaleToFit>
      <Sheet open={Boolean(day)} onClose={() => setDay(null)} title={formatDate(shown.current)} subtitle={plural(dayOrders.length, 'commande')}>
        <div className="space-y-2">
          {dayOrders.map((o, i) => <OrderRow key={o.id} order={o} index={i} onClick={() => open(o)} />)}
        </div>
      </Sheet>
    </>
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
