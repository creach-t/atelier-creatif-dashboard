import React from 'react';
import { Card } from '../ui/Card';
import { ProductCover } from '../ui/ProductThumbnail';

const money = (n) => `${Number(n || 0).toFixed(2)}€`;

// Une couleur par rang, réutilisée dans la frise, les pastilles et les barres : on lit le classement d'un coup d'œil.
const RANK_COLORS = [
  { dot: 'bg-amber-400 text-amber-950', bar: 'bg-amber-400', seg: 'bg-amber-400' },
  { dot: 'bg-purple-600 text-white', bar: 'bg-purple-600', seg: 'bg-purple-600' },
  { dot: 'bg-purple-500 text-white', bar: 'bg-purple-500', seg: 'bg-purple-500' },
  { dot: 'bg-purple-400 text-white', bar: 'bg-purple-400', seg: 'bg-purple-400' },
  { dot: 'bg-purple-300 text-white', bar: 'bg-purple-300', seg: 'bg-purple-300' },
];

// Classement compact des produits les plus rentables : une carte, une ligne par produit (rang, miniature,
// nom, barre proportionnelle au n°1, revenu), et une frise fine de la part du revenu total en tête.
// items : [{ group, sold, revenue }] déjà triés ; totalRevenue : revenu de tous les produits.
export const TopProducts = ({ items, totalRevenue, onView }) => {
  if (items.length === 0) return null;
  const max = items[0].revenue || 1;
  const topSum = items.reduce((s, t) => s + t.revenue, 0);
  const share = (n) => (totalRevenue > 0 ? (n / totalRevenue) * 100 : 0);

  return (
    <Card className="overflow-hidden">
      {totalRevenue > 0 && (
        <div className="px-4 pt-3 pb-2.5 border-b border-purple-50">
          <p className="text-xs text-gray-500 mb-1.5">
            Ces {items.length} produits = <span className="font-bold text-gray-900">{share(topSum).toFixed(0)} %</span> du revenu des produits
          </p>
          <div className="flex h-2 rounded-full overflow-hidden bg-purple-50 gap-[2px]">
            {items.map((t, i) => (
              <div key={t.group.key} className={RANK_COLORS[i].seg} style={{ width: `${share(t.revenue)}%` }} />
            ))}
          </div>
        </div>
      )}

      <ul className="divide-y divide-purple-50">
        {items.map((t, i) => (
          <li key={t.group.key}>
            <button
              type="button"
              onClick={() => onView(t.group.variants[0].product.name)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-purple-25 transition-colors"
            >
              <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${RANK_COLORS[i].dot}`}>
                {i + 1}
              </span>
              <div className="w-9 shrink-0">
                <ProductCover image={t.group.image} rounded="rounded-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{t.group.name}</p>
                <div className="h-1 bg-purple-50 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${RANK_COLORS[i].bar}`} style={{ width: `${(t.revenue / max) * 100}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{money(t.revenue)}</p>
                <p className="text-[11px] text-gray-400">{t.sold} vendu{t.sold > 1 ? 's' : ''}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
};
