import { useCallback, useState } from 'react';

// Tri par clic sur les en-têtes de colonnes : un clic trie, un second clic inverse le sens.
// firstDir = sens au premier clic sur une colonne (texte : asc, nombres/dates : desc).
export function useSort(defaultKey, defaultDir = 'desc') {
  const [sort, setSort] = useState({ key: defaultKey, dir: defaultDir });
  const toggle = useCallback((key, firstDir = 'asc') => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: firstDir }));
  }, []);
  return [sort, toggle];
}

// accessors : { colonne: (ligne) => valeur }. Les valeurs vides passent toujours en dernier,
// et l'ordre d'origine départage les égalités (tri stable).
export function sortRows(rows, sort, accessors) {
  const get = accessors[sort.key];
  if (!get) return rows;
  const sign = sort.dir === 'asc' ? 1 : -1;
  const empty = (v) => v === null || v === undefined || v === '';

  return rows
    .map((row, index) => ({ row, index, value: get(row) }))
    .sort((a, b) => {
      if (empty(a.value) && empty(b.value)) return a.index - b.index;
      if (empty(a.value)) return 1;
      if (empty(b.value)) return -1;
      const cmp = typeof a.value === 'number' && typeof b.value === 'number'
        ? a.value - b.value
        : String(a.value).localeCompare(String(b.value), 'fr', { sensitivity: 'base', numeric: true });
      return cmp * sign || a.index - b.index;
    })
    .map((x) => x.row);
}
