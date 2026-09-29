import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

const POLL_INTERVAL_MS = 30000;

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient.get('/orders');
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const createOrder = useCallback(async (order) => {
    const created = await apiClient.post('/orders', order);
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOrder = useCallback(async (id, updates) => {
    const updated = await apiClient.patch(`/orders/${id}`, updates);
    setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    return updated;
  }, []);

  const deleteOrder = useCallback(async (id) => {
    await apiClient.delete(`/orders/${id}`);
    setOrders((prev) => prev.filter((order) => order.id !== id));
  }, []);

  return { orders, loading, error, refresh, createOrder, updateOrder, deleteOrder };
}
