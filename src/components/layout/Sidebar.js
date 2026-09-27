import React, { useEffect, useState } from 'react';
import { Home, ShoppingCart, Palette, Users, TrendingUp, Settings, LogOut, User, ChevronUp, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import { supabase } from '../../api/supabaseClient';

const menuItems = [
  { id: 'dashboard', label: "Vue d'ensemble", icon: Home },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  { id: 'products', label: 'Produits', icon: Palette },
  { id: 'customers', label: 'Clients', icon: Users },
  { id: 'reports', label: 'Rapports', icon: TrendingUp },
];

export const Sidebar = ({ activeTab, setActiveTab, mobileOpen, onCloseMobile }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setEmail((data && data.user && data.user.email) || '');
        const profile = await apiClient.get('/profile');
        setDisplayName((profile && profile.display_name) || '');
      } catch (err) {
        // silencieux — la sidebar retombe juste sur l'email/le placeholder
      }
    })();
  }, [activeTab]);

  const selectTab = (id) => {
    setActiveTab(id);
    onCloseMobile && onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
        />
      )}
      <div
        className={`w-64 bg-gradient-to-b from-purple-50 to-pink-50 border-r border-purple-100 h-screen
        fixed md:relative top-0 left-0 z-40 transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cashly
            </h1>
            <p className="text-sm text-gray-600 mt-1">Gestion multi-canal</p>
          </div>
          <button onClick={onCloseMobile} className="md:hidden p-2 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => selectTab(item.id)}
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
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
              />
              <div className="relative z-20 bg-white rounded-xl border border-purple-100 shadow-lg mb-2 overflow-hidden">
                <button
                  onClick={() => {
                    selectTab('settings');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                >
                  <Settings size={16} />
                  Réglages
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-20 w-full bg-white rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{displayName || 'Créatrice'}</p>
                <p className="text-sm text-gray-600 truncate">{email}</p>
              </div>
              <ChevronUp size={16} className={`text-gray-400 shrink-0 transition-transform ${menuOpen ? '' : 'rotate-180'}`} />
            </div>
          </button>
        </div>
      </div>
    </>
  );
};
