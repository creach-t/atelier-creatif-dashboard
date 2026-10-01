import React, { useMemo, useState } from 'react';
import { Plus, X, List } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { OrderRow, ORDER_ROW_H } from '../features/orders/OrderRow';
import { FitList, toolbarBudget } from '../core/widgets/Fit';
import { ChannelLogo } from '../ui/ChannelBadge';
import { SortChip } from '../ui/SortHeader';
import { useSort, sortRows } from '../hooks/useSort';
import { netOf } from '../utils/orderAmounts';
import { money } from '../core/metrics/format';
import { Chip, EmptyState, SearchBox } from '../core/widgets/parts';

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

// Densité selon la hauteur du widget : on retire d'abord les filtres, puis le tri, puis la recherche, pour laisser la place à la liste.
const OrdersTableView = ({ config, size }) => {
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
  // Chaque élément de la barre d'outils n'apparaît que s'il reste de la place pour au moins une commande.
  // Coûts réels en px (marges comprises) : le filtre des canaux/statuts passe sur plusieurs lignes en étroit.
  const narrow = size.width < 520;
  const take = toolbarBudget(size.measured ? size.height : 9999, ORDER_ROW_H.full * 2 + 44) // au moins 2 commandes visibles;
  const showTop = take(20 + 64); // marges du bloc + recherche / bouton
  const showCount = take(36);
  const showSort = take(narrow ? 84 : 44);
  const showFilters = config.showFilters && take(narrow ? 108 : 56);
  const denseRows = size.wTier === 'xs' || size.wTier === 'sm';

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {showTop && (
      <div className="px-4 pt-2 pb-3 space-y-3 shrink-0">
        <div className="flex gap-2">
          {config.showSearch && <div className="flex-1 min-w-0"><SearchBox value={term} onChange={setTerm} placeholder="Client ou n° de commande…" /></div>}
          {config.showAdd && (
            <button onClick={newOrder} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl shrink-0">
              <Plus size={16} /><span className="hidden @md:inline">Nouvelle commande</span><span className="@md:hidden">Nouvelle</span>
            </button>
          )}
        </div>
        {showFilters && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
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
        {showCount && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {rows.length} commande{rows.length !== 1 ? 's' : ''}
            {filtersActive && <> · <span className="font-semibold text-gray-700">{money(rows.reduce((s, o) => s + netOf(o), 0))}</span></>}
          </span>
          {filtersActive && (
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"><X size={12} /> Réinitialiser</button>
          )}
        </div>
        )}
      </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={List}>Aucune commande ne correspond.</EmptyState>
      ) : (
        <>
          {showSort && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mr-1">Trier</span>
            <SortChip label="Date" sortKey="date" firstDir="desc" sort={sort} onSort={toggleSort} />
            <SortChip label="Montant" sortKey="total" firstDir="desc" sort={sort} onSort={toggleSort} />
            <SortChip label="Client" sortKey="client" sort={sort} onSort={toggleSort} />
            <SortChip label="Canal" sortKey="channel" sort={sort} onSort={toggleSort} />
          </div>
          )}
          <FitList
            items={rows}
            rowHeight={denseRows ? ORDER_ROW_H.compact : ORDER_ROW_H.full}
            resetKey={`${channel}|${status}|${term}|${sort.key}|${sort.dir}|${config.period}`}
            renderItem={(order, i) => <OrderRow key={order.id} order={order} index={i} compact={denseRows} onClick={() => openOrder(order)} />}
          />
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
