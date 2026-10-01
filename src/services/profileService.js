// Profil de l'utilisateur (route /api/profile) : nom affiché, token Ko-fi, espace de travail.
import { apiClient } from '../api/client';

export const getProfile = () => apiClient.get('/profile');

// Modification partielle ; renvoie le profil à jour.
export const updateProfile = (changes) => apiClient.patch('/profile', changes);

export const saveDisplayName = (name) => updateProfile({ display_name: name.trim() || null });

export const saveKofiToken = (token) => updateProfile({ kofi_verification_token: token.trim() });

export const clearKofiToken = () => updateProfile({ kofi_verification_token: null });
