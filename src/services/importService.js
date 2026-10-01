import { apiClient } from '../api/client';

// Envoie les lignes d'un export CSV Ko-fi (déjà normalisées, voir utils/normalizeKofiCsv).
// Renvoie { imported, skipped, total_rows }.
export const importKofiOrders = (rows) => apiClient.post('/orders/import', { rows });

// Envoie les lignes normalisées d'un export CSV d'une autre source (voir src/sources/). Renvoie { imported, duplicates, invalid, invalid_date, total_rows }.
export const importSourceOrders = (source, rows) => apiClient.post('/orders/import', { source, rows });
