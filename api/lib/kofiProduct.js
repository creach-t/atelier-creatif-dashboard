/* eslint-disable no-control-regex */
// Aperçu d'un produit Ko-fi à partir de sa page publique (https://ko-fi.com/s/<alias>) : nom, prix, image.
// Source : les balises Open Graph de la page (og:title, og:image, product:price:amount), bien plus stables que
// l'API JSON interne de la boutique. Rien n'est écrit en base ici : le front confirme puis passe par PATCH/POST.
//
// Garde-fous SSRF : l'URL de l'utilisateur n'est JAMAIS passée telle quelle à fetch. On en extrait l'alias avec une regex
// stricte (hôte exact ko-fi.com, chemin /s/<alias>), puis on reconstruit nous-mêmes l'URL. Redirections refusées,
// délai court, taille de réponse bornée. Si Cloudflare bloque la requête, on le signale (« blocked ») sans tenter de contourner.
const { TextDecoder } = require('util');
const { isHttpsUrl } = require('./productImage');

const ALIAS = /^[A-Za-z0-9]{4,32}$/;
const PATH = /^\/s\/([A-Za-z0-9]{4,32})\/?$/;
const MAX_URL_INPUT = 500;
const MAX_BODY_BYTES = 512 * 1024;
const TIMEOUT_MS = 6000;

// Lien collé par l'utilisatrice -> alias, ou null. Seul https://ko-fi.com/s/<alias> est accepté.
// Rejetés : autre hôte (www., sous-domaine, ko-fi.com.evil.fr), http:, port, identifiants (user@), chemin différent.
function parseKofiProductUrl(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw || raw.length > MAX_URL_INPUT || /[\s\u0000-\u001f\u007f\\]/.test(raw)) return null;
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

// L'URL canonique est reconstruite à partir de l'alias validé (jamais recopiée de l'entrée).
const canonicalKofiUrl = (alias) => (ALIAS.test(alias) ? `https://ko-fi.com/s/${alias}` : null);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[e.toLowerCase()] !== undefined ? ENTITIES[e.toLowerCase()] : m;
  });
}

// Toutes les balises <meta> de la page : [{ key, content }] (property ou name ; attributs dans n'importe quel ordre).
function readMetaTags(html) {
  const tags = [];
  const metaRe = /<meta\b[^>]*>/gi;
  let m;
  while ((m = metaRe.exec(html)) !== null) {
    const attrs = {};
    const attrRe = /([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = attrRe.exec(m[0])) !== null) attrs[a[1].toLowerCase()] = a[2] !== undefined ? a[2] : a[3];
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (key && attrs.content !== undefined) tags.push({ key, content: decodeEntities(attrs.content).trim() });
  }
  return tags;
}

// « Mon produit - Boutique de Marie's Ko-fi Shop » -> « Mon produit ».
function cleanTitle(title) {
  const t = title.replace(/\s+[-–|]\s+[^-–|]*Ko-fi(?: Shop)?\s*$/i, '').trim();
  return t.slice(0, 200) || null;
}

// Les images d'un produit Ko-fi sont servies depuis ko-fi.com (storage.ko-fi.com…) : tout autre hôte est écarté.
function isKofiImage(value) {
  if (!isHttpsUrl(value)) return false;
  const host = new URL(value).hostname;
  return host === 'ko-fi.com' || host.endsWith('.ko-fi.com');
}

// HTML d'une page produit -> { name, price, currency, imageUrl } (chaque champ null s'il est absent ou douteux).
function parseKofiProductPage(html) {
  const tags = readMetaTags(typeof html === 'string' ? html : '');
  const first = (...keys) => {
    for (const key of keys) {
      const hit = tags.find((t) => t.key === key && t.content);
      if (hit) return hit.content;
    }
    return null;
  };

  const title = first('og:title', 'twitter:title');
  // Ko-fi publie deux balises product:price:amount : l'une porte le montant, l'autre (par erreur) la devise.
  const amounts = tags.filter((t) => t.key === 'product:price:amount' || t.key === 'og:price:amount').map((t) => t.content);
  const priceText = amounts.find((v) => /^\d+(?:[.,]\d{1,2})?$/.test(v));
  const price = priceText !== undefined ? Number(priceText.replace(',', '.')) : null;
  const currencyText = first('product:price:currency', 'og:price:currency') || amounts.find((v) => /^[A-Za-z]{3}$/.test(v)) || null;
  const image = first('og:image', 'twitter:image');

  return {
    name: title ? cleanTitle(title) : null,
    price: Number.isFinite(price) && price >= 0 && price < 1e6 ? price : null,
    currency: currencyText && /^[A-Za-z]{3}$/.test(currencyText) ? currencyText.toUpperCase() : null,
    imageUrl: image && isKofiImage(image) ? image : null,
  };
}

// Erreurs : not_found (404 ou redirection), blocked (Cloudflare / limitation), unavailable (réseau, délai, 5xx),
// unparseable (page reçue mais sans nom ni image).
class KofiFetchError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const CHALLENGE = /just a moment|cf-chl|challenge-platform|attention required/i;

// Lit au plus MAX_BODY_BYTES : une page piégée ou énorme ne peut pas saturer la mémoire.
async function readLimited(response) {
  if (!response.body || typeof response.body.getReader !== 'function') return (await response.text()).slice(0, MAX_BODY_BYTES);
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (received >= MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      break;
    }
  }
  return out;
}

async function fetchKofiProduct(alias, { fetchImpl = fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const url = canonicalKofiUrl(alias);
  if (!url) throw new KofiFetchError('not_found');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let html;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual', // jamais de redirection suivie : elle pourrait mener hors de ko-fi.com
      signal: controller.signal,
      headers: { 'user-agent': 'Cashly/1.0 (+https://cashly.creachtheo.fr)', accept: 'text/html' },
    });
    if (response.status >= 300 && response.status < 400) throw new KofiFetchError('not_found'); // Ko-fi redirige les produits inexistants
    if (response.status === 404 || response.status === 410) throw new KofiFetchError('not_found');
    if (response.status === 403 || response.status === 429 || response.status === 503) {
      await Promise.resolve(response.body && response.body.cancel && response.body.cancel()).catch(() => {});
      throw new KofiFetchError('blocked');
    }
    if (!response.ok) throw new KofiFetchError('unavailable');
    const type = (response.headers && response.headers.get && response.headers.get('content-type')) || '';
    if (type && !/text\/html/i.test(type)) throw new KofiFetchError('unparseable');
    html = await readLimited(response);
  } catch (err) {
    if (err instanceof KofiFetchError) throw err;
    throw new KofiFetchError('unavailable'); // réseau, délai dépassé (abort), flux interrompu
  } finally {
    clearTimeout(timer);
  }

  const product = parseKofiProductPage(html);
  if (!product.name && !product.imageUrl) throw new KofiFetchError(CHALLENGE.test(html) ? 'blocked' : 'unparseable');
  return { ...product, kofi_url: url };
}

module.exports = { parseKofiProductUrl, canonicalKofiUrl, parseKofiProductPage, fetchKofiProduct, KofiFetchError, isKofiImage };
