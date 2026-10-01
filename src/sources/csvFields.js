// Briques communes aux adaptateurs d'import CSV (un adaptateur par source, voir src/sources/).
// Fonctions pures : aucune dépendance React ni réseau.

// "Order ID", "order id", "Order  Id" -> "orderid" : les exports changent de casse et de langue d'une année à l'autre.
export const normalizeHeader = (h) => String(h || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// Vue d'une ligne CSV indexée par en-tête normalisé : field(row, 'orderid', 'numerodecommande').
export function rowReader(row) {
  const byKey = {};
  Object.keys(row || {}).forEach((k) => { byKey[normalizeHeader(k)] = row[k]; });
  return (...aliases) => {
    for (const alias of aliases) {
      const v = byKey[normalizeHeader(alias)];
      if (v !== undefined && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };
}

export const hasHeader = (rows, ...aliases) => {
  const first = rows && rows[0];
  if (!first) return false;
  const keys = new Set(Object.keys(first).map(normalizeHeader));
  return aliases.some((a) => keys.has(normalizeHeader(a)));
};

// "12.50", "12,50", "€1 234,56", "1,234.56" -> nombre fini, ou null si illisible.
export function parseAmount(value) {
  let s = String(value ?? '').replace(/[^\d.,-]/g, '');
  if (!/\d/.test(s)) return null;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.'); // virgule décimale
  else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const pad = (n) => String(n).padStart(2, '0');
const validDay = (y, m, d) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

// Date d'un export -> jour calendaire "YYYY-MM-DD", ou '' si illisible (jamais « aujourd'hui » : la vente serait
// rangée dans la mauvaise période). Formats : YYYY-MM-DD[ …], MM/DD/YY(YY) (Etsy), DD/MM/YYYY quand le 1er nombre dépasse 12.
export function parseDay(value) {
  const s = String(value || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return validDay(+m[1], +m[2], +m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : '';
  m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})/);
  if (!m) return '';
  let a = +m[1];
  let b = +m[2];
  let y = +m[3];
  if (m[3].length === 2) y += 2000;
  const [month, day] = a > 12 ? [b, a] : [a, b]; // MM/DD par défaut ; 25/03 ne peut être que JJ/MM
  return validDay(y, month, day) ? `${y}-${pad(month)}-${pad(day)}` : '';
}

export const round2 = (n) => Math.round(n * 100) / 100;
