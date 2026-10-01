import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { COMPACT_FIELD_CLASS } from '../../ui/fieldClasses';
import { emptyExtra } from './orderDraft';

// Lignes « divers » (frais de port, emballage, don, remise) : comptent dans le total sans créer d'article.
export const OrderExtrasEditor = ({ extras, onChange }) => {
  const patch = (index, changes) => onChange(extras.map((e, i) => (i === index ? { ...e, ...changes } : e)));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Divers <span className="text-gray-400 font-normal">(ne crée pas d'article)</span>
        </label>
        <button type="button" onClick={() => onChange([...extras, emptyExtra()])} className="text-sm text-purple-600 font-medium flex items-center gap-1">
          <Plus size={14} /> Ajouter
        </button>
      </div>
      {extras.length === 0 ? (
        <p className="text-xs text-gray-400">Frais de port, emballage, don, remise (montant négatif)…</p>
      ) : (
        <div className="space-y-2">
          {extras.map((extra, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={extra.label}
                onChange={(e) => patch(index, { label: e.target.value })}
                placeholder="Ex : frais de port"
                className={`${COMPACT_FIELD_CLASS} flex-1 min-w-0`}
              />
              <input
                type="number"
                step="0.01"
                value={extra.amount}
                onChange={(e) => patch(index, { amount: e.target.value })}
                placeholder="€"
                className="w-24 shrink-0 px-2 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button type="button" onClick={() => onChange(extras.filter((_, i) => i !== index))} className="p-2 text-gray-400 hover:text-red-600 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
