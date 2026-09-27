import React, { useMemo, useState } from 'react';
import { Search, Package } from 'lucide-react';
import { Card } from '../ui/Card';
import { computeSoldByName } from '../../utils/computeSoldByName';

export const ProductsReportTab = ({ products, orders }) => {
  const [search, setSearch] = useState('');

  const soldByName = useMemo(() => computeSoldByName(orders), [orders]);

  const ranked = useMemo(() => {
    const rows = products.map((p) => ({ ...p, sold: soldByName[p.name] || 0 }));
    // Inclut aussi les articles vendus qui n'ont pas (ou plus) de fiche produit associée.
    const knownNames = new Set(products.map((p) => p.name));
    Object.entries(soldByName).forEach(([name, sold]) => {
      if (!knownNames.has(name)) rows.push({ id: name, name, category: '—', sold, price: 0 });
    });
    return rows.sort((a, b) => b.sold - a.sold);
  }, [products, soldByName]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ranked;
    const q = search.toLowerCase();
    return ranked.filter((p) => p.name.toLowerCase().includes(q));
  }, [ranked, search]);

  const totalUnits = filtered.reduce((s, p) => s + p.sold, 0);
  const maxUnits = Math.max(1, ...filtered.map((p) => p.sold));

  if (ranked.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="font-semibold text-gray-600">Aucun produit vendu pour le moment.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-10 pr-4 py-2.5 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <p className="text-sm text-gray-500 mb-4">
        <strong className="text-gray-900">{filtered.length}</strong> produit{filtered.length > 1 ? 's' : ''} ·{' '}
        <strong className="text-gray-900">{totalUnits}</strong> unité{totalUnits > 1 ? 's' : ''} vendue{totalUnits > 1 ? 's' : ''}
      </p>

      <div className="max-h-[540px] overflow-y-auto divide-y divide-gray-100">
        {filtered.map((p) => (
          <div key={p.id} className="py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{p.category}</span>
                <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-xs">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400" style={{ width: `${(p.sold / maxUnits) * 100}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-gray-900 leading-none">{p.sold}</p>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5">vente{p.sold > 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
