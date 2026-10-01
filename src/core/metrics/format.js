// Formats d'affichage partagés par tous les widgets : un seul endroit pour changer la façon d'écrire un montant.
export const money = (n) => `${(Number(n || 0) + 0).toFixed(2).replace(/^-0\.00$/, '0.00')}€`;

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
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// « Aujourd'hui », « Hier », « Il y a 3 j », sinon la date courte : une date relative se lit plus vite
// qu'un jour du mois quand on scanne une liste de commandes.
export const relativeDay = (dateStr, now = new Date()) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff > 1 && diff < 7) return `Il y a ${diff} j`;
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('fr-FR', sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
};

// Aperçu des articles d'une commande : « 2× Carnet, 1× Marque-page +1 ».
export const itemsSummary = (order, max = 2) => {
  const items = (order.items || []).filter((i) => i && i.name);
  const shown = items.slice(0, max).map((i) => `${Number(i.quantity) || 1}× ${i.name}`);
  return { text: shown.join(', '), more: Math.max(0, items.length - max) };
};
