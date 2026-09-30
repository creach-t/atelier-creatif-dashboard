import React, { useState } from 'react';
import { money } from '../../core/metrics/format';
import { ExternalLink, Edit, Check, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductCover } from '../ui/ProductThumbnail';
import { PriceTag, GroupPrice, priceState } from '../ui/PriceTag';
import { groupKind, KIND_LABELS } from '../../utils/productVariants';

const guessedPrice = (product) => (priceState(product) === 'guess' ? Number(product.price_guess) : Number(product.price));

// group : produit seul, ou famille de variantes (voir utils/productVariants). Les ventes restent
// détaillées par variante ; le total du groupe n'est que leur somme.
export const ProductDetailModal = ({ group, soldByName = {}, revenueByName = {}, onEdit, onConfirmPrice, onDelete, onClose }) => {
  // Suppression en deux temps : 1) la corbeille, 2) « Oui, supprimer » dans le panneau rouge.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const soldOf = (p) => soldByName[p.name] || 0;
  const revenueOf = (p) => revenueByName[p.name] || 0;
  const totalSold = group.variants.reduce((s, v) => s + soldOf(v.product), 0);
  const totalRevenue = group.variants.reduce((s, v) => s + revenueOf(v.product), 0);
  const kofiUrls = [...new Set(group.variants.map((v) => v.product.kofi_url).filter(Boolean))];
  const single = group.variants[0].product;
  const state = priceState(single);
  const isGuess = !group.isFamily && (state === 'estimated' || state === 'guess');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || 'Impossible de supprimer le produit.');
    } finally {
      setDeleting(false);
    }
  };

  const deletePanel = deleteTarget && (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
      <p className="text-sm text-rose-900">
        <span className="font-semibold">Supprimer définitivement « {deleteTarget.name} » ?</span>
        {' '}Les commandes déjà passées sont conservées, mais un produit vendu sur Ko-fi peut être recréé à la prochaine commande.
      </p>
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
          disabled={deleting}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
        >
          {deleting ? 'Suppression...' : 'Oui, supprimer'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal title="Détail du produit" onClose={onClose} maxWidth="max-w-md">
      <div className="p-4 sm:p-6 space-y-5">
        <div className="text-center">
          <ProductCover image={group.image} rounded="rounded-2xl" className="max-w-[10rem] sm:max-w-[16rem] mx-auto shadow-sm" />
          <h4 className="text-lg font-semibold text-gray-900 mt-4">{group.name}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {group.category}
            {groupKind(group) && ` · ${KIND_LABELS[groupKind(group)]}`}
            {group.isFamily && ` · ${group.variants.length} variantes`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-purple-25 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Prix</p>
            <GroupPrice group={group} large />
          </div>
          <div className="p-3 bg-purple-25 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Vendu{group.isFamily ? ' (total)' : ''}</p>
            <p className="text-lg font-bold text-gray-900">{totalSold} unité{totalSold > 1 ? 's' : ''}</p>
            {totalRevenue > 0 && <p className="text-xs text-gray-500">{money(totalRevenue)}</p>}
          </div>
        </div>

        {group.isFamily && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ventes par variante</p>
            <div className="rounded-xl border border-purple-100 divide-y divide-purple-50 overflow-hidden">
              {group.variants.map(({ product, label }) => {
                const vState = priceState(product);
                const canConfirm = onConfirmPrice && (vState === 'estimated' || vState === 'guess');
                return (
                  <div key={product.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                      <p className="text-xs text-gray-500">
                        {soldOf(product)} vendu{soldOf(product) > 1 ? 's' : ''}
                        {revenueOf(product) > 0 && ` · ${money(revenueOf(product))}`}
                      </p>
                    </div>
                    <PriceTag product={product} compact />
                    {canConfirm && (
                      <button
                        type="button"
                        onClick={() => onConfirmPrice(product, guessedPrice(product))}
                        title={`Confirmer ${money(guessedPrice(product))} comme prix`}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg shrink-0"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(product.name)}
                      title="Modifier cette variante"
                      className="p-1.5 text-gray-500 hover:bg-purple-50 rounded-lg shrink-0"
                    >
                      <Edit size={14} />
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => { setDeleteTarget(product); setDeleteError(null); }}
                        title="Supprimer cette variante"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {deleteTarget && <div className="mt-3">{deletePanel}</div>}
          </div>
        )}

        {isGuess && (
          <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/60 p-3 text-sm text-sky-900 space-y-2">
            <p>
              {state === 'estimated'
                ? `Prix deviné (prix moyen pondéré) à partir de ${single.price_support || 'vos'} commandes.`
                : 'Piste peu fiable : trop peu de commandes concordantes pour écrire ce prix.'}
              {' '}Ce n'est pas un prix saisi.
            </p>
            {onConfirmPrice && (
              <Button size="sm" onClick={() => onConfirmPrice(single, guessedPrice(single))} className="w-full justify-center">
                Confirmer {money(guessedPrice(single))} comme prix
              </Button>
            )}
          </div>
        )}

        {kofiUrls.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:underline"
          >
            <ExternalLink size={14} />
            Voir sur Ko-fi
          </a>
        ))}

        {!group.isFamily && (
          <Button onClick={() => onEdit(single.name)} className="w-full justify-center">
            <Edit size={14} />
            Modifier le produit
          </Button>
        )}

        {!group.isFamily && onDelete && (
          <div className="pt-4 border-t border-purple-100">
            {deleteTarget ? (
              deletePanel
            ) : (
              <button
                type="button"
                onClick={() => setDeleteTarget(single)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 size={14} />
                Supprimer le produit
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
