import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// En-tête de colonne cliquable (voir hooks/useSort). Sur mobile, la petite icône est toujours
// visible (pas de survol) pour montrer que la colonne se trie.
export const SortHeader = ({ label, sortKey, sort, onSort, firstDir = 'asc', align = 'left' }) => {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey, firstDir)}
      aria-label={`Trier par ${label}`}
      className={`group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active ? 'text-purple-700' : 'text-gray-500 hover:text-purple-600'
      } ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      {label}
      <Icon size={12} className={active ? '' : 'opacity-40 sm:opacity-0 sm:group-hover:opacity-70'} />
    </button>
  );
};

// Variante "pastille" pour les listes sans colonnes (grille de cartes).
export const SortChip = ({ label, sortKey, sort, onSort, firstDir = 'asc' }) => {
  const active = sort.key === sortKey;
  const Icon = sort.dir === 'asc' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey, firstDir)}
      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
        active ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {label}
      {active && <Icon size={12} />}
    </button>
  );
};
