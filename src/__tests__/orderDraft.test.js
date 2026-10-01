import {
  initialDraft, orderTotals, validateDraft, newProducts, buildCreatePayload, buildUpdateChanges, emptyItem,
} from '../components/orders/orderDraft';

const products = [{ id: 'p1', name: 'Sticker', price: 3 }];

const draftWith = (changes) => ({ ...initialDraft(null, products), customerName: 'Alice', ...changes });

describe('orderTotals', () => {
  test('articles + divers + écart, sans commission hors point de vente', () => {
    const draft = draftWith({
      channel: 'kofi',
      items: [{ name: 'Sticker', quantity: 2, price: 3 }],
      extras: [{ label: 'Port', amount: '2.5' }],
      gap: 1,
      commission: '30',
    });
    expect(orderTotals(draft)).toEqual({ total: 9.5, commissionRate: 0, commissionAmount: 0, net: 9.5 });
  });

  test('commission bornée à 100 % en point de vente', () => {
    const draft = draftWith({ items: [{ name: 'A', quantity: 1, price: 10 }], commission: '250' });
    expect(orderTotals(draft)).toMatchObject({ total: 10, commissionRate: 100, net: 0 });
  });
});

describe('validateDraft', () => {
  test('client obligatoire', () => {
    expect(validateDraft(draftWith({ customerName: ' ' }), { isEditing: false })).toMatch(/client/i);
  });

  test('une ligne divers à moitié remplie est refusée', () => {
    const draft = draftWith({ items: [{ name: 'A', quantity: 1, price: 1 }], extras: [{ label: 'Port', amount: '' }] });
    expect(validateDraft(draft, { isEditing: false })).toMatch(/divers/i);
  });

  test('création sans article ni divers refusée, modification acceptée', () => {
    const draft = draftWith({ items: [emptyItem()] });
    expect(validateDraft(draft, { isEditing: false })).toMatch(/au moins un article/i);
    expect(validateDraft(draft, { isEditing: true })).toBeNull();
  });

  test('total négatif refusé', () => {
    const draft = draftWith({ items: [{ name: 'A', quantity: 1, price: 1 }], extras: [{ label: 'Remise', amount: '-5' }] });
    expect(validateDraft(draft, { isEditing: false })).toMatch(/négatif/i);
  });
});

describe('newProducts', () => {
  test('ignore le catalogue (casse comprise) et les doublons', () => {
    const items = [{ name: 'sticker' }, { name: 'Carnet' }, { name: 'Carnet' }];
    expect(newProducts(items, products)).toEqual([{ name: 'Carnet' }]);
  });
});

describe('buildCreatePayload', () => {
  test("n'inclut que les champs optionnels renseignés", () => {
    const payload = buildCreatePayload(draftWith({ items: [{ name: ' Sticker ', quantity: '2', price: '3' }], orderDate: '2026-09-01' }), null);
    expect(payload).toEqual({
      channel: 'reel', customer_name: 'Alice', customer_email: null,
      items: [{ name: 'Sticker', quantity: 2, price: 3 }],
      total: 6, status: 'delivered', order_date: '2026-09-01', notes: null,
    });
  });
});

describe('buildUpdateChanges', () => {
  const order = {
    id: 'o1', channel: 'kofi', customer_name: 'Alice', customer_email: null, items: [{ name: 'Sticker', quantity: 1, price: 3 }],
    total: 3, status: 'pending', order_date: '2026-09-01', tracking: null, notes: null,
  };

  test('aucun changement : rien à envoyer', () => {
    expect(buildUpdateChanges(order, initialDraft(order, products), null)).toEqual({});
  });

  test('le total suit uniquement les lignes touchées', () => {
    const draft = initialDraft(order, products);
    const edited = { ...draft, items: [{ name: 'Sticker', quantity: 2, price: 3 }], touched: { ...draft.touched, items: true } };
    expect(buildUpdateChanges(order, edited, null)).toEqual({ items: [{ name: 'Sticker', quantity: 2, price: 3 }], total: 6 });
  });
});
