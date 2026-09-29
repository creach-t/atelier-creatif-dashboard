import { dayInParis } from '../utils/dates';
import { normalizeKofiCsvRows } from '../utils/normalizeKofiCsv';
import { mapKofiPayload } from '../../api/lib/kofiMapper';

describe('dates en fuseau Paris', () => {
  it("bascule sur le jour suivant après minuit heure de Paris (UTC+2 en été)", () => {
    expect(dayInParis(new Date('2026-07-14T22:30:00Z'))).toBe('2026-07-15');
  });

  it('reste sur le même jour en journée', () => {
    expect(dayInParis(new Date('2026-01-15T10:30:00Z'))).toBe('2026-01-15');
  });

  it('applique la même règle au webhook Ko-fi', () => {
    const order = mapKofiPayload({ type: 'Donation', amount: '3.00', timestamp: '2026-07-14T22:30:00Z' });
    expect(order.order_date).toBe('2026-07-15');
  });

  it("applique la même règle à l'import CSV (MM/DD/YYYY HH:MM en UTC)", () => {
    const [row] = normalizeKofiCsvRows([
      { TransactionId: 't1', 'DateTime (UTC)': '07/14/2026 22:30', Received: '3.00', Given: '0' },
    ]);
    expect(row.timestamp).toBe('2026-07-15');
  });
});
