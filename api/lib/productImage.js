/* eslint-disable no-control-regex */
// Validation d'une image de produit : un emoji (ou un court texte) OU une URL https. Jamais javascript:, data:, http:.
// Copie côté navigateur : src/utils/productImage.js (un test vérifie que les deux répondent pareil).

const MAX_URL = 500;
const MAX_EMOJI = 16; // un emoji composé (drapeau, famille, teinte de peau) tient en quelques unités de code

// URL https « propre » : pas d'identifiants intégrés, pas d'espace ni de caractère de contrôle, longueur bornée.
function isHttpsUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL) return false;
  if (/[\s\u0000-\u001f\u007f]/.test(value)) return false;
  let url;
  try {
    url = new URL(value);
  } catch (e) {
    return false;
  }
  return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
}

// Emoji / texte court : rien qui ressemble à une URL, à du balisage ou à un schéma (javascript:…).
function isEmojiImage(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_EMOJI && !/[:/\\<>"'`&]/.test(value) && !/[\u0000-\u001f\u007f]/.test(value);
}

const isValidProductImage = (value) => isHttpsUrl(value) || isEmojiImage(value);

module.exports = { isHttpsUrl, isEmojiImage, isValidProductImage, MAX_URL };
