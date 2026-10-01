import { renderHook, waitFor } from '@testing-library/react';
import { useAccount } from '../data/useAccount';
import { getCurrentEmail } from '../services/authService';
import { getProfile } from '../services/profileService';

jest.mock('../services/authService', () => ({ getCurrentEmail: jest.fn() }));
jest.mock('../services/profileService', () => ({ getProfile: jest.fn() }));

describe('useAccount', () => {
  test('expose email et nom affiché', async () => {
    getCurrentEmail.mockResolvedValue('a@ex.fr');
    getProfile.mockResolvedValue({ display_name: 'Alice' });
    const { result } = renderHook(() => useAccount());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ email: 'a@ex.fr', displayName: 'Alice', error: null });
  });

  test("profil en échec : l'email reste disponible et l'erreur est remontée", async () => {
    getCurrentEmail.mockResolvedValue('a@ex.fr');
    getProfile.mockRejectedValue(new Error('réseau'));
    const { result } = renderHook(() => useAccount());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.email).toBe('a@ex.fr');
    expect(result.current.displayName).toBe('');
    expect(result.current.error.message).toBe('réseau');
  });

  test("profil vide (jamais créé) : nom affiché vide, pas d'erreur", async () => {
    getCurrentEmail.mockResolvedValue('a@ex.fr');
    getProfile.mockResolvedValue(null);
    const { result } = renderHook(() => useAccount());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ displayName: '', error: null });
  });
});
