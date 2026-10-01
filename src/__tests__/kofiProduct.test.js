/* eslint-disable no-script-url */
import * as front from '../utils/kofiUrl';
import * as frontImage from '../utils/productImage';
import { KOFI_PRODUCT_HTML } from '../sources/fixtures/kofiProductPage';

const back = require('../../api/lib/kofiProduct');
const backImage = require('../../api/lib/productImage');

const GOOD = 'https://ko-fi.com/s/58d678ea42';

// URL qui ne doivent JAMAIS atteindre fetch (SSRF) : hôtes voisins, identifiants intégrés, schémas, chemins.
const REJECTED = [
  'http://ko-fi.com/s/58d678ea42',
  'https://www.ko-fi.com/s/58d678ea42',
  'https://ko-fi.com.evil.fr/s/58d678ea42',
  'https://evil.fr/ko-fi.com/s/58d678ea42',
  'https://ko-fi.com@evil.fr/s/58d678ea42',
  'https://user:pass@ko-fi.com/s/58d678ea42',
  'https://ko-fi.com:8443/s/58d678ea42',
  'https://sub.ko-fi.com/s/58d678ea42',
  'https://ko-fi.com\\@evil.fr/s/58d678ea42',
  'https://ko-fi.com/s/../admin',
  'https://ko-fi.com/s/',
  'https://ko-fi.com/s/ab',
  'https://ko-fi.com/s/58d678ea42/extra',
  'https://ko-fi.com/s/58d678ea42%2f..',
  'https://ko-fi.com/s/58d6 78ea42',
  'https://ko-fi.com/shop/58d678ea42',
  'https://ko-fi.com/someone',
  'https://ko-fi.com/',
  'https://127.0.0.1/s/58d678ea42',
  'https://localhost/s/58d678ea42',
  'https://169.254.169.254/latest/meta-data',
  'javascript:alert(1)',
  'data:text/html,<script>1</script>',
  'file:///etc/passwd',
  'ftp://ko-fi.com/s/58d678ea42',
  '//ko-fi.com/s/58d678ea42',
  'ko-fi.com/s/58d678ea42',
  '',
  '   ',
  null,
  undefined,
  42,
  { href: GOOD },
  `https://ko-fi.com/s/${'a'.repeat(600)}`,
];

describe.each([['serveur', back.parseKofiProductUrl], ['navigateur', front.parseKofiProductUrl]])('validateur de lien Ko-fi (%s)', (_name, parse) => {
  test('accepte https://ko-fi.com/s/<alias> (avec ou sans « / » final, requête et ancre ignorées)', () => {
    expect(parse(GOOD)).toBe('58d678ea42');
    expect(parse(`${GOOD}/`)).toBe('58d678ea42');
    expect(parse(`  ${GOOD}  `)).toBe('58d678ea42');
    expect(parse(`${GOOD}?utm_source=x#top`)).toBe('58d678ea42');
    expect(parse('https://KO-FI.COM/s/A1B2C3D4E5')).toBe('A1B2C3D4E5');
  });

  test.each(REJECTED.map((u) => [String(u).slice(0, 60), u]))('refuse %s', (_label, input) => {
    expect(parse(input)).toBeNull();
  });
});

test('les copies serveur et navigateur répondent pareil sur toute la batterie', () => {
  [GOOD, `${GOOD}/`, `${GOOD}?a=b`, ...REJECTED].forEach((u) => {
    expect(front.parseKofiProductUrl(u)).toBe(back.parseKofiProductUrl(u));
  });
  [...REJECTED, 'https://ko-fi.com/s/58d678ea42', 'https://example.com/a.png', 'https://u:p@example.com/a.png', '🎨', '🎁', 'javascript:alert(1)', 'a'.repeat(17), '<img>', 'x'.repeat(501)].forEach((v) => {
    expect(frontImage.isValidProductImage(v)).toBe(backImage.isValidProductImage(v));
    expect(frontImage.isHttpsUrl(v)).toBe(backImage.isHttpsUrl(v));
  });
});

test("l'URL canonique est reconstruite à partir de l'alias, jamais recopiée", () => {
  expect(back.canonicalKofiUrl('58d678ea42')).toBe(GOOD);
  expect(back.canonicalKofiUrl('../x')).toBeNull();
  expect(front.canonicalKofiUrl(`${GOOD}?utm=1`)).toBe(GOOD);
});

describe("validation d'une image de produit", () => {
  test.each([
    ['🎨', true], ['🎁', true], ['👩‍🎨', true], ['https://storage.ko-fi.com/cdn/a.jpeg', true], ['https://x.supabase.co/storage/v1/object/public/product-images/u/a.jpg', true],
    ['http://exemple.fr/a.png', false], ['javascript:alert(1)', false], ['data:image/svg+xml;base64,PHN2Zz4=', false], ['//exemple.fr/a.png', false],
    ['https://user:pw@exemple.fr/a.png', false], ['https://exemple.fr/a b.png', false], ['https://localhost/a.png', false], ['<img src=x>', false],
    ['', false], [null, false], [`https://exemple.fr/${'a'.repeat(500)}`, false], ['x'.repeat(17), false],
  ])('%s -> %s', (value, ok) => {
    expect(backImage.isValidProductImage(value)).toBe(ok);
  });
});

describe('parseur de la page produit (balises Open Graph)', () => {
  test('nom sans le suffixe de boutique, prix, devise et image', () => {
    expect(back.parseKofiProductPage(KOFI_PRODUCT_HTML)).toEqual({
      name: "Digital Sticker Mix - Free Download",
      price: 12.5,
      currency: 'EUR',
      imageUrl: 'https://storage.ko-fi.com/cdn/useruploads/post/de42da65-3f62-432f-93aa-6ef7cfee1437_img_2279.jpeg',
    });
  });

  test('attributs dans le désordre, apostrophes, entités', () => {
    const html = `<meta content='Mon &amp; son titre' property='og:title'><meta content="https://storage.ko-fi.com/a.png" property="og:image">`;
    expect(back.parseKofiProductPage(html)).toMatchObject({ name: 'Mon & son titre', imageUrl: 'https://storage.ko-fi.com/a.png', price: null, currency: null });
  });

  test('une image hors ko-fi.com ou non https est écartée', () => {
    ['https://evil.fr/a.png', 'http://storage.ko-fi.com/a.png', 'https://ko-fi.com.evil.fr/a.png', 'javascript:alert(1)'].forEach((img) => {
      expect(back.parseKofiProductPage(`<meta property="og:image" content="${img}">`).imageUrl).toBeNull();
    });
  });

  test('prix illisible, négatif ou absurde : null (jamais NaN)', () => {
    ['abc', '-3', '1e9', '', '12.345'].forEach((p) => {
      expect(back.parseKofiProductPage(`<meta property="product:price:amount" content="${p}">`).price).toBeNull();
    });
    expect(back.parseKofiProductPage('<meta property="product:price:amount" content="0.00">').price).toBe(0);
    expect(back.parseKofiProductPage('<meta property="product:price:amount" content="7,5">').price).toBe(7.5);
  });

  test('entrée non HTML : tout à null', () => {
    expect(back.parseKofiProductPage(null)).toEqual({ name: null, price: null, currency: null, imageUrl: null });
    expect(back.parseKofiProductPage('<html></html>')).toEqual({ name: null, price: null, currency: null, imageUrl: null });
  });
});

describe('fetchKofiProduct (réseau simulé)', () => {
  const html = (body, init = {}) => ({ ok: true, status: 200, headers: { get: () => 'text/html; charset=utf-8' }, text: async () => body, ...init });
  const run = (fetchImpl, alias = '58d678ea42') => back.fetchKofiProduct(alias, { fetchImpl, timeoutMs: 50 });
  const failsWith = async (promise, code) => { await expect(promise).rejects.toMatchObject({ code }); };

  test("n'appelle que l'URL canonique, sans suivre les redirections", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(html(KOFI_PRODUCT_HTML));
    const out = await run(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(GOOD);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ redirect: 'manual', method: 'GET' });
    expect(out).toMatchObject({ name: 'Digital Sticker Mix - Free Download', price: 12.5, kofi_url: GOOD });
  });

  test('un alias invalide ne déclenche aucun appel réseau', async () => {
    const fetchImpl = jest.fn();
    await failsWith(run(fetchImpl, '../etc'), 'not_found');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('redirection (produit inexistant, ou vers un autre hôte) : refusée comme introuvable', async () => {
    await failsWith(run(async () => ({ ok: false, status: 302, headers: { get: () => 'https://evil.fr/' } })), 'not_found');
    await failsWith(run(async () => ({ ok: false, status: 404, headers: { get: () => null } })), 'not_found');
  });

  test('Cloudflare / limitation : signalé « blocked », jamais contourné', async () => {
    await failsWith(run(async () => ({ ok: false, status: 403, headers: { get: () => null } })), 'blocked');
    await failsWith(run(async () => ({ ok: false, status: 503, headers: { get: () => null } })), 'blocked');
    await failsWith(run(async () => html('<title>Just a moment...</title><script src="/cdn-cgi/challenge-platform/x"></script>')), 'blocked');
  });

  test('erreur réseau, 500 ou délai dépassé : « unavailable »', async () => {
    await failsWith(run(async () => { throw new Error('ECONNRESET'); }), 'unavailable');
    await failsWith(run(async () => ({ ok: false, status: 500, headers: { get: () => null } })), 'unavailable');
    await failsWith(run((url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))), 'unavailable');
  });

  test('contenu non HTML ou page sans nom ni image : « unparseable »', async () => {
    await failsWith(run(async () => html('{}', { headers: { get: () => 'application/json' } })), 'unparseable');
    await failsWith(run(async () => html('<html><body>rien</body></html>')), 'unparseable');
  });

  test('taille de réponse bornée : un flux sans fin est coupé', async () => {
    let cancelled = false;
    let reads = 0;
    const chunk = new Uint8Array(64 * 1024).fill(120);
    const body = { getReader: () => ({ read: async () => { reads += 1; return { done: false, value: chunk }; }, cancel: async () => { cancelled = true; } }) };
    await failsWith(run(async () => ({ ok: true, status: 200, headers: { get: () => 'text/html' }, body })), 'unparseable');
    expect(cancelled).toBe(true);
    expect(reads).toBeLessThanOrEqual(9); // 512 Ko / 64 Ko
  });
});
