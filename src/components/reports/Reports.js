import React, { useMemo, useState } from 'react';
import { Layers, Crown, Package } from 'lucide-react';
import { Card } from '../ui/Card';
import { computeReportStats } from '../../utils/computeReportStats';
import { OverviewTab } from './OverviewTab';
import { CustomersTab } from './CustomersTab';
import { ProductsReportTab } from './ProductsReportTab';

const TABS = [
  { id: 'overview', label: 'Aperçu', icon: Layers },
  { id: 'customers', label: 'Clients', icon: Crown },
  { id: 'products', label: 'Produits', icon: Package },
];

export const Reports = ({ orders, products, onNavigateToProduct, onNavigateToCustomer }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [yearFilter, setYearFilter] = useState('all');

  const years = useMemo(
    () => [...new Set(orders.map((o) => (o.order_date || '').slice(0, 4)).filter(Boolean))].sort().reverse(),
    [orders]
  );

  const filteredOrders = useMemo(
    () => (yearFilter === 'all' ? orders : orders.filter((o) => (o.order_date || '').startsWith(yearFilter))),
    [orders, yearFilter]
  );

  const stats = useMemo(() => computeReportStats(filteredOrders), [filteredOrders]);

  if (orders.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Rapports et Analyses</h3>
        <Card className="p-12 text-center">
          <Layers size={40} className="mx-auto text-purple-300 mb-4" />
          <p className="text-gray-600">Pas encore de commandes à analyser.</p>
        </Card>
      </div>
    );
  }

  const summaryItems = [
    { label: 'Récolté', value: `${stats.total.toFixed(2)}€`, color: 'text-pink-500' },
    { label: 'Commandes', value: stats.count, color: 'text-purple-600' },
    { label: 'Clients', value: stats.uniqueCustomers, color: 'text-amber-500' },
    { label: 'Panier moyen', value: `${stats.avgOrderValue.toFixed(2)}€`, color: 'text-emerald-500' },
    {
      label: 'Meilleur mois',
      value: stats.bestMonth ? stats.bestMonth.fullName : '—',
      sub: stats.bestMonth ? `${stats.bestMonth.montant.toFixed(2)}€` : '',
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-gray-900">Rapports et Analyses</h3>
        {years.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {['all', ...years].map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  yearFilter === y ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {y === 'all' ? 'Tout' : y}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryItems.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
            <p className={`text-lg font-black mt-1 ${item.color}`}>{item.value}</p>
            {item.sub && <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-purple-100 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                active ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab stats={stats} orders={filteredOrders} />}
      {activeTab === 'customers' && <CustomersTab stats={stats} onNavigateToCustomer={onNavigateToCustomer} />}
      {activeTab === 'products' && (
        <ProductsReportTab products={products} orders={filteredOrders} onNavigateToProduct={onNavigateToProduct} />
      )}
    </div>
  );
};
