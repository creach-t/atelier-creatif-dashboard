import { apiClient } from '../api/client';

// Envoie les lignes d'un export CSV Ko-fi (déjà normalisées, voir utils/normalizeKofiCsv).
// Renvoie { imported, skipped, total_rows }.
export const importKofiOrders = (rows) => apiClient.post('/orders/import', { rows });
