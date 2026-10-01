// Aides produit qui parlent au serveur en dehors du CRUD (celui-ci passe par data/useProducts).
import { apiClient } from '../api/client';

// Aperçu d'un produit Ko-fi à partir de son lien : { name, price, currency, imageUrl, kofi_url }. N'écrit rien en base.
// Échecs : message = code stable (kofi_blocked, kofi_not_found, kofi_unavailable, kofi_unparseable, invalid_kofi_url).
export const fetchKofiPreview = (url) => apiClient.post('/products/kofi-preview', { url });

// Envoie une photo de produit (Blob JPEG/PNG/WebP déjà redimensionné) vers le stockage : renvoie son URL publique https.
export async function uploadProductImage(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const { url } = await apiClient.post('/products/image', { contentType: blob.type, data: window.btoa(binary) });
  return url;
}
