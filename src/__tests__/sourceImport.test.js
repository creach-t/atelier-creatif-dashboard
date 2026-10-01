import { parseCsv } from '../utils/parseCsv';
import { normalizeEtsyRows } from '../sources/etsy';
import { parseAmount, parseDay, normalizeHeader } from '../sources/csvFields';
import { getImportAdapter } from '../sources';
import { ETSY_ITEMS_CSV, ETSY_ORDERS_CSV } from '../sources/fixtures/etsy';

const { importSourceOrders, importableSource, cleanRow } = require('../../api/lib/importOrders');
const ordersRoute = require('../../api/orders/import');

jest.mock('../../api/lib/auth', () => ({ requireUser: jest.fn() }));
jest.mock('../../api/lib/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));
const { requireUser } = require('../../api/lib/auth');
const { getSupabaseClient } = require('../../api/lib/supabaseClient');

describe('briques CSV', () => {
  test('en-têtes normalisés (casse, accents, ponctuation)', () => {
    expect(normalizeHeader('Numéro de commande')).toBe('numerodecommande');
    expect(normalizeHeader(' Order  ID ')).toBe('orderid');
  });

  test('montants avec point ou virgule décimale, symbole monétaire', () => {
    expect(parseAmount('12.50')).toBe(12.5);
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount('€1 234,56')).toBe(1234.56);
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  test('dates : MM/DD/YY Etsy, ISO, JJ/MM quand non ambigu, illisible -> chaîne vide', () => {
    expect(parseDay('03/14/24')).toBe('2024-03-14');
    expect(parseDay('03/14/2024')).toBe('2024-03-14');
    expect(parseDay('2024-03-14 10:00:00')).toBe('2024-03-14');
    expect(parseDay('25/03/2024')).toBe('2024-03-25');
    expect(parseDay('13/13/2024')).toBe('');
    expect(parseDay('2024-02-30')).toBe('');
    expect(parseDay('hier')).toBe('');
  });
});

describe('adaptateur Etsy', () => {
  test('export « articles » : regroupé par commande, livraison en divers, lignes illisibles comptées', () => {
    const out = normalizeEtsyRows(parseCsv(ETSY_ITEMS_CSV), { defaultRate: 11 });
    expect(out.recognized).toBe(true);
    expect(out.unreadable).toBe(2); // date illisible + n° de commande manquant
    expect(out.rows.map((r) => r.source_ref)).toEqual(['5000001', '5000002']);

    const first = out.rows[0];
    expect(first).toMatchObject({ date: '2024-03-14', customer_name: 'acheteuse_un', status: 'delivered', commission_rate: 11 });
    expect(first.items).toEqual([
      { name: 'Sticker Renard', quantity: 2, price: 3.5 },
      { name: 'Carte postale Hibou', quantity: 1, price: 2 },
    ]);
    expect(first.extras).toEqual([{ label: 'Livraison', amount: 2.9 }]);
    expect(first.total).toBe(11.9); // 7 + 2 + 2,90

    // Virgule décimale et nom avec virgule entre guillemets ; pas de date d'expédition -> en attente.
    expect(out.rows[1]).toMatchObject({ total: 16.5, status: 'pending' });
    expect(out.rows[1].items[0]).toEqual({ name: 'Print A5, encadré', quantity: 1, price: 12 });
  });

  test('export « commandes » : frais réels convertis en taux, sinon taux par défaut, doublons écartés', () => {
    const out = normalizeEtsyRows(parseCsv(ETSY_ORDERS_CSV), { defaultRate: 11 });
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0]).toMatchObject({ source_ref: '6000001', total: 11.9, commission_rate: 7.56, customer_name: 'Alice Martin' });
    expect(out.rows[0].items).toEqual([{ name: 'Commande Etsy', quantity: 3, price: 3.97 }]);
    expect(out.rows[1]).toMatchObject({ source_ref: '6000002', total: 16.5, commission_rate: 11 }); // frais absents
  });

  test('fichier non reconnu : refusé, rien n’est deviné', () => {
    expect(normalizeEtsyRows(parseCsv('a,b\n1,2\n'))).toEqual({ rows: [], unreadable: 0, recognized: false });
    expect(normalizeEtsyRows(parseCsv('TransactionId,DateTime (UTC),Received\nx,09/08/2024 15:22,5\n')).recognized).toBe(false);
  });

  test("l'adaptateur est branché au registre", () => {
    expect(getImportAdapter('etsy')).toBeTruthy();
    expect(getImportAdapter('vinted')).toBeNull();
  });
});

describe('POST /orders/import { source }', () => {
  const USER = { id: 'user-1' };
  let calls;
  let existing;

  // Faux client : l'upsert « ignoreDuplicates » ne renvoie que les lignes dont le source_ref n'existe pas déjà.
  const fakeSupabase = () => {
    calls = [];
    return {
      from: (table) => {
        const call = { table, op: 'select' };
        calls.push(call);
        const result = () => {
          if (call.op === 'upsert' && table === 'orders') {
            const fresh = call.payload.filter((o) => !existing.has(o.source_ref));
            return { data: fresh, error: null };
          }
          return { data: Array.isArray(call.payload) ? call.payload : [], error: null };
        };
        const b = {
          select: () => b,
          insert: (p) => { call.op = 'insert'; call.payload = p; return b; },
          upsert: (p, opts) => { call.op = 'upsert'; call.payload = p; call.opts = opts; return b; },
          eq: () => b,
          in: () => b,
          then: (res, rej) => Promise.resolve(result()).then(res, rej),
        };
        return b;
      },
    };
  };
  const fakeRes = () => {
    const res = { statusCode: null, body: undefined, headersSent: false };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    return res;
  };
  const row = (extra = {}) => ({ source_ref: 'A1', date: '2024-03-14', customer_name: 'Alice', items: [{ name: 'Sticker', quantity: 2, price: 3.5 }], total: 7, commission_rate: 11, ...extra });
  const run = async (body) => {
    const res = fakeRes();
    await ordersRoute({ method: 'POST', headers: {}, query: {}, body }, res);
    return res;
  };
  const upserted = () => calls.find((c) => c.table === 'orders' && c.op === 'upsert');

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    existing = new Set();
    requireUser.mockResolvedValue(USER);
    getSupabaseClient.mockReturnValue(fakeSupabase());
  });

  test('importe pour le bon canal, avec la clé de dédoublonnage (user, canal, source_ref)', async () => {
    const res = await run({ source: 'etsy', rows: [row(), row({ source_ref: 'A2' })] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ imported: 2, duplicates: 0, invalid: 0, invalid_date: 0, total_rows: 2 });
    expect(upserted().opts).toEqual({ onConflict: 'user_id,channel,source_ref', ignoreDuplicates: true });
    expect(upserted().payload[0]).toMatchObject({ user_id: 'user-1', channel: 'etsy', source_ref: 'A1', order_date: '2024-03-14', status: 'pending', commission_rate: 11 });
  });

  test('réimport : les commandes déjà là sont comptées en doublons, pas réécrites', async () => {
    existing.add('A1');
    const res = await run({ source: 'etsy', rows: [row(), row({ source_ref: 'A2' }), row({ source_ref: 'A2' })] });
    expect(res.body).toMatchObject({ imported: 1, duplicates: 2 }); // A1 existant + A2 répété dans le lot
  });

  test('refuse une source inconnue ou non importable, un lot vide ou trop gros', async () => {
    expect((await run({ source: 'amazon', rows: [row()] })).statusCode).toBe(400);
    expect((await run({ source: 'vinted', rows: [row()] })).statusCode).toBe(400);
    expect((await run({ source: 'etsy', rows: [] })).statusCode).toBe(400);
    expect((await run({ source: 'etsy', rows: Array.from({ length: 5001 }, (_, i) => row({ source_ref: `R${i}` })) })).statusCode).toBe(400);
  });

  test('lignes douteuses : date illisible comptée, montants et textes bornés, taux hors 0-100 ignoré', async () => {
    const res = await run({
      source: 'etsy',
      rows: [
        row({ source_ref: 'B1', date: 'n/importe/quoi' }),
        row({ source_ref: 'B2', total: Infinity }),
        row({ source_ref: 'B3', total: 'dix' }),
        row({ source_ref: 'B4', customer_name: 'x'.repeat(500), commission_rate: 250, status: 'hacked', items: [{ name: 'y'.repeat(500), quantity: -3, price: Infinity }] }),
        null,
        row({ source_ref: 'x'.repeat(201) }),
      ],
    });
    expect(res.body).toMatchObject({ imported: 1, invalid_date: 1, invalid: 4 });
    const [kept] = upserted().payload;
    expect(kept.customer_name).toHaveLength(200);
    expect(kept.items).toEqual([{ name: 'y'.repeat(200), quantity: 1, price: 0 }]);
    expect(kept.commission_rate).toBeUndefined();
    expect(kept.status).toBe('pending');
    expect(kept.raw_payload).toEqual({ imported_from_csv: true, source: 'etsy' });
  });

  test('une source sans frais ignore le taux envoyé', () => {
    const { order } = cleanRow(row({ commission_rate: 20 }), { id: 'kofi', commission: { mode: 'none' }, defaultStatus: 'pending' }, 'u');
    expect(order.commission_rate).toBeUndefined();
  });

  test("l'import Ko-fi historique (sans source) n'est pas affecté", async () => {
    const res = await run({ rows: [{ transaction_id: 't1', timestamp: '2026-03-04', type: 'Shop Order', amount: 12.5, items: [{ name: 'Print', quantity: 1 }] }] });
    expect(res.statusCode).toBe(200);
    expect(upserted().opts).toEqual({ onConflict: 'user_id,kofi_transaction_id' });
    expect(upserted().payload[0].channel).toBe('kofi');
  });

  test('importableSource : Etsy oui, Ko-fi / Vinted non', () => {
    expect(importableSource('etsy')).toBeTruthy();
    expect(importableSource('kofi')).toBeNull();
    expect(importableSource('vinted')).toBeNull();
    expect(typeof importSourceOrders).toBe('function');
  });
});
