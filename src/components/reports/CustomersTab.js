import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '../ui/Card';
import { getInitials, getCustomerBadges } from '../../utils/customerBadges';

const rankIcon = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null);

export const CustomersTab = ({ stats, firstOrderByName, onSelectCustomer }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return stats.customers;
    const q = search.toLowerCase();
    return stats.customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [stats.customers, search]);

  const maxTotal = stats.customers[0]?.total || 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.uniqueCustomers}</p>
          <p className="text-xs text-gray-500 mt-1">Clients uniques</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-pink-500">{stats.customers.filter((c) => c.count >= 2).length}</p>
          <p className="text-xs text-gray-500 mt-1">Revenu(e)s (2+ fois)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{stats.customers.filter((c) => c.total >= 50).length}</p>
          <p className="text-xs text-gray-500 mt-1">Généreux·ses (50€+)</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2.5 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-8">Aucun résultat.</p>}
          {filtered.map((c) => {
            const globalRank = stats.customers.indexOf(c);
            const badges = getCustomerBadges(c);
            const rank = rankIcon(globalRank);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => onSelectCustomer && onSelectCustomer(c.name)}
                className="w-full flex items-center gap-4 py-4 text-left hover:bg-purple-25 transition-colors -mx-2 px-2 rounded-lg"
              >
                <div className="w-8 text-center shrink-0">
                  {rank ? <span className="text-lg">{rank}</span> : <span className="text-sm font-bold text-gray-400">#{globalRank + 1}</span>}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-900 truncate">{c.name}</span>
                    {badges.map((b) => (
                      <span key={b.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {b.icon} {b.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {c.count} commande{c.count > 1 ? 's' : ''} · depuis {(firstOrderByName && firstOrderByName[c.name]) || c.first}
                  </p>
                  <div className="mt-2 w-full h-1 rounded-full bg-gray-100 overflow-hidden max-w-xs">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400" style={{ width: `${(c.total / maxTotal) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-gray-900">{c.total.toFixed(2)}€</p>
                  {c.count > 1 && <p className="text-xs text-gray-500">moy. {(c.total / c.count).toFixed(2)}€</p>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
