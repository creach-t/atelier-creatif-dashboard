import { resolvePeriod, ordersInPeriod, ordersInPrevPeriod } from '../core/metrics/periods';
import { METRICS, variation } from '../core/metrics/metrics';
import { buildSeries, cumulate, pickGranularity } from '../core/metrics/series';

const NOW = new Date(2026, 8, 15); // 15 septembre 2026
const o = (order_date, total, extra = {}) => ({ id: order_date + total, order_date, total, status: 'delivered', customer_name: 'A', ...extra });

describe('resolvePeriod', () => {
  test('mois courant et précédent', () => {
    const p = resolvePeriod('month', {}, NOW);
    expect([p.from, p.to]).toEqual(['2026-09-01', '2026-09-30']);
    expect([p.prev.from, p.prev.to]).toEqual(['2026-08-01', '2026-08-31']);
  });

  test('« page » reprend la période et le décalage de mois de la page', () => {
    const p = resolvePeriod('page', { period: 'month', monthOffset: -2 }, NOW);
    expect([p.from, p.to]).toEqual(['2026-07-01', '2026-07-31']);
    // Une période fixée sur le widget ignore le décalage de la page.
    expect(resolvePeriod('month', { period: 'month', monthOffset: -2 }, NOW).from).toBe('2026-09-01');
  });

  test('30 jours glissants inclut aujourd\'hui, la période précédente est adjacente', () => {
    const p = resolvePeriod('30d', {}, NOW);
    expect(p.to).toBe('2026-09-15');
    expect(p.from).toBe('2026-08-17');
    expect(p.prev.to).toBe('2026-08-16');
  });

  test('« tout » n\'a ni bornes ni comparaison', () => {
    const p = resolvePeriod('all', {}, NOW);
    expect(p.from).toBeNull();
    expect(p.prev).toBeNull();
  });

  test('filtrage des commandes par période', () => {
    const orders = [o('2026-08-31', 10), o('2026-09-01', 20), o('2026-09-30', 30), o('2026-10-01', 40)];
    const p = resolvePeriod('month', {}, NOW);
    expect(ordersInPeriod(orders, p).map((x) => x.total)).toEqual([20, 30]);
    expect(ordersInPrevPeriod(orders, p).map((x) => x.total)).toEqual([10]);
    expect(ordersInPeriod(orders, resolvePeriod('all', {}, NOW))).toBe(orders);
  });
});

describe('métriques', () => {
  const orders = [
    o('2026-09-01', 100, { commission_rate: 20, customer_name: 'A' }),
    o('2026-09-02', 50, { customer_name: 'B', status: 'pending' }),
  ];

  test('revenus = net après commission, brut = total', () => {
    expect(METRICS.revenue.compute(orders)).toBe(130);
    expect(METRICS.gross.compute(orders)).toBe(150);
    expect(METRICS.commission.compute(orders)).toBe(20);
  });

  test('panier moyen sans commande = 0 (pas de NaN)', () => {
    expect(METRICS.basket.compute([])).toBe(0);
    expect(METRICS.basket.compute(orders)).toBe(65);
  });

  test('nouveaux clients : première commande sur tout l\'historique', () => {
    const all = [o('2026-01-01', 10, { customer_name: 'A' }), ...orders];
    const inPeriod = orders;
    expect(METRICS.newCustomers.compute(inPeriod, { allOrders: all })).toBe(1); // B seulement
  });

  test('en attente', () => {
    expect(METRICS.pending.compute(orders)).toBe(1);
  });

  test('variation', () => {
    expect(variation(150, 100)).toBe(50);
    expect(variation(10, 0)).toBeNull();
  });
});

describe('séries temporelles', () => {
  test('granularité automatique selon la durée', () => {
    expect(pickGranularity('2026-09-01', '2026-09-30')).toBe('day');
    expect(pickGranularity('2026-06-01', '2026-09-30')).toBe('week');
    expect(pickGranularity('2025-01-01', '2026-09-30')).toBe('month');
  });

  test('les jours sans vente sont présents à zéro', () => {
    const { points } = buildSeries([o('2026-09-01', 10), o('2026-09-04', 5)], 'revenue', { from: '2026-09-01', to: '2026-09-05' }, 'day');
    expect(points.map((p) => p.value)).toEqual([10, 0, 0, 5, 0]);
  });

  test('regroupement par mois', () => {
    const { points, granularity } = buildSeries([o('2026-07-10', 10), o('2026-09-04', 5)], 'orders', null, 'month');
    expect(granularity).toBe('month');
    expect(points.map((p) => p.value)).toEqual([1, 0, 1]);
  });

  test('cumul', () => {
    expect(cumulate([{ value: 1 }, { value: 0 }, { value: 2 }]).map((p) => p.value)).toEqual([1, 1, 3]);
  });

  test('aucune commande = série vide', () => {
    expect(buildSeries([], 'revenue', { from: '2026-09-01', to: '2026-09-30' }).points).toEqual([]);
  });
});

describe('année navigable et plage personnalisée', () => {
  test('« page » en mode année suit le décalage, un widget fixé reste sur l\'année courante', () => {
    const p = resolvePeriod('page', { period: 'year', yearOffset: -1 }, NOW);
    expect([p.from, p.to, p.year]).toEqual(['2025-01-01', '2025-12-31', 2025]);
    expect(p.short).toBe('2025');
    expect(resolvePeriod('year', { period: 'year', yearOffset: -1 }, NOW).from).toBe('2026-01-01');
    expect(resolvePeriod('page', { period: 'year' }, NOW).short).toBe('cette année');
  });

  test('l\'année ne peut pas aller dans le futur', () => {
    expect(resolvePeriod('page', { period: 'year', yearOffset: 3 }, NOW).from).toBe('2026-01-01');
  });

  test('plage personnalisée : bornes, période précédente de même durée', () => {
    const p = resolvePeriod('page', { period: 'custom', rangeFrom: '2026-09-10', rangeTo: '2026-09-19' }, NOW);
    expect([p.from, p.to]).toEqual(['2026-09-10', '2026-09-19']);
    expect([p.prev.from, p.prev.to]).toEqual(['2026-08-31', '2026-09-09']);
    const orders = [o('2026-09-09', 1), o('2026-09-10', 2), o('2026-09-19', 3), o('2026-09-20', 4)];
    expect(ordersInPeriod(orders, p).map((x) => x.total)).toEqual([2, 3]);
  });

  test('plage inversée remise dans l\'ordre, plage absente = 30 jours, jamais utilisable par un widget seul', () => {
    const inv = resolvePeriod('page', { period: 'custom', rangeFrom: '2026-09-19', rangeTo: '2026-09-10' }, NOW);
    expect([inv.from, inv.to]).toEqual(['2026-09-10', '2026-09-19']);
    expect(resolvePeriod('page', { period: 'custom' }, NOW).id).toBe('30d');
    expect(resolvePeriod('custom', { period: 'custom', rangeFrom: '2026-09-10', rangeTo: '2026-09-19' }, NOW).id).toBe('30d');
  });

  test('un seul jour', () => {
    const p = resolvePeriod('page', { period: 'custom', rangeFrom: '2026-09-10', rangeTo: '2026-09-10' }, NOW);
    expect([p.from, p.to]).toEqual(['2026-09-10', '2026-09-10']);
    expect(p.prev.from).toBe('2026-09-09');
  });
});
