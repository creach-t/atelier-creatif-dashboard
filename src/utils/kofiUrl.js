// Lien produit Ko-fi collé dans un formulaire : https://ko-fi.com/s/<alias>, rien d'autre.
// Copie du serveur : api/lib/kofiProduct.js (un test vérifie que les deux répondent pareil).
const PATH = /^\/s\/([A-Za-z0-9]{4,32})\/?$/;

export function parseKofiProductUrl(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  // eslint-disable-next-line no-control-regex
  if (!raw || raw.length > 500 || /[\s\u0000-\u001f\u007f\\]/.test(raw)) return null;
  let url;
  try {
    url = new URL(raw);
  } catch (e) {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'ko-fi.com' || url.port || url.username || url.password) return null;
  const match = url.pathname.match(PATH);
  return match ? match[1] : null;
}

export const canonicalKofiUrl = (input) => {
  const alias = parseKofiProductUrl(input);
  return alias ? `https://ko-fi.com/s/${alias}` : null;
};
