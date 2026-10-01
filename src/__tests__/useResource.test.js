import { renderHook, act, waitFor } from '@testing-library/react';
import { useResource } from '../data/useResource';
import { apiClient } from '../api/client';

jest.mock('../api/client', () => ({ apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }));

describe('useResource', () => {
  test("un rafraîchissement parti avant une création ne l'écrase pas", async () => {
    let resolveSlow;
    // 1er appel (montage) : réponse immédiate ; 2e appel (refresh manuel) : réponse lente et périmée.
    apiClient.get.mockResolvedValueOnce([{ id: 'a' }]).mockImplementationOnce(() => new Promise((r) => { resolveSlow = r; }));
    apiClient.post.mockResolvedValue({ id: 'new' });

    const { result } = renderHook(() => useResource('/orders', { prepend: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let slow;
    act(() => { slow = result.current.refresh(); });
    await act(async () => { await result.current.create({ total: 1 }); });
    expect(result.current.items.map((i) => i.id)).toEqual(['new', 'a']);

    await act(async () => { resolveSlow([{ id: 'a' }]); await slow; }); // réponse périmée : ignorée
    expect(result.current.items.map((i) => i.id)).toEqual(['new', 'a']);
  });
});
