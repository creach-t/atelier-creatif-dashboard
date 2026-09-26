import React from 'react';
import { Home, ShoppingCart, Palette, Truck, TrendingUp, User } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  { id: 'products', label: 'Produits', icon: Palette },
  { id: 'shipping', label: 'Expéditions', icon: Truck },
  { id: 'reports', label: 'Rapports', icon: TrendingUp },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-gradient-to-b from-purple-50 to-pink-50 border-r border-purple-100 h-screen relative">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Atelier Créatif
        </h1>
        <p className="text-sm text-gray-600 mt-1">Gestion multi-canal</p>
      </div>

      <nav className="mt-6 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 mb-2 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-white shadow-sm text-purple-700 border border-purple-100'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Artiste</p>
              <p className="text-sm text-gray-600">Créatrice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
