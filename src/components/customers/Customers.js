import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Search, Edit, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CustomerForm } from './CustomerForm';
import { CustomerDetailModal } from './CustomerDetailModal';
import { getCustomerBadges, getInitials } from '../../utils/customerBadges';
import { useIsNarrow } from '../../hooks/useIsNarrow';
import { useSort, sortRows } from '../../hooks/useSort';
import { SortHeader } from '../ui/SortHeader';

const computeStatsByName = (orders) => {
  const map = {};
  (orders || []).forEach((o) => {
    const name = o.customer_name;
    if (!name) return;
    if (!map[name]) map[name] = { total: 0, count: 0, first: o.order_date, last: o.order_date };
    map[name].total += Number(o.total || 0);
    map[name].count += 1;
    if (o.order_date && o.order_date < map[name].first) map[name].first = o.order_date;
    if (o.order_date && o.order_date > map[name].last) map[name].last = o.order_date;
  });
  return map;
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg text-sm border border-purple-100 bg-white max-w-[220px]">
      <p className="text-xs font-semibold text-gray-500 truncate">{p.payload.name}</p>
      <p className="font-bold text-purple-600">{Number(p.value).toFixed(2)}€</p>
    </div>
  );
};

export const Customers = ({
  customers,
  orders,
  createCustomer,
  updateCustomer,
  onSelectOrder,
  selectedCustomerName,
  onClearSelectedCustomer,
}) => {
  const narrow = useIsNarrow();
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, toggleSort] = useSort('total', 'desc');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const statsByName = useMemo(() => computeStatsByName(orders), [orders]);

  const rows = useMemo(
    () => customers.map((c) => ({ ...c, ...(statsByName[c.name] || { total: 0, count: 0, first: null, last: null }) })),
    [customers, statsByName]
  );

  const filtered = useMemo(() => {
    return sortRows(
      rows.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
      sort,
      { name: (c) => c.name, count: (c) => c.count || 0, total: (c) => c.total || 0, last: (c) => c.last }
    );
  }, [rows, searchTerm, sort]);

  const topSpenders = useMemo(
    () =>
      [...rows]
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map((c) => ({ name: c.name, total: c.total }))
        .reverse(),
    [rows]
  );

  const openCreate = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const openEdit = (customer) => {
    setViewingCustomer(null);
    setEditingCustomer(customer);
    setShowForm(true);
  };

  // Ouvre la fiche d'un client sélectionné depuis Rapports > Clients.
  useEffect(() => {
    if (!selectedCustomerName) return;
    const match = rows.find((c) => c.name === selectedCustomerName);
    if (match) setViewingCustomer(match);
    onClearSelectedCustomer && onClearSelectedCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerName, rows]);

  const handleSave = async (payload) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, payload);
    } else {
      await createCustomer(payload);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="justify-center">
          <Plus size={16} />
          Nouveau Client
        </Button>
      </div>

      {topSpenders.length > 0 && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 des client·es</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, topSpenders.length * 40)}>
            <BarChart data={topSpenders} layout="vertical" margin={{ top: 0, right: narrow ? 8 : 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} tickCount={narrow ? 3 : 5} />
              <YAxis
                type="category"
                dataKey="name"
                width={narrow ? 84 : 160}
                tick={{ fill: '#4b5563', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(name) => { const max = narrow ? 11 : 22; return name.length > max ? `${name.slice(0, max)}…` : name; }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3e8ff' }} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {topSpenders.map((_, i) => (
                  <Cell key={i} fill={i === topSpenders.length - 1 ? '#fbbf24' : '#c4b5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <p className="text-sm text-gray-500">
        <strong className="text-gray-900">{filtered.length}</strong> client{filtered.length > 1 ? 's' : ''}
        {searchTerm ? ` sur ${rows.length}` : ''}
      </p>

      {/* Une liste (et non un tableau) : à 320 px un tableau force un défilement horizontal qui cache le total. */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-2.5 bg-purple-50/60 border-b border-purple-100">
          <span className="w-9 shrink-0" />
          <div className="flex-1 min-w-0"><SortHeader label="Client" sortKey="name" sort={sort} onSort={toggleSort} /></div>
          <div className="hidden md:block w-24 shrink-0"><SortHeader label="Commandes" sortKey="count" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
          <div className="sm:w-28 shrink-0 flex justify-end sm:justify-start"><SortHeader label="Total" sortKey="total" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
          <div className="hidden lg:block w-36 shrink-0"><SortHeader label="Dernière commande" sortKey="last" firstDir="desc" sort={sort} onSort={toggleSort} /></div>
          <span className="w-8 shrink-0" />
        </div>
        <div className="divide-y divide-purple-50">
          {filtered.map((c) => {
            const badges = getCustomerBadges(c);
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewingCustomer(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewingCustomer(c); } }}
                className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-purple-25 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 break-words">{c.name}</p>
                  <p className="sm:hidden text-sm font-semibold text-gray-900 mt-0.5">{Number(c.total || 0).toFixed(2)}€ <span className="text-xs font-normal text-gray-400">· {c.count || 0} commande{(c.count || 0) > 1 ? 's' : ''}</span></p>
                  {badges.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {badges.map((b) => (
                        <span key={b.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.email && (
                    <p className="text-xs text-gray-500 flex items-start gap-1 mt-1 min-w-0">
                      <Mail size={12} className="shrink-0 mt-0.5" />
                      <span className="break-all">{c.email}</span>
                    </p>
                  )}
                  <p className="hidden sm:block text-xs text-gray-400 mt-1 md:hidden">{c.count || 0} commande{(c.count || 0) > 1 ? 's' : ''}</p>
                </div>
                <p className="hidden md:block w-24 shrink-0 text-sm text-gray-700">{c.count || 0}</p>
                <p className="hidden sm:block sm:w-28 shrink-0 font-semibold text-gray-900 whitespace-nowrap">{Number(c.total || 0).toFixed(2)}€</p>
                <p className="hidden lg:block w-36 shrink-0 text-sm text-gray-500">{c.last || '—'}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                  aria-label={`Modifier ${c.name}`}
                  className="p-2 -mr-2 text-gray-600 hover:bg-purple-50 rounded-lg shrink-0"
                >
                  <Edit size={16} />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Aucun client trouvé.</p>}
        </div>
      </Card>

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          orders={orders.filter((o) => o.customer_name === viewingCustomer.name)}
          onSelectOrder={(order) => {
            setViewingCustomer(null);
            onSelectOrder && onSelectOrder(order);
          }}
          onEdit={() => openEdit(viewingCustomer)}
          onClose={() => setViewingCustomer(null)}
        />
      )}

      {showForm && (
        <CustomerForm customer={editingCustomer} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};
