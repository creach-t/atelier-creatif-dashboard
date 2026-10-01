import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { money } from '../../core/metrics/format';
import { AutocompleteField } from '../ui/AutocompleteField';
import { COMPACT_FIELD_CLASS } from '../ui/fieldClasses';
import { emptyItem } from './orderDraft';

const MAX_SUGGESTIONS = 8;

const NUMBER_CLASS = 'px-2 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400';

// Lignes d'articles d'une commande : nom (avec suggestions du catalogue), quantité, prix unitaire.
// `onChange` reçoit la liste complète à chaque modification.
export const OrderItemsEditor = ({ items, products, canRemoveLast, onChange }) => {
  const suggestionsFor = (name) => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => p.name.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  };

  const patch = (index, changes) => onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  const selectProduct = (index, product) =>
    onChange(items.map((item, i) => (i === index ? { name: product.name, quantity: item.quantity || 1, price: Number(product.price) || 0 } : item)));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Articles</label>
        <button type="button" onClick={() => onChange([...items, emptyItem()])} className="text-sm text-purple-600 font-medium flex items-center gap-1">
          <Plus size={14} /> Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
            <AutocompleteField
              className="flex-1 min-w-0"
              value={item.name}
              onChange={(value) => patch(index, { name: value })}
              onSelect={(product) => selectProduct(index, product)}
              suggestions={suggestionsFor(item.name)}
              getKey={(p) => p.id}
              renderOption={(p) => (
                <>
                  <span className="truncate">{p.name}</span>
                  <span className="text-gray-500 shrink-0 ml-2">{money(p.price)}</span>
                </>
              )}
              newLabel="Nouveau produit — sera ajouté au catalogue"
              placeholder="Nom de l'article"
              inputClassName={COMPACT_FIELD_CLASS}
            />
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => patch(index, { quantity: e.target.value })}
                className={`w-16 shrink-0 ${NUMBER_CLASS}`}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Prix"
                value={item.price}
                onChange={(e) => patch(index, { price: e.target.value })}
                className={`flex-1 sm:flex-none sm:w-20 min-w-0 ${NUMBER_CLASS}`}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                disabled={items.length === 1 && !canRemoveLast}
                className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
