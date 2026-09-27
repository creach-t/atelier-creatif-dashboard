import React from 'react';
import { X, ExternalLink, Edit } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProductThumbnail } from '../ui/ProductThumbnail';

export const ProductDetailModal = ({ product, sold, onEdit, onClose }) => {
  const hasPrice = Number(product.price) > 0;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900">Détail du produit</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <ProductThumbnail image={product.image} size="text-5xl" className="mb-4" />
            <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{product.category}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-purple-25 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Prix</p>
              {hasPrice ? (
                <p className="text-lg font-bold text-purple-600">{Number(product.price).toFixed(2)}€</p>
              ) : (
                <p className="text-sm font-medium text-amber-600">À définir</p>
              )}
            </div>
            <div className="p-3 bg-purple-25 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Vendu</p>
              <p className="text-lg font-bold text-gray-900">{sold} unité{sold > 1 ? 's' : ''}</p>
            </div>
          </div>

          {product.kofi_url && (
            <a
              href={product.kofi_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:underline"
            >
              <ExternalLink size={14} />
              Voir sur Ko-fi
            </a>
          )}

          <Button onClick={onEdit} className="w-full justify-center">
            <Edit size={14} />
            Modifier le produit
          </Button>
        </div>
      </Card>
    </div>
  );
};
