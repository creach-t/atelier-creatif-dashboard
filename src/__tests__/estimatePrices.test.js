import { estimatePrices } from '../utils/estimatePrices';
import { describeOrder } from '../utils/computeProductRevenue';

const order = (total, items, status = 'pending') => ({
  total,
  status,
  items: items.map(([name, quantity, price]) => ({ name, quantity, price: price || 0 })),
});

describe('estimatePrices', () => {
  test('retrouve les prix malgré pourboires, remises et commandes annulées', () => {
    const orders = [
      order(5, [['A', 1]]), order(10, [['A', 2]]), order(5, [['A', 1]]), order(8.5, [['B', 1]]),
      order(13.5, [['A', 1], ['B', 1]]), order(13.5, [['A', 1], ['B', 1]]),
      order(12, [['B', 1]]), // pourboire
      order(20, [['A', 1], ['B', 2]]), order(18.5, [['A', 2], ['B', 1]]),
      order(3, [['A', 1]]), // remise
      order(99, [['A', 1]], 'cancelled'),
    ];
    const result = estimatePrices(orders, []);
    expect(result.A.price).toBe(5);
    expect(result.B.price).toBe(8.5);
  });

  test('résout des paniers mixtes en les recoupant', () => {
    const orders = [
      order(10, [['P', 1], ['Q', 1]]), order(13, [['P', 1], ['R', 1]]), order(15, [['Q', 1], ['R', 1]]),
      order(4, [['P', 1]]), order(20, [['P', 2], ['Q', 2]]),
    ];
    const result = estimatePrices(orders, []);
    expect([result.P.price, result.Q.price, result.R.price]).toEqual([4, 6, 9]);
  });

  test('un prix catalogue saisi à la main est utilisé comme prix connu', () => {
    const result = estimatePrices([order(11, [['A', 1], ['C', 1]]), order(11, [['A', 1], ['C', 1]])], [
      { name: 'A', price: 5, price_estimated: false },
    ]);
    expect(result.C.price).toBe(6);
    expect(result.A).toBeUndefined();
  });
});

describe('confiance', () => {
  test('une seule commande ne suffit pas pour écrire en base', () => {
    expect(estimatePrices([order(7, [['S', 1]])], []).S.confident).toBe(false);
  });

  test('plusieurs commandes concordantes malgré un pourboire : quasi sûr', () => {
    const result = estimatePrices([order(5, [['L', 1]]), order(5, [['L', 1]]), order(5, [['L', 1]]), order(9, [['L', 1]])], []);
    expect(result.L.price).toBe(5);
    expect(result.L.confident).toBe(true);
  });

  test('commandes incohérentes entre elles : pas de certitude', () => {
    const result = estimatePrices([order(4, [['M', 1]]), order(7, [['M', 1]]), order(11, [['M', 1]]), order(15, [['M', 1]])], []);
    expect(result.M.confident).toBe(false);
  });
});

describe('produits gratuits', () => {
  test('0 € confirmé par des commandes à total nul, seul ou offert dans un panier', () => {
    const orders = [order(0, [['F', 1]]), order(0, [['F', 1]]), order(5, [['A', 1], ['F', 1]]), order(5, [['A', 1], ['F', 1]])];
    const result = estimatePrices(orders, [{ name: 'A', price: 5, price_estimated: false }]);
    expect(result.F.price).toBe(0);
    expect(result.F.confident).toBe(true);
  });

  test('un seul don de 0 € ne prouve rien', () => {
    expect(estimatePrices([order(0, [['F', 1]])], []).F.confident).toBe(false);
  });
});

describe('affinage', () => {
  test("le mode l'emporte sur la moyenne, pourboires écartés", () => {
    const orders = [order(6, [['D', 1]]), order(6, [['D', 1]]), order(6, [['D', 1]]), order(6, [['D', 1]]), order(10, [['D', 1]]), order(15, [['D', 1]])];
    const result = estimatePrices(orders, []);
    expect(result.D.price).toBe(6);
    expect(result.D.level).toBe('probable'); // 4 commandes sur 6 concordent (67 %) : les 2 autres sont des pourboires
  });

  test('deux produits toujours achetés ensemble ne sont pas identifiables : jamais quasi sûrs', () => {
    const result = estimatePrices([order(15, [['X', 1], ['Y', 1]]), order(15, [['X', 1], ['Y', 1]]), order(15, [['X', 1], ['Y', 1]])], []);
    expect(result.X.identified).toBe(false);
    expect(result.X.confident).toBe(false);
    expect(result.Y.confident).toBe(false);
  });

  test("un produit vu seul lève l'ambiguïté de son partenaire", () => {
    const result = estimatePrices([order(10, [['X', 1]]), order(10, [['X', 1]]), order(15, [['X', 1], ['Y', 1]]), order(15, [['X', 1], ['Y', 1]])], []);
    expect(result.X.price).toBe(10);
    expect(result.Y.price).toBe(5);
    expect(result.Y.confident).toBe(true);
  });
});

describe('articles gratuits', () => {
  test("un produit gratuit du catalogue n'absorbe pas le reste du total", () => {
    const { lines, adjustment } = describeOrder(order(7, [['A', 1], ['F', 1]]), { A: 5, F: 0 }, new Set(['F']));
    expect(lines[1].free).toBe(true);
    expect(lines[1].total).toBe(0);
    expect(adjustment).toBe(2); // le surplus reste un don à part
  });
});

describe('gratuit voulu (is_free)', () => {
  test("un produit marqué gratuit est connu à 0 € : il n'est jamais estimé et n'absorbe rien", () => {
    const orders = [order(5, [['A', 1], ['F', 1]]), order(5, [['A', 1], ['F', 1]]), order(5, [['A', 1], ['F', 1]])];
    const result = estimatePrices(orders, [{ name: 'F', price: 0, is_free: true }]);
    expect(result.F).toBeUndefined();
    expect(result.A.price).toBe(5);
  });

  test('describeOrder : catalogPrices inclut le gratuit voulu', () => {
    const { catalogPrices } = require('../utils/estimatePrices');
    expect(catalogPrices([{ name: 'F', price: 0, is_free: true }, { name: 'X', price: 0 }])).toEqual({ F: 0 });
  });
});

describe('describeOrder', () => {
  test('utilise le prix estimé du catalogue et isole l\'écart (prix libre)', () => {
    const { lines, adjustment } = describeOrder(order(12, [['B', 1]]), { B: 8.5 }, new Set(['B']));
    expect(lines[0].total).toBe(8.5);
    expect(lines[0].estimated).toBe(true);
    expect(adjustment).toBe(3.5);
  });

  test('un prix connu prime : pas marqué estimé, le surplus reste un don à part', () => {
    const { lines, adjustment } = describeOrder(order(12, [['A', 1]]), { A: 5 }, new Set());
    expect(lines[0].total).toBe(5);
    expect(lines[0].estimated).toBe(false);
    expect(adjustment).toBe(7);
  });

  test('un article sans prix absorbe le reste, sans écart', () => {
    const { lines, adjustment } = describeOrder(order(10, [['A', 1], ['Z', 1]]), { A: 6 });
    expect(lines.map((l) => l.total)).toEqual([6, 4]);
    expect(lines[1].estimated).toBe(true);
    expect(adjustment).toBe(0);
  });
});
