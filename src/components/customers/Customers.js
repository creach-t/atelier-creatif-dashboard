import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Search, Edit, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CustomerForm } from './CustomerForm';
import { CustomerDetailModal } from './CustomerDetailModal';
import { getCustomerBadges } from '../../utils/customerBadges';

const SORTS = {
  total_desc: { label: 'Total dépensé', fn: (a, b) => (b.total || 0) - (a.total || 0) },
  name: { label: 'Nom (A-Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  count_desc: { label: 'Plus de commandes', fn: (a, b) => (b.count || 0) - (a.count || 0) },
  last_desc: { label: 'Dernière commande', fn: (a, b) => (b.last || '').localeCompare(a.last || '') },
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('total_desc');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const statsByName = useMemo(() => computeStatsByName(orders), [orders]);

  const rows = useMemo(
    () => customers.map((c) => ({ ...c, ...(statsByName[c.name] || { total: 0, count: 0, first: null, last: null }) })),
    [customers, statsByName]
  );

  const filtered = useMemo(() => {
    return rows
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort(SORTS[sortKey].fn);
  }, [rows, searchTerm, sortKey]);

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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-gray-900">Clients</h3>
        <Button onClick={openCreate} className="justify-center">
          <Plus size={16} />
          Nouveau Client
        </Button>
      </div>

      {topSpenders.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 des client·es</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, topSpenders.length * 40)}>
            <BarChart data={topSpenders} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fill: '#4b5563', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(name) => (name.length > 22 ? `${name.slice(0, 22)}…` : name)}
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

      <Card className="p-6">
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
          <select
            className="w-full md:w-auto px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>Trier : {label}</option>
            ))}
          </select>
        </div>
      </Card>

      <p className="text-sm text-gray-500">
        <strong className="text-gray-900">{filtered.length}</strong> client{filtered.length > 1 ? 's' : ''}
        {searchTerm ? ` sur ${rows.length}` : ''}
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Client</th>
                <th className="text-left p-4 font-semibold text-gray-700 hidden md:table-cell">Commandes</th>
                <th className="text-left p-4 font-semibold text-gray-700">Total dépensé</th>
                <th className="text-left p-4 font-semibold text-gray-700 hidden lg:table-cell">Dernière commande</th>
                <th className="text-left p-4 font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const badges = getCustomerBadges(c);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setViewingCustomer(c)}
                    className="border-b border-purple-100 hover:bg-purple-25 cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {badges.map((b) => (
                          <span key={b.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">
                            {b.icon} {b.label}
                          </span>
                        ))}
                      </div>
                      {c.email && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail size={12} />
                          {c.email}
                        </p>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-gray-700">{c.count || 0}</td>
                    <td className="p-4 font-semibold text-gray-900">{Number(c.total || 0).toFixed(2)}€</td>
                    <td className="p-4 hidden lg:table-cell text-sm text-gray-500">{c.last || '—'}</td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                        className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-gray-500">
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
