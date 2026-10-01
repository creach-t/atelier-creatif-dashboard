import { renderHook } from '@testing-library/react';
import { useWidgetOrders } from '../core/widgets/hooks';
import { computeSoldByName } from '../utils/computeSoldByName';
import { isCounted } from '../utils/orderAmounts';

const ORDERS = [
  { id: 1, status: 'delivered', total: 10, order_date: '2026-03-01', items: [{ name: 'A', quantity: 2 }] },
  { id: 2, status: 'cancelled', total: 99, order_date: '2026-03-02', items: [{ name: 'A', quantity: 5 }] },
];

jest.mock('../data/DataProvider', () => ({ useData: () => ({ orders: ORDERS }) }));
jest.mock('../core/workspace/WorkspaceProvider', () => ({ useWorkspace: () => ({ page: { period: 'all' } }) }));

describe('commandes annulées', () => {
  test('isCounted exclut seulement « cancelled »', () => {
    expect(ORDERS.map(isCounted)).toEqual([true, false]);
  });

  test('les widgets de chiffres ne voient pas les annulées par défaut', () => {
    const { result } = renderHook(() => useWidgetOrders('all'));
    expect(result.current.orders.map((o) => o.id)).toEqual([1]);
    expect(result.current.allOrders.map((o) => o.id)).toEqual([1]);
  });

  test('les listes de commandes peuvent les inclure', () => {
    const { result } = renderHook(() => useWidgetOrders('all', { includeCancelled: true }));
    expect(result.current.orders.map((o) => o.id)).toEqual([1, 2]);
  });

  test('quantités vendues : une annulée ne compte pas (filtrée comme le fait DataProvider)', () => {
    expect(computeSoldByName(ORDERS.filter(isCounted))).toEqual({ A: 2 });
  });
});
