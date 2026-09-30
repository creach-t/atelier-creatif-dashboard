import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { catalogEntries, CATEGORIES } from '../widgets/registry';
import { listItem } from '../ui/motion';
import { WidgetPreview } from '../widgets/WidgetPreview';

// Catalogue : tous les widgets du registre (et leurs préréglages), triés par thème, avec recherche.
export const WidgetPicker = ({ open, onClose, onPick }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const entries = useMemo(() => catalogEntries(), []);

  const visible = entries.filter((e) => {
    if (category !== 'all' && e.def.category !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || `${e.label} ${e.description} ${e.def.title}`.toLowerCase().includes(q);
  });

  const pick = (entry) => {
    onPick(entry);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Ajouter un widget" subtitle="Choisissez un bloc, vous pourrez tout régler ensuite.">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher…"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 pb-3">
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
              category === c ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {c === 'all' ? 'Tous' : c}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {visible.map((entry, i) => (
          <motion.li key={entry.key} custom={i} variants={listItem} initial="hidden" animate="visible">
            {/* Carte + bouton superposé : l'aperçu contient lui-même des boutons, qui ne peuvent pas être imbriqués dans un <button>. */}
            <div className="relative bg-white border border-purple-100 rounded-2xl p-2.5 hover:border-purple-300 hover:shadow-md active:scale-[0.99] transition-all">
              <WidgetPreview entry={entry} />
              <div className="flex items-center gap-3 px-1 pt-2.5 pb-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{entry.label}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{entry.description}</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0"><Plus size={16} /></span>
              </div>
              <button type="button" aria-label={`Ajouter ${entry.label}`} onClick={() => pick(entry)} className="absolute inset-0 rounded-2xl" />
            </div>
          </motion.li>
        ))}
        {visible.length === 0 && <li className="text-sm text-gray-500 text-center py-8">Aucun widget ne correspond.</li>}
      </ul>
    </Sheet>
  );
};
