import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

const POLL_INTERVAL_MS = 30000;

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient.get('/customers');
      setCustomers(data);
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

  const createCustomer = useCallback(async (customer) => {
    const created = await apiClient.post('/customers', customer);
    setCustomers((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCustomer = useCallback(async (id, updates) => {
    const updated = await apiClient.patch(`/customers/${id}`, updates);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    await apiClient.delete(`/customers/${id}`);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { customers, loading, error, refresh, createCustomer, updateCustomer, deleteCustomer };
}
