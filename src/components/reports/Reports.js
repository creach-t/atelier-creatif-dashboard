import React, { useMemo, useState } from 'react';
import { Layers, Crown, Package } from 'lucide-react';
import { Card } from '../ui/Card';
import { computeReportStats } from '../../utils/computeReportStats';
import { OverviewTab } from './OverviewTab';
import { CustomersTab } from './CustomersTab';
import { ProductsReportTab } from './ProductsReportTab';
import { CustomerDetailModal } from '../customers/CustomerDetailModal';

const TABS = [
  { id: 'overview', label: 'Aperçu', icon: Layers },
  { id: 'customers', label: 'Clients', icon: Crown },
  { id: 'products', label: 'Produits', icon: Package },
];

export const Reports = ({ orders, products, customers, onViewOrder, onViewProduct, onNavigateToCustomer }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [yearFilter, setYearFilter] = useState('all');
  const [viewingCustomerName, setViewingCustomerName] = useState(null);

  const years = useMemo(
    () => [...new Set(orders.map((o) => (o.order_date || '').slice(0, 4)).filter(Boolean))].sort().reverse(),
    [orders]
  );

  const filteredOrders = useMemo(
    () => (yearFilter === 'all' ? orders : orders.filter((o) => (o.order_date || '').startsWith(yearFilter))),
    [orders, yearFilter]
  );

  const stats = useMemo(() => computeReportStats(filteredOrders), [filteredOrders]);

  // "Depuis" doit rester une date de première commande globale (identité du client), pas
  // dépendre du filtre d'année affiché — sinon changer l'année ferait "reculer" cette date.
  const firstOrderByName = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!o.customer_name || !o.order_date) return;
      if (!map[o.customer_name] || o.order_date < map[o.customer_name]) map[o.customer_name] = o.order_date;
    });
    return map;
  }, [orders]);

  const viewingCustomerStats = viewingCustomerName ? stats.customers.find((c) => c.name === viewingCustomerName) : null;
  const viewingCustomerRecord = viewingCustomerName ? (customers || []).find((c) => c.name === viewingCustomerName) : null;
  const viewingCustomer =
    viewingCustomerRecord && viewingCustomerStats
      ? {
          ...viewingCustomerRecord,
          total: viewingCustomerStats.total,
          count: viewingCustomerStats.count,
          first: firstOrderByName[viewingCustomerName],
          last: viewingCustomerStats.last,
        }
      : null;

  if (orders.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="p-4 sm:p-6 sm:p-12 text-center">
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
    <div className="p-4 sm:p-6 space-y-6">
      {years.length > 1 && (
        <div className="flex justify-end">
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
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryItems.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
            <p className={`text-lg font-black mt-1 ${item.color}`}>{item.value}</p>
            {item.sub && <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="flex gap-1 sm:gap-2 border-b border-purple-100 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
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
      {activeTab === 'customers' && (
        <CustomersTab stats={stats} firstOrderByName={firstOrderByName} onSelectCustomer={setViewingCustomerName} />
      )}
      {activeTab === 'products' && (
        <ProductsReportTab products={products} orders={filteredOrders} onSelectProduct={onViewProduct} />
      )}

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          orders={orders.filter((o) => o.customer_name === viewingCustomer.name)}
          onSelectOrder={(order) => {
            setViewingCustomerName(null);
            onViewOrder(order);
          }}
          onEdit={() => {
            setViewingCustomerName(null);
            onNavigateToCustomer(viewingCustomerName);
          }}
          onClose={() => setViewingCustomerName(null)}
        />
      )}
    </div>
  );
};
