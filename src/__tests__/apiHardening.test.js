const importOrders = require('../../api/orders/import');
const profile = require('../../api/profile');
const { mapKofiPayload } = require('../../api/lib/kofiMapper');

jest.mock('../../api/lib/auth', () => ({ requireUser: jest.fn() }));
jest.mock('../../api/lib/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));
const { requireUser } = require('../../api/lib/auth');
const { getSupabaseClient } = require('../../api/lib/supabaseClient');

const USER = { id: 'user-1' };

// Faux client : enregistre les opérations, répond toujours « sans erreur » (upsert renvoie les lignes envoyées).
function fakeSupabase() {
  const calls = [];
  const from = (table) => {
    const call = { table, op: 'select', payload: undefined };
    calls.push(call);
    const result = () => ({ data: Array.isArray(call.payload) ? call.payload : call.payload ? [call.payload] : [], error: null });
    const builder = {
      select: () => builder,
      insert: (payload) => { call.op = 'insert'; call.payload = payload; return builder; },
      upsert: (payload) => { call.op = 'upsert'; call.payload = payload; return builder; },
      eq: () => builder,
      in: () => builder,
      single: () => Promise.resolve(result()),
      maybeSingle: () => Promise.resolve(result()),
      then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
    };
    return builder;
  };
  return { from, calls };
}

const fakeRes = () => {
  const res = { statusCode: null, body: undefined, headersSent: false };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.end = () => res;
  return res;
};

const row = (extra = {}) => ({ transaction_id: 't1', timestamp: '2026-03-04', type: 'Shop Order', amount: 12.5, items: [{ name: 'Print', quantity: 1 }], ...extra });

let supabase;
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  requireUser.mockResolvedValue(USER);
  supabase = fakeSupabase();
  getSupabaseClient.mockReturnValue(supabase);
});

describe('POST /orders/import', () => {
  const run = async (rows) => {
    const res = fakeRes();
    await importOrders({ method: 'POST', headers: {}, query: {}, body: { rows } }, res);
    return res;
  };
  const upsertedOrders = () => supabase.calls.find((c) => c.table === 'orders' && c.op === 'upsert').payload;

  test('une même transaction répétée dans le lot est importée une seule fois', async () => {
    const res = await run([row(), row(), row({ transaction_id: 't2' })]);
    expect(res.statusCode).toBe(200);
    expect(upsertedOrders().map((o) => o.kofi_transaction_id)).toEqual(['t1', 't2']);
    expect(res.body).toMatchObject({ imported: 2, skipped: 1, total_rows: 3 });
  });

  test("date illisible : ligne ignorée et comptée, jamais datée d'aujourd'hui", async () => {
    const res = await run([row(), row({ transaction_id: 't2', timestamp: '' })]);
    expect(upsertedOrders()).toHaveLength(1);
    expect(res.body).toMatchObject({ imported: 1, invalid_date: 1 });
  });

  test("nom ou email qui n'est pas du texte : pas d'échec, champ vide", async () => {
    const res = await run([row({ customer_name: { evil: true }, customer_email: 42 })]);
    expect(res.statusCode).toBe(200);
    expect(upsertedOrders()[0]).toMatchObject({ customer_name: null, customer_email: null });
  });

  test('seuls les champs connus sont conservés dans raw_payload', async () => {
    await run([row({ junk: 'x'.repeat(1000), customer_name: 'Alice' })]);
    expect(Object.keys(upsertedOrders()[0].raw_payload).sort()).toEqual(['amount', 'imported_from_csv', 'shopOrderType', 'type'].sort());
  });

  test('toutes les lignes sans date : 400', async () => {
    const res = await run([row({ timestamp: 'n/a' })]);
    expect(res.statusCode).toBe(400);
  });
});

describe('PATCH /profile : token Ko-fi', () => {
  const patch = async (body) => {
    const res = fakeRes();
    await profile({ method: 'PATCH', headers: {}, query: {}, body }, res);
    return res;
  };

  test('token trop court refusé', async () => {
    expect((await patch({ kofi_verification_token: '1234' })).statusCode).toBe(400);
  });

  test("token de la longueur d'un UUID accepté, null pour le retirer", async () => {
    expect((await patch({ kofi_verification_token: '123e4567-e89b-12d3-a456-426614174000' })).statusCode).toBe(200);
    expect((await patch({ kofi_verification_token: null })).statusCode).toBe(200);
  });
});

describe('mapKofiPayload : payload non fiable', () => {
  test('types inattendus neutralisés, jamais d\'exception', () => {
    const order = mapKofiPayload({
      verification_token: 'secret', from_name: { a: 1 }, email: 5, amount: 'abc', kofi_transaction_id: ['x'],
      shop_items: [null, 'str', { variation_name: 'V', quantity: -3 }],
    });
    expect(order).toMatchObject({ customer_name: null, customer_email: null, total: 0, kofi_transaction_id: null });
    expect(order.items).toEqual([
      { name: 'Article Ko-fi', quantity: 1 },
      { name: 'Article Ko-fi', quantity: 1 },
      { name: 'V', quantity: 1 },
    ]);
  });

  test("le verification_token n'est pas recopié dans raw_payload", () => {
    const order = mapKofiPayload({ verification_token: 'secret', amount: '5.00', type: 'Donation' });
    expect(order.raw_payload).not.toHaveProperty('verification_token');
    expect(order.total).toBe(5);
  });
});
