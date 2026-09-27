import React from 'react';
import { Menu } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

const TITLES = {
  dashboard: "Vue d'ensemble",
  orders: 'Commandes',
  products: 'Produits',
  customers: 'Clients',
  reports: 'Rapports',
  settings: 'Réglages',
};

export const Header = ({ orders, onSelectOrder, onOpenMenu, activeTab }) => {
  const title = TITLES[activeTab] || TITLES.dashboard;
  return (
    <header className="bg-white border-b border-purple-100 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onOpenMenu} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-purple-50 rounded-xl shrink-0">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h2>
            <p className="text-gray-600 mt-1 text-sm hidden sm:block">Gérez votre activité créative</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <NotificationBell orders={orders} onSelectOrder={onSelectOrder} />
        </div>
      </div>
    </header>
  );
};
