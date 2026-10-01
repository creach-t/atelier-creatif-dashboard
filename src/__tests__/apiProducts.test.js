/* eslint-disable no-script-url */
const productsRoute = require('../../api/products');
const productRoute = require('../../api/products/[id]');
const previewRoute = require('../../api/products/kofi-preview');
const imageRoute = require('../../api/products/image');
const { KOFI_PRODUCT_HTML } = require('../sources/fixtures/kofiProductPage');

jest.mock('../../api/lib/auth', () => ({ requireUser: jest.fn() }));
jest.mock('../../api/lib/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));
const { requireUser } = require('../../api/lib/auth');
const { getSupabaseClient } = require('../../api/lib/supabaseClient');

const USER = { id: 'user-1' };
const ID = '11111111-1111-1111-1111-111111111111';

let writes;
let storage;
const fakeSupabase = () => ({
  from: (table) => {
    const call = { table };
    writes.push(call);
    const b = {
      insert: (p) => { call.op = 'insert'; call.payload = p; return b; },
      update: (p) => { call.op = 'update'; call.payload = p; return b; },
      eq: () => b,
      select: () => b,
      single: () => Promise.resolve({ data: { id: ID, ...call.payload }, error: null }),
      maybeSingle: () => Promise.resolve({ data: { id: ID, ...call.payload }, error: null }),
    };
    return b;
  },
  storage,
});

const fakeRes = () => {
  const res = { statusCode: null, body: undefined, headersSent: false };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.end = () => res;
  return res;
};
const call = async (handler, method, body, query = {}) => {
  const res = fakeRes();
  await handler({ method, headers: {}, query, body }, res);
  return res;
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  writes = [];
  storage = {
    from: () => ({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: (path) => ({ data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/product-images/${path}` } }),
    }),
  };
  requireUser.mockResolvedValue(USER);
  getSupabaseClient.mockImplementation(fakeSupabase);
});
afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

const base = { name: 'Sticker', category: 'Stickers', price: 3 };

describe("image et lien Ko-fi d'un produit", () => {
  test('création : emoji, URL https et défaut acceptés', async () => {
    expect((await call(productsRoute, 'POST', { ...base, image: '🎨' })).statusCode).toBe(201);
    expect((await call(productsRoute, 'POST', { ...base, image: 'https://storage.ko-fi.com/a.jpeg', kofi_url: 'https://ko-fi.com/s/58d678ea42' })).statusCode).toBe(201);
    const res = await call(productsRoute, 'POST', base);
    expect(res.statusCode).toBe(201);
    expect(writes.at(-1).payload.image).toBe('🎁');
  });

  test.each(['javascript:alert(1)', 'data:text/html,x', 'http://exemple.fr/a.png', '<img src=x onerror=1>', 'https://u:p@exemple.fr/a.png'])('création : image « %s » refusée', async (image) => {
    const res = await call(productsRoute, 'POST', { ...base, image });
    expect(res.statusCode).toBe(400);
    expect(writes).toHaveLength(0);
  });

  test('création : kofi_url non https refusée (il est affiché comme lien)', async () => {
    expect((await call(productsRoute, 'POST', { ...base, kofi_url: 'javascript:alert(1)' })).statusCode).toBe(400);
  });

  test('modification : mêmes règles, null efface le lien', async () => {
    expect((await call(productRoute, 'PATCH', { image: 'https://storage.ko-fi.com/a.jpeg' }, { id: ID })).statusCode).toBe(200);
    expect((await call(productRoute, 'PATCH', { image: 'javascript:alert(1)' }, { id: ID })).statusCode).toBe(400);
    expect((await call(productRoute, 'PATCH', { image: '' }, { id: ID })).statusCode).toBe(400);
    expect((await call(productRoute, 'PATCH', { kofi_url: 'javascript:alert(1)' }, { id: ID })).statusCode).toBe(400);
    expect((await call(productRoute, 'PATCH', { kofi_url: null }, { id: ID })).statusCode).toBe(200);
  });
});

describe('POST /products/kofi-preview', () => {
  const okFetch = () => jest.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'text/html' }, text: async () => KOFI_PRODUCT_HTML });

  test("renvoie nom, prix, image — et n'écrit rien en base", async () => {
    global.fetch = okFetch();
    const res = await call(previewRoute, 'POST', { url: 'https://ko-fi.com/s/58d678ea42?utm=1' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ name: 'Digital Sticker Mix - Free Download', price: 12.5, currency: 'EUR', kofi_url: 'https://ko-fi.com/s/58d678ea42' });
    expect(global.fetch).toHaveBeenCalledWith('https://ko-fi.com/s/58d678ea42', expect.objectContaining({ redirect: 'manual' }));
    expect(writes).toHaveLength(0);
  });

  test("une URL hors ko-fi.com est refusée AVANT tout appel réseau", async () => {
    global.fetch = jest.fn();
    for (const url of ['https://evil.fr/s/58d678ea42', 'https://ko-fi.com@evil.fr/s/58d678ea42', 'http://ko-fi.com/s/58d678ea42', 'http://169.254.169.254/', undefined, 12]) {
      const res = await call(previewRoute, 'POST', { url });
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: 'invalid_kofi_url' });
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('Cloudflare, produit introuvable, panne : codes stables, sans détail réseau', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, headers: { get: () => null } });
    expect(await call(previewRoute, 'POST', { url: 'https://ko-fi.com/s/58d678ea42' })).toMatchObject({ statusCode: 502, body: { error: 'kofi_blocked' } });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 302, headers: { get: () => 'https://evil.fr' } });
    expect(await call(previewRoute, 'POST', { url: 'https://ko-fi.com/s/58d678ea42' })).toMatchObject({ statusCode: 404, body: { error: 'kofi_not_found' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND secret-host'));
    const res = await call(previewRoute, 'POST', { url: 'https://ko-fi.com/s/58d678ea42' });
    expect(res).toMatchObject({ statusCode: 502, body: { error: 'kofi_unavailable' } });
    expect(JSON.stringify(res.body)).not.toMatch(/ENOTFOUND|secret/);
  });

  test('exige une connexion', async () => {
    requireUser.mockResolvedValue(null);
    global.fetch = jest.fn();
    await call(previewRoute, 'POST', { url: 'https://ko-fi.com/s/58d678ea42' });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /products/image', () => {
  const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
  const send = (buf, contentType = 'image/jpeg') => call(imageRoute, 'POST', { contentType, data: buf.toString('base64') });

  test("dépose l'image dans le dossier de l'utilisateur et renvoie son URL publique", async () => {
    const upload = jest.fn().mockResolvedValue({ error: null });
    storage = { from: (bucket) => { expect(bucket).toBe('product-images'); return { upload, getPublicUrl: (p) => ({ data: { publicUrl: `https://x.supabase.co/${p}` } }) }; } };
    const res = await send(JPEG);
    expect(res.statusCode).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/x\.supabase\.co\/user-1\/[0-9a-f-]{36}\.jpg$/);
    expect(upload.mock.calls[0][2]).toMatchObject({ contentType: 'image/jpeg', upsert: false });
  });

  test('refuse un type déclaré faux, un autre format, du texte non base64, un fichier trop gros', async () => {
    expect((await send(PNG, 'image/jpeg')).statusCode).toBe(400); // octets PNG déclarés JPEG
    expect((await send(Buffer.from('<svg onload=alert(1)>'), 'image/svg+xml')).statusCode).toBe(400);
    expect((await send(Buffer.from('<svg/>'), 'image/png')).statusCode).toBe(400);
    expect((await call(imageRoute, 'POST', { contentType: 'image/png', data: 'pas du base64 !' })).statusCode).toBe(400);
    expect((await send(Buffer.concat([JPEG, Buffer.alloc(1024 * 1024)]))).statusCode).toBe(400);
    expect((await call(imageRoute, 'POST', {})).statusCode).toBe(400);
  });

  test('bucket absent (migration 0013) : 501 storage_unsupported, pas un 500', async () => {
    storage = { from: () => ({ upload: async () => ({ error: { statusCode: '404', message: 'Bucket not found' } }), getPublicUrl: () => ({}) }) };
    expect(await send(JPEG)).toMatchObject({ statusCode: 501, body: { error: 'storage_unsupported' } });
  });

  test('autre erreur de stockage : 500 générique', async () => {
    storage = { from: () => ({ upload: async () => ({ error: { message: 'boom interne' } }), getPublicUrl: () => ({}) }) };
    const res = await send(JPEG);
    expect(res).toMatchObject({ statusCode: 500, body: { error: 'Internal server error' } });
  });
});
