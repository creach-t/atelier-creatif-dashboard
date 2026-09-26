import React from 'react';
import { Bell, Settings } from 'lucide-react';

export const Header = () => (
  <header className="bg-white border-b border-purple-100 px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Gérez votre activité créative</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-600 hover:bg-purple-50 rounded-xl transition-colors">
          <Bell size={20} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full"></div>
        </button>
        <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-xl transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </div>
  </header>
);
