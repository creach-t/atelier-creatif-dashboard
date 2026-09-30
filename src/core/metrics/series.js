import { getMetric } from './metrics';
import { dayKey } from './periods';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const parse = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const mondayOf = (d) => { const c = new Date(d); c.setDate(c.getDate() - ((c.getDay() + 6) % 7)); return c; };

export const GRANULARITIES = [
  { value: 'auto', label: 'Auto' },
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];

// Taille de bucket adaptée à la durée : lisible sans configuration.
export const pickGranularity = (from, to) => {
  const days = Math.round((parse(to) - parse(from)) / 86400000) + 1;
  if (days <= 45) return 'day';
  if (days <= 200) return 'week';
  return 'month';
};

const bucketOf = (key, gran) => {
  const d = parse(key);
  if (gran === 'day') return { key, label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, start: key };
  if (gran === 'week') {
    const m = mondayOf(d);
    return { key: dayKey(m), label: `${m.getDate()} ${MONTHS[m.getMonth()]}`, start: dayKey(m) };
  }
  const k = key.slice(0, 7);
  return { key: k, label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, start: `${k}-01` };
};

const nextBucketStart = (start, gran) => {
  const d = parse(start);
  if (gran === 'day') d.setDate(d.getDate() + 1);
  else if (gran === 'week') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1, 1);
  return dayKey(d);
};

// Série temporelle { points: [{ key, label, value }], granularity } sur une période, buckets vides compris
// (une courbe sans trous se lit mieux). `range` = { from, to } ; null = de la 1re à la dernière commande.
export function buildSeries(orders, metricId, range, granularity = 'auto', ctx = {}) {
  const metric = getMetric(metricId);
  const dated = orders.filter((o) => o.order_date);
  if (dated.length === 0) return { points: [], granularity: 'day' };

  const sorted = dated.map((o) => o.order_date).sort();
  const from = (range && range.from) || sorted[0];
  const to = (range && range.to) || sorted[sorted.length - 1];
  const gran = granularity === 'auto' ? pickGranularity(from, to) : granularity;

  const groups = new Map();
  dated.forEach((o) => {
    const b = bucketOf(o.order_date, gran);
    if (!groups.has(b.key)) groups.set(b.key, []);
    groups.get(b.key).push(o);
  });

  const points = [];
  let cursor = bucketOf(from, gran).start;
  const end = bucketOf(to, gran).start;
  let guard = 0;
  while (cursor <= end && guard < 800) {
    const b = bucketOf(cursor, gran);
    const list = groups.get(b.key) || [];
    points.push({ key: b.key, label: b.label, value: Math.round(metric.compute(list, ctx) * 100) / 100 });
    cursor = nextBucketStart(cursor, gran);
    guard += 1;
  }
  return { points, granularity: gran };
}

export const cumulate = (points) => {
  let run = 0;
  return points.map((p) => { run += p.value; return { ...p, value: Math.round(run * 100) / 100 }; });
};
