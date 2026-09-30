import React from 'react';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { tintColor } from '../config/ConfigForm';

// Petites briques d'interface partagées par les widgets.

// Zone de graphique : occupe tout l'espace restant du widget, quelle que soit sa taille (Recharts a besoin
// d'un parent à dimensions définies, d'où le conteneur absolu).
export const ChartBox = ({ children, className = '' }) => (
  <div className={`relative flex-1 min-h-0 ${className}`}>
    <div className="absolute inset-0">{children}</div>
  </div>
);

export const ChartTooltip = ({ active, payload, label, format = (n) => `${Number(n).toFixed(2)}€` }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-lg text-sm border border-purple-100 bg-white">
      {label && <p className="text-xs mb-0.5 font-semibold text-gray-500">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} style={{ color: p.color || p.fill || p.stroke }} className="font-bold">
          {p.name && p.name !== 'value' ? `${p.name} : ` : ''}{format(p.value)}
        </p>
      ))}
    </div>
  );
};

export const Variation = ({ value, label }) => {
  if (value === null || value === undefined) return label ? <span className="text-[11px] text-gray-400">{label}</span> : null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
      <Icon size={12} />
      {up ? '+' : ''}{value.toFixed(0)} %
    </span>
  );
};

export const EmptyState = ({ icon: Icon, children }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-sm text-gray-500 py-6 px-4">
    {Icon && <Icon size={22} className="text-purple-300" />}
    <p>{children}</p>
  </div>
);

export const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
      active ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50 bg-white'
    }`}
  >
    {children}
  </button>
);

export const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
    />
  </div>
);

// Icône de tuile teintée (pastille arrondie).
export const TintTile = ({ tint = 'purple', children, size = 'w-10 h-10' }) => (
  <span
    className={`${size} rounded-xl flex items-center justify-center shrink-0`}
    style={{ background: `${tintColor(tint)}26`, color: tintColor(tint) }}
  >
    {children}
  </span>
);

// Zone défilante d'un widget (liste longue) : le défilement reste dans le widget, sans piéger le doigt à la fin.
export const ScrollArea = ({ children, className = '' }) => (
  <div className={`flex-1 min-h-0 overflow-y-auto scroll-soft ${className}`} style={{ overscrollBehavior: 'auto' }}>{children}</div>
);
