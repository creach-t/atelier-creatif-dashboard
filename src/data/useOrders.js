import { useResource } from './useResource';

export function useOrders() {
  const { items, loading, error, refresh, create, update, remove } = useResource('/orders', { prepend: true });
  return { orders: items, loading, error, refresh, createOrder: create, updateOrder: update, deleteOrder: remove };
}
