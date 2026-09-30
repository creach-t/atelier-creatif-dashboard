import React from 'react';
import { Package, Download } from 'lucide-react';
import { ProductCover } from '../ui/ProductThumbnail';
import { GroupPrice } from '../ui/PriceTag';
import { groupKind, KIND_LABELS } from '../../utils/productVariants';

const KindBadge = ({ kind }) => (
  <span
    title={KIND_LABELS[kind]}
    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/90 text-gray-700 shadow-sm"
  >
    {(kind === 'physical' || kind === 'both') && <Package size={11} />}
    {(kind === 'digital' || kind === 'both') && <Download size={11} />}
    {kind !== 'both' && KIND_LABELS[kind]}
  </span>
);

// Hauteur du bloc texte (la pagination de la grille en déduit la hauteur d'une carte : image carrée + ce bloc).
export const PRODUCT_CARD_INFO_H = 120;

// Carte produit unique de l'app (catalogue, Top 5, vue d'ensemble) : photo carrée en haut, puis nom,
// prix et ventes. rank = médaille de classement ; emphasis="revenue" met le revenu en avant.
export const ProductCard = ({ group, sold, revenue, onClick, rank, emphasis = 'sold' }) => {
  const kind = groupKind(group);
  const soldText = sold > 0 ? `${sold} vendu${sold > 1 ? 's' : ''}` : 'Aucune vente';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden hover:shadow-md hover:border-purple-200 transition"
    >
      <div className="relative">
        <ProductCover image={group.image} />
        {group.isFamily && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/90 text-purple-700 shadow-sm">
            {group.variants.length} variantes
          </span>
        )}
        {rank && (
          <span
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow ${
              rank === 1 ? 'bg-amber-400 text-amber-950' : 'bg-white/90 text-purple-700'
            }`}
          >
            {rank}
          </span>
        )}
        {kind && (
          <div className="absolute bottom-2 left-2">
            <KindBadge kind={kind} />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5 overflow-hidden" style={{ height: PRODUCT_CARD_INFO_H }}>
        <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-3 @md:line-clamp-2 min-h-[2.5rem]">{group.name}</h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <GroupPrice group={group} compact />
        </div>
        {emphasis === 'revenue' ? (
          <p className="text-xs text-gray-500">
            <span className="text-sm font-bold text-purple-700">{Number(revenue || 0).toFixed(2)}€</span> · {soldText}
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            {soldText}{sold > 0 && revenue > 0 && ` · ${Number(revenue).toFixed(2)}€`}
          </p>
        )}
      </div>
    </button>
  );
};
