import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

const POLL_INTERVAL_MS = 30000;

// Liste d'une ressource de l'API (`/orders`, `/products`…) : chargement, rafraîchissement toutes les 30 s,
// et création / modification / suppression répercutées localement sans attendre le prochain rafraîchissement.
// `prepend` : une nouvelle ligne s'ajoute en tête (commandes, triées de la plus récente) plutôt qu'en fin de liste.
export function useResource(path, { prepend = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await apiClient.get(path));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const create = useCallback(async (data) => {
    const created = await apiClient.post(path, data);
    setItems((prev) => (prepend ? [created, ...prev] : [...prev, created]));
    return created;
  }, [path, prepend]);

  const update = useCallback(async (id, updates) => {
    const updated = await apiClient.patch(`${path}/${id}`, updates);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [path]);

  const remove = useCallback(async (id) => {
    await apiClient.delete(`${path}/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [path]);

  return { items, loading, error, refresh, create, update, remove };
}
