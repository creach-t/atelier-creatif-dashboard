import React, { useState } from 'react';
import { ChevronRight, Trash2, Edit } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { STATUS_LABELS, OrderNumber } from '../ui/Badge';
import { ChannelBadge } from '../ui/ChannelBadge';
import { describeOrder, countOrderItems } from '../../utils/computeProductRevenue';
import { catalogPrices, estimatedNames } from '../../utils/estimatePrices';
import { extrasOf, commissionRateOf, commissionOf, netOf } from '../../utils/orderAmounts';

// Fiche en lecture seule : rien ne se modifie ici. Toute modification passe par « Modifier la commande »,
// qui ouvre le formulaire complet ; la seule action directe est la suppression, en deux confirmations.
export const OrderDetailModal = ({ order, products, onDelete, onEdit, onNavigateToProduct, onClose }) => {
  const [error, setError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Prix par ligne : celui saisi, sinon celui du catalogue (estimé sur toutes les commandes), sinon
  // déduit du total. L'écart avec le total payé (prix libre, remise) est affiché à part.
  const { lines, adjustment } = describeOrder(order, catalogPrices(products), estimatedNames(products));
  const lineByItem = new Map(lines.map((l) => [l.item, l]));
  const itemCount = countOrderItems(order);
  const extras = extrasOf(order);
  const rate = commissionRateOf(order);
  const totalPaid = Number(order.total) || 0;

  const Price = ({ item }) => {
    const line = lineByItem.get(item);
    if (!line) return null;
    if (line.free) {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-700 shrink-0"
          title="0 € confirmé par vos commandes"
        >
          Gratuit
        </span>
      );
    }
    return (
      <span
        className="text-sm font-semibold text-gray-900 shrink-0"
        title={line.estimated ? "Prix estimé à partir de l'ensemble des commandes (pas de prix connu)" : undefined}
      >
        {line.estimated && <span className="text-gray-400 font-normal">≈ </span>}
        {line.total.toFixed(2)}€
      </span>
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(order.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Impossible de supprimer la commande.');
      setDeleting(false);
    }
  };

  const infoRows = [
    { label: 'Statut', value: STATUS_LABELS[order.status] || order.status },
    order.tracking && { label: 'N° de suivi', value: order.tracking },
  ].filter(Boolean);

  return (
    <Modal
      title={<>Commande <OrderNumber order={order} /></>}
      subtitle={order.order_date}
      onClose={onClose}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <ChannelBadge channel={order.channel} />
          {order.channel === 'reel' && order.shop_name && (
            <span className="text-sm text-gray-500">via {order.shop_name}</span>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Client</p>
          <p className="text-sm text-gray-900">{order.customer_name || 'Anonyme'}</p>
          {order.customer_email && <p className="text-sm text-gray-500">{order.customer_email}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Articles <span className="text-gray-400 font-normal">({itemCount})</span></p>
          <div className="space-y-2">
            {(order.items || []).map((item, index) => {
              const product = (products || []).find((p) => p.name === item.name);
              if (!product) {
                return (
                  <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500 flex-1">{item.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">x{item.quantity}</span>
                      <Price item={item} />
                    </span>
                  </div>
                );
              }
              const hasPhoto = typeof product.image === 'string' && product.image.startsWith('http');
              return (
                <button
                  key={index}
                  onClick={() => onNavigateToProduct(product.name)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-purple-25 hover:bg-purple-50 rounded-lg transition-colors text-left"
                  title="Voir la fiche produit"
                >
                  {hasPhoto && <img src={product.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                  <span className="text-sm text-gray-800 flex-1">{item.name}</span>
                  <span className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
                    x{item.quantity}
                    <Price item={item} />
                    <ChevronRight size={14} className="text-purple-400" />
                  </span>
                </button>
              );
            })}
            {(!order.items || order.items.length === 0) && (
              <p className="text-sm text-gray-400">Aucun article détaillé.</p>
            )}
          </div>
        </div>

        {extras.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Divers</p>
            <div className="space-y-2">
              {extras.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{e.label}</span>
                  <span className={`text-sm font-semibold ${Number(e.amount) < 0 ? 'text-rose-500' : 'text-gray-900'}`}>
                    {Number(e.amount) < 0 ? '−' : ''}{Math.abs(Number(e.amount)).toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adjustment !== 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{adjustment > 0 ? 'Don / prix libre' : 'Remise'}</span>
            <span className={adjustment > 0 ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>
              {adjustment > 0 ? '+' : '−'}{Math.abs(adjustment).toFixed(2)}€
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-purple-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total{rate > 0 ? ' payé' : ''}</span>
            <span className={`${rate > 0 ? 'text-sm font-semibold' : 'text-lg font-bold'} text-gray-900`}>{totalPaid.toFixed(2)}€</span>
          </div>
          {rate > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Commission de la boutique ({rate} %)</span>
                <span className="text-rose-500 font-medium">−{commissionOf(order).toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Net perçu</span>
                <span className="text-lg font-bold text-gray-900">{netOf(order).toFixed(2)}€</span>
              </div>
            </>
          )}
        </div>

        <dl className="space-y-1.5 text-sm">
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="font-medium text-gray-900 text-right break-all">{row.value}</dd>
            </div>
          ))}
        </dl>

        {order.notes && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2">{order.notes}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {onEdit && (
          <Button onClick={onEdit} className="w-full justify-center">
            <Edit size={14} />
            Modifier la commande
          </Button>
        )}

        {onDelete && (
          <div className="pt-4 border-t border-purple-100">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 size={14} />
                Supprimer la commande
              </button>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                <p className="text-sm text-rose-900">
                  <span className="font-semibold">Supprimer définitivement cette commande ?</span>
                  {' '}Cette action est irréversible
                  {order.channel === 'kofi' && ' — un nouvel import Ko-fi pourrait la recréer'}.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
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
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
