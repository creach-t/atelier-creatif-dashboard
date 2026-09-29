import { commissionOf, netOf, extrasSum, extrasOf } from '../utils/orderAmounts';
import { describeOrder, computeDonations } from '../utils/computeProductRevenue';
import { estimatePrices } from '../utils/estimatePrices';
import { computeReportStats } from '../utils/computeReportStats';

describe('commission et net', () => {
  test('la commission se déduit du total payé', () => {
    const order = { total: 20, commission_rate: 30 };
    expect(commissionOf(order)).toBe(6);
    expect(netOf(order)).toBe(14);
  });

  test('sans commission, net = total', () => {
    expect(netOf({ total: 12.5 })).toBe(12.5);
    expect(netOf({ total: 12.5, commission_rate: null })).toBe(12.5);
  });

  test('les revenus des rapports sont comptés en net', () => {
    const stats = computeReportStats([
      { total: 20, commission_rate: 30, order_date: '2026-03-02', customer_name: 'A', items: [] },
      { total: 10, order_date: '2026-03-05', customer_name: 'B', items: [] },
    ]);
    expect(stats.total).toBe(24);
  });
});

describe('lignes divers', () => {
  test('somme des divers, lignes vides ignorées', () => {
    const order = { extras: [{ label: 'Port', amount: 3 }, { label: 'Remise', amount: -1 }, { label: '', amount: 5 }] };
    expect(extrasOf(order)).toHaveLength(2);
    expect(extrasSum(order)).toBe(2);
  });

  test("le divers n'est pas un article : il ne fausse ni l'écart de prix ni l'estimation", () => {
    const order = { total: 8, extras: [{ label: 'Frais de port', amount: 3 }], items: [{ name: 'A', quantity: 1, price: 5 }] };
    const { lines, adjustment } = describeOrder(order, {});
    expect(lines).toHaveLength(1);
    expect(adjustment).toBe(0); // 5 (article) + 3 (divers) = 8 payé

    const orders = [1, 2, 3].map(() => ({ total: 8, extras: [{ label: 'Port', amount: 3 }], items: [{ name: 'P', quantity: 1, price: 0 }] }));
    expect(estimatePrices(orders, []).P.price).toBe(5);
  });
});

describe("le divers n'est jamais un don", () => {
  const base = { items: [{ name: 'A', quantity: 1, price: 5 }] };

  test('divers positif ou négatif : aucun don, aucune remise', () => {
    const withPort = { ...base, total: 8, extras: [{ label: 'Frais de port', amount: 3 }] };
    const withDiscount = { ...base, total: 4, extras: [{ label: 'Geste commercial', amount: -1 }] };
    expect(describeOrder(withPort, {}).adjustment).toBe(0);
    expect(describeOrder(withDiscount, {}).adjustment).toBe(0);
    expect(computeDonations([withPort, withDiscount], {})).toBe(0);
  });

  test('un vrai surplus au-delà du divers reste un don, et seulement lui', () => {
    const order = { ...base, total: 10, extras: [{ label: 'Frais de port', amount: 3 }] }; // 5 + 3 + 2 de don
    expect(describeOrder(order, {}).adjustment).toBe(2);
    expect(computeDonations([order], {})).toBe(2);
  });
});
