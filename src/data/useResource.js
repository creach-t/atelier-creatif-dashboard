import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';

const POLL_INTERVAL_MS = 30000;

// Liste d'une ressource de l'API (`/orders`, `/products`…) : chargement, rafraîchissement toutes les 30 s,
// et création / modification / suppression répercutées localement sans attendre le prochain rafraîchissement.
// `prepend` : une nouvelle ligne s'ajoute en tête (commandes, triées de la plus récente) plutôt qu'en fin de liste.
export function useResource(path, { prepend = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Numéro de la dernière écriture locale : un rafraîchissement parti avant elle répondrait avec une liste
  // périmée et écraserait la ligne qu'on vient de créer / modifier — sa réponse est alors ignorée.
  const writes = useRef(0);

  const refresh = useCallback(async () => {
    const startedAt = writes.current;
    try {
      const list = await apiClient.get(path);
      if (writes.current === startedAt) setItems(list);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refresh();
    // Pas de poll onglet masqué ; au retour on rafraîchit tout de suite.
    const tick = () => { if (!document.hidden) refresh(); };
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  const create = useCallback(async (data) => {
    const created = await apiClient.post(path, data);
    writes.current += 1;
    setItems((prev) => (prepend ? [created, ...prev] : [...prev, created]));
    return created;
  }, [path, prepend]);

  const update = useCallback(async (id, updates) => {
    const updated = await apiClient.patch(`${path}/${id}`, updates);
    writes.current += 1;
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [path]);

  const remove = useCallback(async (id) => {
    await apiClient.delete(`${path}/${id}`);
    writes.current += 1;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [path]);

  return { items, loading, error, refresh, create, update, remove };
}
