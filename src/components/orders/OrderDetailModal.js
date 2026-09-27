import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge } from '../ui/ChannelBadge';

const STATUS_OPTIONS = ['pending', 'shipped', 'delivered', 'cancelled'];

export const OrderDetailModal = ({ order, products, onUpdate, onNavigateToProduct, onClose }) => {
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasChanges = status !== order.status || tracking !== (order.tracking || '');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(order.id, { status, tracking: tracking || null });
      onClose();
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-purple-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Commande #{order.id.slice(0, 8)}</h3>
            <p className="text-sm text-gray-500">{order.order_date}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <ChannelBadge channel={order.channel} />
            <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>
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
            <p className="text-sm font-medium text-gray-700 mb-2">Articles</p>
            <div className="space-y-2">
              {(order.items || []).map((item, index) => {
                const product = (products || []).find((p) => p.name === item.name);
                if (!product) {
                  return (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">{item.name}</span>
                      <span className="text-sm text-gray-400">x{item.quantity}</span>
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
                    <span className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                      x{item.quantity}
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

          <div className="flex items-center justify-between pt-2 border-t border-purple-100">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">{Number(order.total).toFixed(2)}€</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° de suivi</label>
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Optionnel"
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleSave} disabled={!hasChanges || saving} className="w-full justify-center">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
