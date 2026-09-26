import { mapKofiPayload } from '../../api/lib/kofiMapper';

describe('mapKofiPayload', () => {
  it('maps a simple donation payload', () => {
    const payload = {
      verification_token: 'secret',
      type: 'Donation',
      from_name: 'Marie Dubois',
      email: 'marie@example.com',
      amount: '5.00',
      timestamp: '2026-01-15T10:30:00Z',
      kofi_transaction_id: 'txn-001',
      shop_items: null,
      shipping: null,
    };

    const order = mapKofiPayload(payload);

    expect(order.channel).toBe('kofi');
    expect(order.customer_name).toBe('Marie Dubois');
    expect(order.customer_email).toBe('marie@example.com');
    expect(order.total).toBe(5);
    expect(order.order_date).toBe('2026-01-15');
    expect(order.kofi_transaction_id).toBe('txn-001');
    expect(order.items).toEqual([{ name: 'Don Ko-fi', quantity: 1, price: 5 }]);
    expect(order.shipping).toBeNull();
  });

  it('maps a shop order payload with shop_items', () => {
    const payload = {
      verification_token: 'secret',
      type: 'Shop Order',
      from_name: 'Pierre Martin',
      email: 'pierre@example.com',
      amount: '28.50',
      timestamp: '2026-02-01T09:00:00Z',
      kofi_transaction_id: 'txn-002',
      shop_items: [
        { variation_name: 'Sticker Chat Kawaii', quantity: 3 },
        { direct_link_code: 'figurine-licorne', quantity: 1 },
      ],
      shipping: { full_name: 'Pierre Martin', street_address: '1 rue de Paris' },
    };

    const order = mapKofiPayload(payload);

    expect(order.items).toEqual([
      { name: 'Sticker Chat Kawaii', quantity: 3 },
      { name: 'figurine-licorne', quantity: 1 },
    ]);
    expect(order.total).toBe(28.5);
    expect(order.shipping).toBe('standard');
  });

  it('falls back to a generic label for unknown types', () => {
    const payload = {
      type: 'Something Else',
      amount: '2.00',
    };

    const order = mapKofiPayload(payload);

    expect(order.items).toEqual([{ name: 'Support Ko-fi', quantity: 1, price: 2 }]);
  });

  it('throws on an invalid payload', () => {
    expect(() => mapKofiPayload(null)).toThrow('Invalid Ko-fi payload');
  });
});
