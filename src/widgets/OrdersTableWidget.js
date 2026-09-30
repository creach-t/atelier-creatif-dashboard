import React, { useMemo, useState } from 'react';
import { Plus, X, List } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { OrderRow } from '../components/orders/OrderRow';
import { ChannelLogo } from '../components/ui/ChannelBadge';
import { SortHeader } from '../components/ui/SortHeader';
import { useSort, sortRows } from '../hooks/useSort';
import { netOf } from '../utils/orderAmounts';
import { money } from '../core/metrics/format';
import { Chip, EmptyState, ScrollArea, SearchBox } from '../core/widgets/parts';

const CHANNEL_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'kofi', label: 'Ko-fi', logo: true },
  { id: 'reel', label: 'Point de vente', logo: true },
];
const STATUS_FILTERS = [
  { id: 'all', label: 'Tous statuts' },
  { id: 'pending', label: 'En attente' },
  { id: 'shipped', label: 'Expédiée' },
  { id: 'delivered', label: 'Livrée' },
  { id: 'cancelled', label: 'Annulée' },
];

const OrdersTableView = ({ config }) => {
  const { orders } = useWidgetOrders(config.period);
  const { openOrder, newOrder } = useOverlays();
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [term, setTerm] = useState('');
  const [sort, toggleSort] = useSort('date', 'desc');

  const rows = useMemo(() => {
    const q = term.toLowerCase();
    const filtered = orders.filter((o) => (
      (channel === 'all' || o.channel === channel)
      && (status === 'all' || o.status === status)
      && ((o.customer_name || '').toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    ));
    return sortRows(filtered, sort, {
      client: (o) => o.customer_name, date: (o) => o.order_date, channel: (o) => o.channel, total: (o) => netOf(o),
    });
  }, [orders, channel, status, term, sort]);

  const filtersActive = channel !== 'all' || status !== 'all' || term !== '';
  const reset = () => { setChannel('all'); setStatus('all'); setTerm(''); };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-4 pt-2 pb-3 space-y-3 shrink-0">
        <div className="flex gap-2">
          {config.showSearch && <div className="flex-1 min-w-0"><SearchBox value={term} onChange={setTerm} placeholder="Client ou n° de commande…" /></div>}
          {config.showAdd && (
            <button onClick={newOrder} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl shrink-0">
              <Plus size={16} /><span className="hidden @md:inline">Nouvelle commande</span><span className="@md:hidden">Nouvelle</span>
            </button>
          )}
        </div>
        {config.showFilters && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CHANNEL_FILTERS.map((c) => (
                <Chip key={c.id} active={channel === c.id} onClick={() => setChannel(c.id)}>
                  {c.logo && <ChannelLogo channel={c.id} size={12} className="inline mr-1.5 -mt-0.5" />}{c.label}
                </Chip>
              ))}
              <span className="w-px bg-purple-100 mx-1 shrink-0" />
              {STATUS_FILTERS.map((s) => <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</Chip>)}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {rows.length} commande{rows.length !== 1 ? 's' : ''}
            {filtersActive && <> · <span className="font-semibold text-gray-700">{money(rows.reduce((s, o) => s + netOf(o), 0))}</span></>}
          </span>
          {filtersActive && (
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"><X size={12} /> Réinitialiser</button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={List}>Aucune commande ne correspond.</EmptyState>
      ) : (
        <>
          <div className="flex items-center gap-3 @md:gap-4 px-4 py-2.5 bg-purple-50/60 border-y border-purple-100 shrink-0">
            <span className="w-9 shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-4">
              <SortHeader label="Client" sortKey="client" sort={sort} onSort={toggleSort} />
              <span className="@md:hidden"><SortHeader label="Date" sortKey="date" firstDir="desc" sort={sort} onSort={toggleSort} /></span>
            </div>
            <div className="hidden @md:block w-28 shrink-0"><SortHeader label="Date" sortKey="date" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
            <div className="hidden @md:block w-36 shrink-0"><SortHeader label="Canal" sortKey="channel" sort={sort} onSort={toggleSort} /></div>
            <div className="@md:w-24 shrink-0 flex justify-end"><SortHeader label="Total" sortKey="total" firstDir="desc" align="right" sort={sort} onSort={toggleSort} /></div>
            <span className="hidden @md:block w-4 shrink-0" />
          </div>
          <ScrollArea className="divide-y divide-purple-50">
            {rows.map((order) => <OrderRow key={order.id} order={order} onClick={() => openOrder(order)} />)}
          </ScrollArea>
        </>
      )}
    </div>
  );
};

defineWidget({
  type: 'orders-table',
  title: 'Liste des commandes',
  description: 'Toutes les commandes avec recherche, filtres par canal et statut, et tri par colonne.',
  icon: List,
  category: 'Ventes',
  bleed: true,
  size: { w: 12, h: 20, minW: 4, minH: 8, maxW: 12, maxH: 40 },
  defaultConfig: { period: 'all', showSearch: true, showFilters: true, showAdd: true },
  schema: [
    periodField(),
    { key: 'showSearch', label: 'Barre de recherche', type: 'toggle' },
    { key: 'showFilters', label: 'Filtres canal et statut', type: 'toggle' },
    { key: 'showAdd', label: 'Bouton « Nouvelle commande »', type: 'toggle' },
  ],
  component: OrdersTableView,
});
