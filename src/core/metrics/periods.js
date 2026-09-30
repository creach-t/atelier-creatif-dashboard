// Périodes de temps utilisables par n'importe quel widget. Une période se résout en bornes de jours
// (YYYY-MM-DD, comparables comme des chaînes) et en période précédente équivalente pour les variations.
// 'page' = suivre la période choisie en haut de la page ; les autres ids fixent la période du widget.
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const monthLabel = (d) => {
  const l = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return l.charAt(0).toUpperCase() + l.slice(1);
};

export const PERIOD_OPTIONS = [
  { id: 'month', label: 'Ce mois' },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: '90d', label: '90 jours' },
  { id: 'year', label: 'Cette année' },
  { id: 'all', label: 'Tout' },
];

// Le filtre du haut de page propose en plus une plage de dates libre (« custom »), qui n'a de sens qu'à ce niveau.
export const PAGE_PERIOD_OPTIONS = [...PERIOD_OPTIONS, { id: 'custom', label: 'Personnalisé' }];

export const DEFAULT_PAGE_PERIOD = 'month';

const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const parseDay = (v) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
const shortDay = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const dayCount = (a, b) => Math.round((b - a) / 86400000) + 1;

// Résout un id de période. `page` = { period, monthOffset, yearOffset, rangeFrom, rangeTo } (état de la page)
// pour l'id 'page'. Un widget qui fixe sa propre période ignore les décalages de la page.
export function resolvePeriod(id, page = {}, now = new Date()) {
  const effective = id === 'page' || !id ? page.period || DEFAULT_PAGE_PERIOD : id;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (effective === 'month') {
    const offset = id === 'page' || !id ? Math.min(0, Number(page.monthOffset) || 0) : 0;
    const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const prevFirst = new Date(first.getFullYear(), first.getMonth() - 1, 1);
    const prevLast = new Date(first.getFullYear(), first.getMonth(), 0);
    return {
      id: effective, label: monthLabel(first), short: offset === 0 ? 'ce mois' : monthLabel(first),
      from: dayKey(first), to: dayKey(last),
      prev: { from: dayKey(prevFirst), to: dayKey(prevLast) }, prevLabel: 'mois préc.',
      isMonth: true, offset,
    };
  }
  if (effective === 'year') {
    const offset = id === 'page' || !id ? Math.min(0, Number(page.yearOffset) || 0) : 0;
    const y = today.getFullYear() + offset;
    return {
      id: effective, label: `Année ${y}`, short: offset === 0 ? 'cette année' : String(y), from: `${y}-01-01`, to: `${y}-12-31`,
      prev: { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` }, prevLabel: 'année préc.', isYear: true, offset, year: y,
    };
  }
  if (effective === 'custom' && (id === 'page' || !id)) {
    if (isDay(page.rangeFrom) && isDay(page.rangeTo)) {
      // Bornes inversées par erreur de saisie : on les remet dans l'ordre plutôt que d'afficher « rien ».
      const [from, to] = page.rangeFrom <= page.rangeTo ? [page.rangeFrom, page.rangeTo] : [page.rangeTo, page.rangeFrom];
      const a = parseDay(from);
      const b = parseDay(to);
      const n = dayCount(a, b);
      const prevTo = addDays(a, -1);
      const label = from === to ? shortDay(a) : `${shortDay(a)} → ${shortDay(b)}`;
      return {
        id: 'custom', label, short: label, from, to,
        prev: { from: dayKey(addDays(prevTo, -(n - 1))), to: dayKey(prevTo) }, prevLabel: 'période préc.', isCustom: true,
      };
    }
    return resolvePeriod('30d', page, now); // plage pas encore choisie
  }
  if (effective === 'all') {
    return { id: effective, label: 'Depuis le début', short: 'au total', from: null, to: null, prev: null };
  }
  // Id inconnu (ou « custom » demandé par un widget, qui n'en a pas les dates) : 30 jours.
  const n = { '7d': 7, '30d': 30, '90d': 90 }[effective] || 30;
  const from = addDays(today, -(n - 1));
  const prevTo = addDays(from, -1);
  return {
    id: `${n}d`, label: `${n} derniers jours`, short: `${n} jours`, from: dayKey(from), to: dayKey(today),
    prev: { from: dayKey(addDays(prevTo, -(n - 1))), to: dayKey(prevTo) }, prevLabel: `${n} j préc.`,
  };
}

export const inRange = (order, range) => {
  if (!range) return true;
  const d = order.order_date;
  if (!d) return !range.from && !range.to;
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
};

export const ordersInPeriod = (orders, period) => (period && (period.from || period.to) ? orders.filter((o) => inRange(o, period)) : orders);
export const ordersInPrevPeriod = (orders, period) => (period && period.prev ? orders.filter((o) => inRange(o, period.prev)) : null);
