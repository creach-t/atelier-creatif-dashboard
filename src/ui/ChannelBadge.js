import React from 'react';
import { Store, Package, ShoppingBag, Shirt, Tag, Users } from 'lucide-react';
import { SOURCES, getSource } from '../domain/sources';

// Logo Ko-fi : Simple Icons (CC0), dessiné en currentColor pour suivre la couleur du contexte.
const KofiLogo = ({ size = 14, className = '' }) => (
  <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
    <path d="M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298" />
  </svg>
);

// Teintes des sources (clé `color` du registre). Classes écrites en toutes lettres pour que Tailwind les garde ;
// `hex` sert aux graphiques (Recharts), `active` au bouton sélectionné d'un sélecteur de canal.
const TINTS = {
  purple: { badge: 'bg-purple-100 text-purple-800 border-purple-200', tile: 'bg-purple-100 text-purple-700', active: 'bg-purple-50 border-purple-300 text-purple-800', hex: '#a78bfa' },
  pink: { badge: 'bg-pink-100 text-pink-800 border-pink-200', tile: 'bg-pink-100 text-pink-700', active: 'bg-pink-50 border-pink-300 text-pink-800', hex: '#f472b6' },
  orange: { badge: 'bg-orange-100 text-orange-800 border-orange-200', tile: 'bg-orange-100 text-orange-700', active: 'bg-orange-50 border-orange-300 text-orange-800', hex: '#fb923c' },
  teal: { badge: 'bg-teal-100 text-teal-800 border-teal-200', tile: 'bg-teal-100 text-teal-700', active: 'bg-teal-50 border-teal-300 text-teal-800', hex: '#2dd4bf' },
  rose: { badge: 'bg-rose-100 text-rose-800 border-rose-200', tile: 'bg-rose-100 text-rose-700', active: 'bg-rose-50 border-rose-300 text-rose-800', hex: '#fb7185' },
  sky: { badge: 'bg-sky-100 text-sky-800 border-sky-200', tile: 'bg-sky-100 text-sky-700', active: 'bg-sky-50 border-sky-300 text-sky-800', hex: '#38bdf8' },
  emerald: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', tile: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-50 border-emerald-300 text-emerald-800', hex: '#34d399' },
};
const NEUTRAL_TINT = { badge: 'bg-gray-100 text-gray-800 border-gray-200', tile: 'bg-gray-100 text-gray-600', active: 'bg-gray-50 border-gray-300 text-gray-800', hex: '#9ca3af' };

export const channelStyle = (channel) => {
  const source = getSource(channel);
  return (source && TINTS[source.color]) || NEUTRAL_TINT;
};

const ICONS = {
  kofi: KofiLogo,
  store: (p) => <Store size={p.size} className={p.className} />,
  bag: (p) => <ShoppingBag size={p.size} className={p.className} />,
  shirt: (p) => <Shirt size={p.size} className={p.className} />,
  tag: (p) => <Tag size={p.size} className={p.className} />,
  users: (p) => <Users size={p.size} className={p.className} />,
};

// { id: { label, Logo, className } } généré depuis le registre : une source ajoutée apparaît partout sans toucher ici.
export const CHANNELS = Object.fromEntries(
  SOURCES.map((s) => [s.id, { label: s.label, Logo: ICONS[s.icon] || ICONS.tag, className: channelStyle(s.id).badge }])
);

const FallbackLogo = ({ size, className }) => <Package size={size} className={className} />;

export const ChannelLogo = ({ channel, size = 14, className = '' }) => {
  const Logo = (CHANNELS[channel] && CHANNELS[channel].Logo) || FallbackLogo;
  return <Logo size={size} className={className} />;
};

export const ChannelBadge = ({ channel }) => {
  const info = CHANNELS[channel] || { label: channel, className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap max-w-full ${info.className}`}>
      <ChannelLogo channel={channel} size={13} />
      {info.label}
    </span>
  );
};
