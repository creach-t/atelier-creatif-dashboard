import { apiClient } from '../../api/client';

// Deux couches : localStorage (instantané, hors-ligne, fonctionne sans migration SQL) et le profil côté
// serveur (suit l'utilisatrice d'un appareil à l'autre). Le serveur est optionnel : s'il échoue (colonne
// `workspace` pas encore créée, réseau coupé), l'app continue en local sans rien afficher.
const KEY = 'cashly.workspace.v1';

export const loadLocal = () => {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveLocal = (ws) => {
  try { window.localStorage.setItem(KEY, JSON.stringify(ws)); } catch (e) { /* stockage indisponible */ }
};

export const clearLocal = () => {
  try { window.localStorage.removeItem(KEY); } catch (e) { /* stockage indisponible */ }
};

export const loadRemote = async () => {
  try {
    const profile = await apiClient.get('/profile');
    return (profile && profile.workspace) || null;
  } catch (e) {
    return null;
  }
};

// Le serveur répond « workspace_unsupported » tant que la migration 0010 n'est pas passée : on arrête alors
// d'envoyer pour la session au lieu de retenter (et de faire échouer) chaque modification.
let remoteUnsupported = false;

export const saveRemote = async (ws) => {
  if (remoteUnsupported) return false;
  try {
    await apiClient.patch('/profile', { workspace: ws });
    return true;
  } catch (e) {
    if (e && e.message === 'workspace_unsupported') remoteUnsupported = true;
    return false;
  }
};
