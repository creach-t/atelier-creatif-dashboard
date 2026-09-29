import React from 'react';
import { Sparkles } from 'lucide-react';
import { priceRange } from '../../utils/productVariants';

// Un prix saisi à la main (ou lu sur une commande) est affiché en texte plein. Un prix deviné à partir
// des commandes est toujours reconnaissable : pastille en pointillés + icône, jamais du texte plein.
//   - saisi        : 4.00€                      (violet, plein)
//   - estimé       : [✨ ≈ 4.00€ estimé]        (pastille bleue en pointillés)
//   - à confirmer  : [≈ 4.00€ ? à confirmer]    (pastille grise en pointillés, estimation faible)
//   - gratuit      : Gratuit                    (0 € confirmé par les commandes)
//   - inconnu      : Prix à définir
export const priceState = (product) => {
  const price = Number(product.price);
  if (product.is_free) return 'freeManual';
  if (price > 0 && !product.price_estimated) return 'manual';
  if (product.price_estimated && price > 0) return 'estimated';
  if (product.price_estimated && price === 0) return 'free';
  if (Number(product.price_guess) > 0) return 'guess';
  return 'unknown';
};

export const PriceTag = ({ product, large = false, compact = false }) => {
  const state = priceState(product);
  const size = large ? 'text-lg' : 'text-base';

  if (state === 'manual') {
    return <span className={`${size} font-bold text-purple-600`}>{Number(product.price).toFixed(2)}€</span>;
  }
  if (state === 'estimated') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-dashed border-sky-300 bg-sky-50 text-sky-700"
        title={`Prix moyen pondéré, deviné à partir de ${product.price_support || 'vos'} commandes`}
      >
        <Sparkles size={12} />
        <span className={`${size} font-bold`}>≈ {Number(product.price).toFixed(2)}€</span>
        {!compact && <span className="text-[10px] font-medium uppercase tracking-wide">estimé</span>}
      </span>
    );
  }
  if (state === 'guess') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500"
        title="Piste peu fiable : pas assez de commandes concordantes"
      >
        <span className={`${size} font-semibold`}>≈ {Number(product.price_guess).toFixed(2)}€ ?</span>
        {!compact && <span className="text-[10px] font-medium uppercase tracking-wide">à confirmer</span>}
      </span>
    );
  }
  if (state === 'freeManual') {
    return (
      <span className={`${size} font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg`}>Gratuit</span>
    );
  }
  if (state === 'free') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700"
        title="0 € confirmé par vos commandes"
      >
        <Sparkles size={12} />
        <span className={`${size} font-bold`}>Gratuit</span>
      </span>
    );
  }
  return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Prix à définir</span>;
};

// Prix d'un produit à variantes : le prix de la variante unique, ou la fourchette. Saisi = texte plein ;
// dès qu'un prix est deviné ou manquant, la pastille en pointillés le signale.
export const GroupPrice = ({ group, large = false, compact = false }) => {
  if (!group.isFamily) return <PriceTag product={group.variants[0].product} large={large} compact={compact} />;

  const { min, max, unknown, estimated, free, allFree, manualFree } = priceRange(group);
  const size0 = large ? 'text-lg' : 'text-base';
  if (min === null && allFree) {
    return manualFree
      ? <span className={`${size0} font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg`}>Gratuit</span>
      : (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700" title="0 € confirmé par vos commandes">
          <Sparkles size={12} />
          <span className={`${size0} font-bold`}>Gratuit</span>
        </span>
      );
  }
  if (min === null) return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Prix à définir</span>;

  const size = large ? 'text-lg' : 'text-base';
  const range = min === max ? `${min.toFixed(2)}€` : `${min.toFixed(2)}–${max.toFixed(2)}€`;
  const text = free ? `Gratuit – ${max.toFixed(2)}€` : range;
  if (!estimated && !unknown) return <span className={`${size} font-bold text-purple-600`}>{text}</span>;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-dashed border-sky-300 bg-sky-50 text-sky-700"
      title="Certaines variantes ont un prix deviné ou à définir — détail dans la fiche"
    >
      <Sparkles size={12} />
      <span className={`${size} font-bold`}>{text}</span>
    </span>
  );
};
