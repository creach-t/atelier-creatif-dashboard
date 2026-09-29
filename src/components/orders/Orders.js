import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { OrderNumber } from '../ui/Badge';
import { ChannelBadge, ChannelLogo } from '../ui/ChannelBadge';
import { OrderForm } from './OrderForm';
import { useSort, sortRows } from '../../hooks/useSort';
import { SortHeader } from '../ui/SortHeader';
import { countOrderItems } from '../../utils/computeProductRevenue';
import { netOf, commissionRateOf } from '../../utils/orderAmounts';

const PERIODS = [
  { id: 'all', label: 'Tout' },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'year', label: 'Cette année' },
];

const CHANNEL_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'kofi', label: 'Ko-fi', logo: true },
  { id: 'reel', label: 'Point de vente', logo: true },
];

const HEAT_WEEKS = 26;
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const matchesPeriod = (order, period) => {
  if (period === 'all' || !order.order_date) return true;
  const orderDate = new Date(order.order_date);
  const now = new Date();
  if (period === 'year') return orderDate.getFullYear() === now.getFullYear();
  const days = period === '7d' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return orderDate >= cutoff;
};

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const money = (n) => `${Number(n || 0).toFixed(2)}€`;

const Avatar = ({ name }) => (
  <div className="w-9 h-9 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shrink-0">
    {(name || '?').charAt(0).toUpperCase()}
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
      active ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50 bg-white'
    }`}
  >
    {children}
  </button>
);

// Couleur continue selon le nb de commandes du jour : un seul violet, vif dès la 1re commande,
// qui fonce jusqu'au record de la période. Jours vides = lavande très claire (pas de gris).
const CELL = 16;
const GAP = 4;
const heatColor = (count, max) => {
  if (count === 0) return 'hsl(265, 70%, 97%)';
  const t = max <= 1 ? 1 : (count - 1) / (max - 1);
  return `hsl(${268 - t * 8}, ${88 - t * 6}%, ${68 - t * 38}%)`;
};

// Calendrier de chaleur : 26 semaines (lundi -> dimanche), une case par jour.
const OrdersHeatmap = ({ orders, selectedDay, onSelectDay }) => {
  const scrollRef = useRef(null);

  const { weeks, monthLabels, max, total, activeDays, best } = useMemo(() => {
    const counts = {};
    orders.forEach((o) => { if (o.order_date) counts[o.order_date] = (counts[o.order_date] || 0) + 1; });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - (HEAT_WEEKS - 1) * 7);

    const weekList = [];
    const labels = [];
    let maxCount = 0;
    let sum = 0;
    let active = 0;
    let bestDay = null;
    for (let w = 0; w < HEAT_WEEKS; w += 1) {
      const days = [];
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = dateKey(date);
        const future = date > today;
        const count = future ? 0 : counts[key] || 0;
        if (count > maxCount) { maxCount = count; bestDay = key; }
        sum += count;
        if (count > 0) active += 1;
        days.push({ key, date, count, future });
      }
      const prevMonth = w > 0 ? weekList[w - 1][0].date.getMonth() : -1;
      labels.push(days[0].date.getMonth() !== prevMonth ? MONTHS_FR[days[0].date.getMonth()] : '');
      weekList.push(days);
    }
    return { weeks: weekList, monthLabels: labels, max: maxCount, total: sum, activeDays: active, best: bestDay };
  }, [orders]);

  // Le plus récent est à droite : on ouvre le calendrier calé à droite sur mobile.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, []);

  const plural = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`;

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-white to-purple-25">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Activité · {HEAT_WEEKS} dernières semaines</h4>
          <p className="text-xs text-gray-500 mt-0.5">Plus la case est foncée, plus il y a eu de commandes ce jour-là</p>
        </div>
        <div className="flex gap-5">
          <div>
            <p className="text-xl font-bold text-purple-700 leading-none">{total}</p>
            <p className="text-[11px] text-gray-500 mt-1">commande{total !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-purple-700 leading-none">{activeDays}</p>
            <p className="text-[11px] text-gray-500 mt-1">jour{activeDays !== 1 ? 's' : ''} actif{activeDays !== 1 ? 's' : ''}</p>
          </div>
          {best && (
            <div>
              <p className="text-xl font-bold text-purple-700 leading-none">{max}</p>
              <p className="text-[11px] text-gray-500 mt-1">record · {formatDate(best)}</p>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="inline-flex" style={{ gap: GAP }}>
          <div className="flex flex-col mr-1 pt-[18px] text-[10px] text-gray-400" style={{ gap: GAP }}>
            {['Lun', '', 'Mer', '', 'Ven', '', ''].map((l, i) => (
              <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>{l}</span>
            ))}
          </div>
          {weeks.map((days, w) => (
            <div key={w} className="flex flex-col" style={{ gap: GAP }}>
              <span className="h-[14px] text-[10px] leading-[14px] text-gray-400 whitespace-nowrap">{monthLabels[w]}</span>
              {days.map((day) => {
                const isBest = day.count > 0 && day.count === max && max > 1;
                return (
                  <button
                    key={day.key}
                    disabled={day.future || day.count === 0}
                    onClick={() => onSelectDay(selectedDay === day.key ? null : day.key)}
                    title={`${formatDate(day.key)} : ${plural(day.count, 'commande')}`}
                    aria-label={`${formatDate(day.key)} : ${plural(day.count, 'commande')}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      background: day.future ? 'transparent' : heatColor(day.count, max),
                      boxShadow: isBest ? '0 0 8px 1px hsla(262, 80%, 45%, 0.55)' : undefined,
                    }}
                    className={`rounded-[5px] transition-transform ${
                      selectedDay === day.key ? 'ring-2 ring-pink-500 ring-offset-1 scale-110' : ''
                    } ${day.count > 0 ? 'hover:scale-125 hover:z-10 relative' : 'cursor-default'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-gray-400">
        1
        <span
          className="h-[10px] w-24 rounded-full"
          style={{ background: `linear-gradient(to right, ${heatColor(1, 2)}, ${heatColor(2, 2)})` }}
        />
        {max > 1 ? max : 'plus'}
      </div>
    </Card>
  );
};

const NetAmount = ({ order }) => (
  <>
    <p className="font-bold text-gray-900 whitespace-nowrap">{money(netOf(order))}</p>
    {commissionRateOf(order) > 0 && (
      <p className="text-[10px] text-gray-400 leading-tight whitespace-nowrap" title="Net après commission de la boutique">
        −{commissionRateOf(order)} %<span className="hidden sm:inline"> commission</span>
      </p>
    )}
  </>
);

export const Orders = ({
  orders,
  products,
  customers,
  createOrder,
  createProduct,
  onViewOrder,
}) => {
  const [channelFilter, setChannelFilter] = useState('all');
  const [period, setPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sort, toggleSort] = useSort('date', 'desc');

  // Canal + recherche : alimente le calendrier, qui reste lisible même quand on filtre sur un jour.
  const channelOrders = useMemo(() => orders.filter((order) => {
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(term) || order.id.toLowerCase().includes(term);
    return matchesChannel && matchesSearch;
  }), [orders, channelFilter, searchTerm]);

  const filteredOrders = useMemo(
    () => sortRows(
      channelOrders.filter((o) => matchesPeriod(o, period) && (!dayFilter || o.order_date === dayFilter)),
      sort,
      {
        client: (o) => o.customer_name,
        date: (o) => o.order_date,
        channel: (o) => o.channel,
        total: (o) => netOf(o),
      }
    ),
    [channelOrders, period, dayFilter, sort]
  );

  const filtersActive = channelFilter !== 'all' || period !== 'all' || searchTerm !== '' || dayFilter !== null;

  const resetFilters = () => {
    setChannelFilter('all');
    setPeriod('all');
    setSearchTerm('');
    setDayFilter(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="justify-center">
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvelle commande</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </div>

      <OrdersHeatmap orders={channelOrders} selectedDay={dayFilter} onSelectDay={setDayFilter} />

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Client ou n° de commande..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-wrap gap-1.5">
            {CHANNEL_FILTERS.map((c) => (
              <Chip key={c.id} active={channelFilter === c.id} onClick={() => setChannelFilter(c.id)}>
                {c.logo && <ChannelLogo channel={c.id} size={12} className="inline mr-1.5 -mt-0.5" />}{c.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <Chip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>{p.label}</Chip>
            ))}
          </div>
          {dayFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-50 border border-pink-200 text-pink-700">
              {formatDate(dayFilter)}
              <button onClick={() => setDayFilter(null)} aria-label="Retirer le filtre de jour"><X size={12} /></button>
            </span>
          )}
          {filtersActive && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline">
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
        {filtersActive && <> · <span className="font-semibold text-gray-700">{money(filteredOrders.reduce((s, o) => s + netOf(o), 0))}</span></>}
      </p>

      {/* Une seule liste, une ligne par commande, à toutes les tailles d'écran. Le tri se fait en cliquant les en-têtes. */}
      {filteredOrders.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 sm:gap-4 px-4 py-2.5 bg-purple-50/60 border-b border-purple-100">
            <span className="w-9 shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-4">
              <SortHeader label="Client" sortKey="client" sort={sort} onSort={toggleSort} />
              {/* Étroit : la date se trie depuis ici, sa colonne dédiée n'existe qu'à partir de sm */}
              <span className="sm:hidden"><SortHeader label="Date" sortKey="date" firstDir="desc" sort={sort} onSort={toggleSort} /></span>
            </div>
            <div className="hidden sm:block w-28 shrink-0">
              <SortHeader label="Date" sortKey="date" firstDir="desc" sort={sort} onSort={toggleSort} />
            </div>
            <div className="hidden sm:block w-36 shrink-0">
              <SortHeader label="Canal" sortKey="channel" sort={sort} onSort={toggleSort} />
            </div>
            <div className="sm:w-24 shrink-0 flex justify-end">
              <SortHeader label="Total" sortKey="total" firstDir="desc" align="right" sort={sort} onSort={toggleSort} />
            </div>
            <span className="hidden sm:block w-4 shrink-0" />
          </div>
          <div className="divide-y divide-purple-50">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onViewOrder(order)}
                className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3.5 text-left hover:bg-purple-25 transition-colors"
              >
                <Avatar name={order.customer_name} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 break-words">{order.customer_name || 'Anonyme'}</p>
                  <p className="text-xs text-gray-500">
                    <span className="sm:hidden">{formatDateShort(order.order_date)} · </span>
                    <OrderNumber order={order} /> · {countOrderItems(order)} article{countOrderItems(order) > 1 ? 's' : ''}
                  </p>
                  {/* Étroit : canal et montant sous le nom, qui garde ainsi toute la largeur */}
                  <div className="mt-1.5 flex items-end justify-between gap-2 sm:hidden">
                    <ChannelBadge channel={order.channel} />
                    <div className="text-right"><NetAmount order={order} /></div>
                  </div>
                </div>
                <p className="hidden sm:block w-28 shrink-0 text-sm text-gray-500">{formatDate(order.order_date)}</p>
                <div className="hidden sm:block w-36 shrink-0">
                  <ChannelBadge channel={order.channel} />
                </div>
                <div className="hidden sm:block shrink-0 w-24 text-right">
                  <NetAmount order={order} />
                </div>
                <ChevronRight size={16} className="hidden sm:block text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {filteredOrders.length === 0 && (
        <Card className="p-5 sm:p-8 text-center">
          <p className="text-sm text-gray-500">Aucune commande ne correspond à ces filtres.</p>
          {filtersActive && (
            <button onClick={resetFilters} className="mt-2 text-sm font-semibold text-purple-600 hover:underline">
              Réinitialiser les filtres
            </button>
          )}
        </Card>
      )}

      {showForm && (
        <OrderForm
          products={products}
          customers={customers}
          createProduct={createProduct}
          onCreate={createOrder}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
