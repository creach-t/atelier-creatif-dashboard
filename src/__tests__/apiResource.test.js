const { route, pickFields, updateOwned, deleteOwned } = require('../../api/lib/resource');
const { syncProductsFromItems } = require('../../api/lib/productSync');
const { syncCustomers } = require('../../api/lib/customerSync');
const { chunk } = require('../../api/lib/batch');

jest.mock('../../api/lib/auth', () => ({ requireUser: jest.fn() }));
jest.mock('../../api/lib/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));
const { requireUser } = require('../../api/lib/auth');
const { getSupabaseClient } = require('../../api/lib/supabaseClient');

const USER = { id: 'user-1' };
const ID = '11111111-1111-4111-8111-111111111111';

// Faux client Supabase : enregistre chaque requête (table, opération, filtres, charge) et répond via `respond`.
function fakeSupabase(respond = () => ({ data: [], error: null })) {
  const calls = [];
  const from = (table) => {
    const call = { table, op: 'select', filters: [], payload: undefined, options: undefined };
    calls.push(call);
    const builder = {
      select: () => builder,
      insert: (payload) => { call.op = 'insert'; call.payload = payload; return builder; },
      upsert: (payload, options) => { call.op = 'upsert'; call.payload = payload; call.options = options; return builder; },
      update: (payload) => { call.op = 'update'; call.payload = payload; return builder; },
      delete: () => { call.op = 'delete'; return builder; },
      eq: (column, value) => { call.filters.push(['eq', column, value]); return builder; },
      in: (column, values) => { call.filters.push(['in', column, values]); return builder; },
      order: () => builder,
      maybeSingle: () => Promise.resolve(respond(call)),
      single: () => Promise.resolve(respond(call)),
      then: (resolve, reject) => Promise.resolve(respond(call)).then(resolve, reject),
    };
    return builder;
  };
  return { from, calls };
}

function fakeRes() {
  const res = { statusCode: null, body: undefined, headersSent: false };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.end = () => res;
  return res;
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  requireUser.mockResolvedValue(USER);
});

describe('route', () => {
  const run = async (handler, req) => {
    const res = fakeRes();
    getSupabaseClient.mockReturnValue(fakeSupabase());
    await handler({ method: 'GET', query: {}, ...req }, res);
    return res;
  };

  test("s'arrête sans rien appeler si l'utilisateur n'est pas authentifié", async () => {
    requireUser.mockResolvedValue(null);
    const GET = jest.fn();
    await run(route({ GET }), {});
    expect(GET).not.toHaveBeenCalled();
  });

  test('méthode non déclarée : 405', async () => {
    const res = await run(route({ GET: jest.fn() }), { method: 'POST' });
    expect(res.statusCode).toBe(405);
  });

  test("withId : un id qui n'est pas un UUID répond 404", async () => {
    const GET = jest.fn();
    const res = await run(route({ GET }, { withId: true }), { query: { id: '1; drop table' } });
    expect(res.statusCode).toBe(404);
    expect(GET).not.toHaveBeenCalled();
  });

  test('transmet utilisateur, corps et id au handler', async () => {
    const GET = jest.fn();
    await run(route({ GET }, { withId: true }), { query: { id: ID }, body: { a: 1 } });
    expect(GET).toHaveBeenCalledWith(expect.objectContaining({ user: USER, id: ID, body: { a: 1 } }));
  });
});

describe('pickFields', () => {
  test('ne garde que les champs autorisés et présents', () => {
    expect(pickFields({ a: 1, b: 2, user_id: 'x' }, ['a', 'c'])).toEqual({ a: 1 });
  });
});

describe('updateOwned / deleteOwned', () => {
  const ctxWith = (respond) => {
    const supabase = fakeSupabase(respond);
    return { ctx: { res: fakeRes(), supabase, user: USER, id: ID }, supabase };
  };

  test("filtre toujours sur l'id ET l'utilisateur", async () => {
    const { ctx, supabase } = ctxWith(() => ({ data: { id: ID }, error: null }));
    await updateOwned(ctx, 'products', { name: 'x' }, { context: 't' });
    expect(supabase.calls[0].filters).toEqual([['eq', 'id', ID], ['eq', 'user_id', 'user-1']]);
  });

  test("ligne d'un autre utilisateur ou absente : 404 et null", async () => {
    const { ctx } = ctxWith(() => ({ data: null, error: null }));
    expect(await updateOwned(ctx, 'products', { name: 'x' }, { context: 't' })).toBeNull();
    expect(ctx.res.statusCode).toBe(404);
  });

  test('doublon : 409 avec le message demandé', async () => {
    const { ctx } = ctxWith(() => ({ data: null, error: { code: '23505', message: 'dup' } }));
    await updateOwned(ctx, 'customers', {}, { context: 't', conflictMessage: 'Déjà pris' });
    expect(ctx.res.statusCode).toBe(409);
    expect(ctx.res.body).toEqual({ error: 'Déjà pris' });
  });

  test("erreur base : 500 générique, jamais le message Postgres", async () => {
    const { ctx } = ctxWith(() => ({ data: null, error: { code: 'XX', message: 'column secret_col does not exist' } }));
    await updateOwned(ctx, 'customers', {}, { context: 't' });
    expect(ctx.res.statusCode).toBe(500);
    expect(JSON.stringify(ctx.res.body)).not.toMatch(/secret_col/);
  });

  test('suppression : 204 si supprimée, 404 sinon', async () => {
    const ok = ctxWith(() => ({ data: [{ id: ID }], error: null }));
    await deleteOwned(ok.ctx, 'orders', { context: 't' });
    expect(ok.ctx.res.statusCode).toBe(204);

    const none = ctxWith(() => ({ data: [], error: null }));
    await deleteOwned(none.ctx, 'orders', { context: 't' });
    expect(none.ctx.res.statusCode).toBe(404);
  });
});

describe('chunk', () => {
  test('découpe en lots', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('syncProductsFromItems (requêtes groupées)', () => {
  test('250 articles distincts : quelques requêtes, pas 2 par article', async () => {
    const items = Array.from({ length: 250 }, (_, i) => ({ name: `Produit ${i}` }));
    const supabase = fakeSupabase((call) => (call.op === 'select' ? { data: [{ name: 'Produit 0' }], error: null } : { error: null }));
    await syncProductsFromItems(supabase, 'user-1', items);

    expect(supabase.calls.filter((c) => c.op === 'select')).toHaveLength(3); // 3 lots de 100
    const inserts = supabase.calls.filter((c) => c.op === 'upsert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].options).toMatchObject({ onConflict: 'user_id,name', ignoreDuplicates: true });
    expect(inserts[0].payload).toHaveLength(249); // « Produit 0 » existe déjà
    expect(inserts[0].payload[0]).toMatchObject({ user_id: 'user-1', category: 'Ko-fi', price: 0 });
  });

  test('index unique absent (migration 0011 pas passée) : retombe sur un simple insert', async () => {
    const supabase = fakeSupabase((call) => {
      if (call.op === 'select') return { data: [], error: null };
      if (call.op === 'upsert') return { error: { code: '42P10' } };
      return { error: null };
    });
    await syncProductsFromItems(supabase, 'user-1', [{ name: 'A' }]);
    expect(supabase.calls.filter((c) => c.op === 'insert')).toHaveLength(1);
  });

  test('doublons et noms vides ignorés ; rien à insérer = aucune écriture', async () => {
    const supabase = fakeSupabase(() => ({ data: [{ name: 'A' }], error: null }));
    await syncProductsFromItems(supabase, 'user-1', [{ name: 'A' }, { name: ' A ' }, { name: '' }, null]);
    expect(supabase.calls.filter((c) => c.op === 'insert' || c.op === 'upsert')).toHaveLength(0);
  });
});

describe('syncCustomers', () => {
  test('crée seulement les clients inconnus, fusionne les doublons, complète un email manquant', async () => {
    const supabase = fakeSupabase((call) => (
      call.op === 'select' ? { data: [{ id: 'c1', name: 'Alice', email: null }], error: null } : { error: null }
    ));
    await syncCustomers(supabase, 'user-1', [
      { name: 'Alice', email: 'alice@ex.fr' },
      { name: 'Bob', email: null },
      { name: 'Bob', email: 'bob@ex.fr' },
      { name: '  ', email: 'x@ex.fr' },
    ]);

    const upsert = supabase.calls.find((c) => c.op === 'upsert');
    expect(upsert.payload).toEqual([{ user_id: 'user-1', name: 'Bob', email: 'bob@ex.fr' }]);
    expect(upsert.options).toMatchObject({ onConflict: 'user_id,name', ignoreDuplicates: true });

    const update = supabase.calls.find((c) => c.op === 'update');
    expect(update.payload).toEqual({ email: 'alice@ex.fr' });
    expect(update.filters).toEqual([['eq', 'id', 'c1']]);
  });

  test('erreur de lecture : on ne crée rien (pas de doublons en cascade)', async () => {
    const supabase = fakeSupabase(() => ({ data: null, error: { message: 'boom' } }));
    await syncCustomers(supabase, 'user-1', [{ name: 'Alice' }]);
    expect(supabase.calls.some((c) => c.op !== 'select')).toBe(false);
  });
});
