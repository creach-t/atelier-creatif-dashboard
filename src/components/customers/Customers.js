import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CustomerForm } from './CustomerForm';

const computeStatsByName = (orders) => {
  const map = {};
  (orders || []).forEach((o) => {
    const name = o.customer_name;
    if (!name) return;
    if (!map[name]) map[name] = { total: 0, count: 0, last: o.order_date };
    map[name].total += Number(o.total || 0);
    map[name].count += 1;
    if (o.order_date && o.order_date > map[name].last) map[name].last = o.order_date;
  });
  return map;
};

export const Customers = ({ customers, orders, createCustomer, updateCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const statsByName = useMemo(() => computeStatsByName(orders), [orders]);

  const rows = useMemo(
    () =>
      customers
        .map((c) => ({ ...c, ...(statsByName[c.name] || { total: 0, count: 0, last: null }) }))
        .sort((a, b) => b.total - a.total),
    [customers, statsByName]
  );

  const filtered = rows.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

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

      <Card className="p-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

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
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-purple-100 hover:bg-purple-25">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{c.name}</p>
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
                    <button onClick={() => openEdit(c)} className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
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

      {showForm && (
        <CustomerForm customer={editingCustomer} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};
