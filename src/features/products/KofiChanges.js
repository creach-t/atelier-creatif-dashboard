import React from 'react';
import { ArrowRight } from 'lucide-react';
import { money } from '../../core/metrics/format';
import { isPhoto } from '../../utils/productImage';

const Value = ({ field, value }) => {
  if (field === 'image') {
    return isPhoto(value)
      ? <img src={value} alt="" className="w-12 h-12 rounded-lg object-cover bg-purple-50 shrink-0" />
      : <span className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-xl text-purple-300 shrink-0">{value || '—'}</span>;
  }
  if (field === 'price') return <span className="font-semibold text-gray-900">{money(value)}</span>;
  return <span className="font-medium text-gray-900 break-words min-w-0">{value || '—'}</span>;
};

// Comparatif avant / après d'une resynchronisation Ko-fi : une ligne par modification proposée, avec sa case.
// Les lignes qui écraseraient une valeur existante sont signalées et décochées par défaut (voir kofiSyncPlan).
export const KofiChanges = ({ changes, selected, onToggle }) => (
  <ul className="space-y-2">
    {changes.map((c) => (
      <li key={c.field} className={`rounded-xl border p-3 ${c.needsConfirm ? 'border-amber-200 bg-amber-50/60' : 'border-purple-100 bg-white'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.has(c.field)}
            onChange={() => onToggle(c.field)}
            aria-label={`Appliquer : ${c.label}`}
            className="mt-1 rounded border-purple-300 text-purple-600 focus:ring-purple-400 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gray-700 mb-1">{c.label}</span>
            <span className="flex items-center gap-2 flex-wrap">
              <Value field={c.field} value={c.before} />
              <ArrowRight size={14} className="text-gray-400 shrink-0" aria-label="devient" />
              <Value field={c.field} value={c.after} />
            </span>
            {c.note && <span className="block text-xs text-amber-700 mt-1">{c.note}{c.needsConfirm ? ' — coche pour confirmer' : ''}</span>}
          </span>
        </label>
      </li>
    ))}
  </ul>
);
