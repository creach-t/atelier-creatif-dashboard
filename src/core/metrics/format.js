// Formats d'affichage partagés par tous les widgets : un seul endroit pour changer la façon d'écrire un montant.
export const money = (n) => `${Number(n || 0).toFixed(2)}€`;

export const moneyCompact = (n) => {
  const v = Number(n || 0);
  return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '')}k€` : `${Math.round(v)}€`;
};

export const FORMATS = {
  money: { full: money, compact: moneyCompact },
  int: { full: (n) => String(Math.round(Number(n || 0))), compact: (n) => String(Math.round(Number(n || 0))) },
};

export const formatValue = (value, format = 'int', compact = false) => {
  const f = FORMATS[format] || FORMATS.int;
  return compact ? f.compact(value) : f.full(value);
};

export const plural = (n, word, pluralWord) => `${n} ${n > 1 ? pluralWord || `${word}s` : word}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
