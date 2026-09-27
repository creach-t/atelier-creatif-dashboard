import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

const POLL_INTERVAL_MS = 30000;

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient.get('/products');
      setProducts(data);
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

  const createProduct = useCallback(async (product) => {
    const created = await apiClient.post('/products', product);
    setProducts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    const updated = await apiClient.patch(`/products/${id}`, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  return { products, loading, error, refresh, createProduct, updateProduct };
}
