// Validation d'une image de produit : un emoji (ou un court texte) OU une URL https. Jamais javascript:, data:, http:.
// Copie du serveur : api/lib/productImage.js (un test vérifie que les deux répondent pareil).

export const MAX_IMAGE_URL = 500;
const MAX_EMOJI = 16; // un emoji composé (drapeau, famille, teinte de peau) tient en quelques unités de code

export function isHttpsUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_IMAGE_URL) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(value)) return false;
  let url;
  try {
    url = new URL(value);
  } catch (e) {
    return false;
  }
  return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
}

export const isEmojiImage = (value) =>
  // eslint-disable-next-line no-control-regex
  typeof value === 'string' && value.length > 0 && value.length <= MAX_EMOJI && !/[:/\\<>"'`&]/.test(value) && !/[\u0000-\u001f\u007f]/.test(value);

export const isValidProductImage = (value) => isHttpsUrl(value) || isEmojiImage(value);

// Une photo (URL) ou un emoji : sert à l'aperçu et au comparatif.
export const isPhoto = (value) => typeof value === 'string' && value.startsWith('https://');
