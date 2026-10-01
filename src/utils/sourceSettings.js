// Réglages des sources propres à l'utilisatrice : quelles sources sont actives, et le taux de frais proposé par défaut.
// Gardés dans le navigateur (par compte, voir userScope) : ce sont des préférences d'affichage, pas des données de vente.
import { SOURCES, getSource } from '../domain/sources';
import { scopedKey } from './userScope';

const KEY = () => scopedKey('cashly.sources');
export const SOURCES_CHANGED = 'cashly:sources-changed';

// Forme : { enabled: { etsy: false, depop: true }, rates: { etsy: 12.5 } } — seuls les écarts au registre sont stockés.
export const emptySettings = () => ({ enabled: {}, rates: {} });

export function readSourceSettings() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY()) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptySettings();
    return { enabled: { ...(parsed.enabled || {}) }, rates: { ...(parsed.rates || {}) } };
  } catch (e) {
    return emptySettings();
  }
}

export function writeSourceSettings(settings) {
  try { window.localStorage.setItem(KEY(), JSON.stringify(settings)); } catch (e) { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(SOURCES_CHANGED)); } catch (e) { /* hors navigateur */ }
}

export const isSourceEnabled = (settings, id) => {
  const source = getSource(id);
  if (!source) return false;
  const chosen = settings && settings.enabled ? settings.enabled[id] : undefined;
  return typeof chosen === 'boolean' ? chosen : source.enabledByDefault;
};

// Taux de frais proposé pour une source : celui saisi dans Réglages, sinon celui du registre (0 sans frais).
export const rateFor = (settings, id) => {
  const source = getSource(id);
  if (!source || source.commission.mode !== 'rate') return 0;
  const own = settings && settings.rates ? Number(settings.rates[id]) : NaN;
  return Number.isFinite(own) && own >= 0 && own <= 100 ? own : source.commission.defaultRate;
};

// Sources à proposer dans un sélecteur ou un filtre : celles activées + celles déjà utilisées par des commandes
// (désactiver une source ne doit jamais masquer ses ventes existantes).
export function visibleSources(settings, orders = []) {
  const used = new Set(orders.map((o) => o.channel));
  return SOURCES.filter((s) => isSourceEnabled(settings, s.id) || used.has(s.id));
}
